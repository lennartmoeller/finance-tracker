begin;

create table accounts (
  id integer primary key generated always as identity,
  name text not null,
  bank text not null,
  type text not null,
  number text not null,
  last_synced_at timestamptz,
  start_balance numeric,
  closed boolean not null default false,
  constraint accounts_bank_number_key unique (bank, number),
  constraint accounts_bank_name_key unique (bank, name),
  constraint accounts_name_filled check (name <> ''),
  constraint accounts_bank_known check (bank in ('Deutsche Bank', 'finvesto', 'ING', 'PayPal', 'Sparkasse', 'Trade Republic')),
  constraint accounts_type_known check (type in ('cash', 'depot')),
  constraint accounts_number_filled check (number <> ''),
  constraint accounts_start_balance_of_cash check (type = 'cash' or start_balance is null),
  constraint accounts_start_balance_in_cents check (scale(start_balance) = 2)
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
  counterparty_iban text,
  description text,
  constraint cash_transactions_amount_in_cents check (scale(amount) = 2),
  constraint cash_transactions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint cash_transactions_counterparty_filled check (counterparty <> ''),
  constraint cash_transactions_counterparty_iban_format check (counterparty_iban ~ '^DE\d{20}$'),
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
  domain text not null unique,
  constraint brands_name_filled check (name <> ''),
  constraint brands_domain_format check (domain ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$')
);

create table categories (
  id integer primary key generated always as identity,
  parent_id integer references categories,
  name text not null,
  constraint categories_parent_id_name_key unique nulls not distinct (parent_id, name),
  constraint categories_name_filled check (name <> '')
);

create table rules (
  id integer primary key generated always as identity,
  brand_id integer references brands on delete cascade,
  category_id integer references categories on delete cascade,
  required_brand_id integer references brands,
  counterparty_pattern text,
  description_pattern text,
  constraint rules_one_owner check (num_nonnulls(brand_id, category_id) = 1),
  constraint rules_required_brand_of_category check (required_brand_id is null or category_id is not null),
  constraint rules_condition_given check (num_nonnulls(required_brand_id, counterparty_pattern, description_pattern) > 0),
  -- PostgreSQL raises on an invalid pattern, and a pattern that matches the empty string matches every transaction.
  constraint rules_counterparty_pattern_valid check (not ('' ~* counterparty_pattern)),
  constraint rules_description_pattern_valid check (not ('' ~* description_pattern))
);

create table logos (
  id integer primary key generated always as identity,
  domain text unique references brands (domain) on delete cascade,
  isin text unique references securities,
  image bytea,
  constraint logos_one_identifier check ((domain is null) <> (isin is null)),
  constraint logos_domain_format check (domain ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$')
);

-- A row with a partner pins the two transactions together as a transfer; a row without one marks its transaction as no transfer.
create table transfer_corrections (
  transaction_id integer primary key references transactions on delete cascade,
  partner_id integer unique references transactions on delete cascade,
  constraint transfer_corrections_partner_other check (partner_id <> transaction_id)
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

create function require_leaf_category() returns trigger language plpgsql as $$
begin
  if exists (select from categories where parent_id = new.category_id) then
    raise exception 'Only a category without subcategories has rules.' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger rules_on_leaf_category before insert or update of category_id on rules
  for each row execute function require_leaf_category();

create function require_category_tree() returns trigger language plpgsql as $$
begin
  if exists (select from rules where category_id = new.parent_id) then
    raise exception 'A category with rules has no subcategories.' using errcode = 'check_violation';
  end if;
  if exists (
    with recursive ancestors (id) as (
      select new.parent_id
      union
      select categories.parent_id from categories join ancestors on categories.id = ancestors.id
    )
    select from ancestors where id = new.id
  ) then
    raise exception 'A category cannot sit below itself.' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger categories_in_tree before insert or update of parent_id on categories
  for each row execute function require_category_tree();

create function require_transfer_pair() returns trigger language plpgsql as $$
begin
  if new.partner_id is null then
    return new;
  end if;
  if not exists (select from transfer_corrections where transaction_id = new.partner_id and partner_id = new.transaction_id) then
    raise exception 'A pinned transfer pins both of its transactions to each other.' using errcode = 'check_violation';
  end if;
  if not exists (
    select from transactions one
    join transactions other on other.id = new.partner_id
    left join cash_transactions one_cash on one_cash.transaction_id = one.id
    left join depot_transactions one_depot on one_depot.transaction_id = one.id
    left join cash_transactions other_cash on other_cash.transaction_id = other.id
    left join depot_transactions other_depot on other_depot.transaction_id = other.id
    where one.id = new.transaction_id
      and one.account_id <> other.account_id
      and coalesce(one_cash.currency, one_depot.currency) = coalesce(other_cash.currency, other_depot.currency)
      and coalesce(one_cash.amount, one_depot.amount) = -coalesce(other_cash.amount, other_depot.amount)
      and coalesce(one_cash.amount, one_depot.amount) <> 0
  ) then
    raise exception 'A pinned transfer joins opposite equal amounts in one currency on two accounts.' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create constraint trigger transfer_corrections_pair after insert or update on transfer_corrections
  deferrable initially deferred
  for each row execute function require_transfer_pair();

commit;
