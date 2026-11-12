begin;

create table accounts (
  id integer primary key generated always as identity,
  name text not null,
  bank text not null,
  type text not null,
  number text not null,
  last_synced_at timestamptz,
  constraint accounts_bank_number_key unique (bank, number),
  constraint accounts_bank_name_key unique (bank, name),
  constraint accounts_name_filled check (name <> ''),
  constraint accounts_bank_known check (bank in ('Deutsche Bank', 'finvesto', 'ING', 'Trade Republic')),
  constraint accounts_type_known check (type in ('cash', 'depot')),
  constraint accounts_number_filled check (number <> '')
);

create table transactions (
  id integer primary key generated always as identity,
  account_id integer not null references accounts on delete cascade,
  shape_version integer not null,
  identity text not null,
  data jsonb not null,
  unique (account_id, identity),
  constraint transactions_identity_filled check (identity <> '')
);

create table securities (
  isin text primary key,
  name text not null,
  named_by text not null,
  constraint securities_isin_format check (isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  constraint securities_name_filled check (name <> ''),
  constraint securities_named_by_known check (named_by in ('Deutsche Bank', 'finvesto', 'ING', 'Trade Republic'))
);

create table prices (
  isin text not null references securities,
  date date not null,
  price numeric not null,
  primary key (isin, date),
  constraint prices_price_positive check (price > 0),
  constraint prices_date_weekday check (extract(isodow from date) < 6)
);

create table cash_transactions (
  transaction_id integer primary key references transactions on delete cascade,
  date date not null,
  amount numeric not null,
  currency text not null,
  counterparty text,
  description text,
  constraint cash_transactions_amount_in_cents check (scale(amount) = 2),
  constraint cash_transactions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint cash_transactions_counterparty_filled check (counterparty <> ''),
  constraint cash_transactions_description_filled check (description <> '')
);

create table depot_transactions (
  transaction_id integer primary key references transactions on delete cascade,
  date date not null,
  isin text not null references securities,
  type text not null,
  quantity numeric,
  amount numeric,
  currency text,
  description text,
  -- A check passes on null, so "is true" turns a missing quantity or amount into a violation.
  constraint depot_transactions_fields_of_type check ((
    (type = 'trade' and quantity <> 0 and sign(amount) = sign(quantity))
    or (type = 'reinvestment' and quantity > 0 and amount is null)
    or (type = 'fee' and quantity < 0 and amount is null)
    or (type = 'tax' and quantity < 0 and amount is null)
    or (type = 'distribution' and quantity is null and amount > 0)
  ) is true),
  constraint depot_transactions_amount_in_cents check (scale(amount) = 2),
  constraint depot_transactions_currency_with_amount check ((amount is null) = (currency is null)),
  constraint depot_transactions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint depot_transactions_description_filled check (description <> '')
);

create table brands (
  id integer primary key generated always as identity,
  name text not null unique,
  pattern text not null,
  domain text not null unique,
  constraint brands_name_filled check (name <> ''),
  -- PostgreSQL raises on an invalid pattern, and a pattern that matches the empty string matches every counterparty.
  constraint brands_pattern_valid check (not ('' ~* pattern)),
  constraint brands_domain_format check (domain ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$')
);

create table logos (
  id integer primary key generated always as identity,
  domain text unique,
  isin text unique references securities,
  image bytea,
  constraint logos_one_identifier check ((domain is null) <> (isin is null)),
  constraint logos_domain_format check (domain ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$')
);

create function require_account_type() returns trigger language plpgsql as $$
begin
  if not exists (
    select from transactions
    join accounts on accounts.id = transactions.account_id
    where transactions.id = new.transaction_id and accounts.type = tg_argv[0]
  ) then
    raise exception '% takes only the transactions of % accounts.', tg_table_name, tg_argv[0] using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger cash_transactions_account_type before insert or update of transaction_id on cash_transactions
  for each row execute function require_account_type('cash');

create trigger depot_transactions_account_type before insert or update of transaction_id on depot_transactions
  for each row execute function require_account_type('depot');

create function reject_change() returns trigger language plpgsql as $$
begin
  raise exception '%', tg_argv[0] using errcode = 'check_violation';
end
$$;

create trigger transactions_unchanged before update on transactions
  for each row execute function reject_change('A raw transaction never changes.');

create trigger accounts_bank_and_type_unchanged before update of bank, type on accounts
  for each row when (old.bank <> new.bank or old.type <> new.type)
  execute function reject_change('An account keeps its bank and type.');

commit;
