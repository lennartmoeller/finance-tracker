import { useState, type ReactNode } from "react";
import { accountNameIssue } from "@finance-tracker/shared/account-name";
import {
  accountNumberIssue,
  groupAccountNumber,
  takenAccountNumberIssue,
} from "@finance-tracker/shared/account-number";
import { typeAccountNumber } from "@finance-tracker/shared/account-number-input";
import { accountTypeNames } from "@finance-tracker/shared/account-type-names";
import type { Bank } from "@finance-tracker/shared/bank";
import type { Account } from "@finance-tracker/shared/contract";
import type { Change } from "../App.tsx";
import { bankLogo, banks } from "../banks.ts";
import { EditPanel } from "../EditPanel.tsx";
import { formatMoneyInput, parseMoneyInput } from "../format.ts";

type Props = {
  accounts: Account[];
  onChange: Change;
  onClose: () => void;
};

const typesOf = (bank: Bank) => Object.keys(bank.accounts) as Account["type"][];

const syncedBanks = banks.filter((bank) => typesOf(bank).length > 0);

function Field({
  id,
  label,
  message,
  invalid = false,
  children,
}: {
  id: string;
  label: string;
  message?: string | undefined;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="edit-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {message !== undefined && (
        <p className={invalid ? "field-message invalid" : "field-message"}>
          {message}
        </p>
      )}
    </div>
  );
}

function Choices<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [value: Value, content: ReactNode][];
  value: Value | undefined;
  onChange: (value: Value) => void;
}) {
  return (
    <div>
      <span className="edit-label">{label}</span>
      <div className="choices" role="radiogroup" aria-label={label}>
        {options.map(([option, content]) => (
          <button
            type="button"
            key={option}
            className="choice"
            role="radio"
            aria-checked={option === value}
            onClick={() => {
              onChange(option);
            }}
          >
            {content}
          </button>
        ))}
      </div>
    </div>
  );
}

const nameInput = (name: string, setName: (name: string) => void) => (
  <input
    className="input"
    id="name"
    autoComplete="off"
    spellCheck={false}
    maxLength={40}
    placeholder="e.g. Everyday spending"
    value={name}
    onChange={(event) => {
      setName(event.target.value);
    }}
  />
);

export const AccountPanel = ({
  account,
  ...props
}: Props & { account: Account | undefined }) =>
  account ? (
    <EditAccount account={account} {...props} />
  ) : (
    <NewAccount {...props} />
  );

function NewAccount({ accounts, onChange, onClose }: Props) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState<Bank>();
  const [type, setType] = useState<Account["type"]>();
  const [number, setNumber] = useState("");
  const [touched, setTouched] = useState(false);
  const format = bank && type ? bank.accounts[type] : undefined;
  const nameIssue = bank && accountNameIssue(accounts, bank.name, name.trim());
  const numberIssue =
    bank &&
    format &&
    (accountNumberIssue(bank.name, format, number) ??
      takenAccountNumberIssue(accounts, bank.name, number));
  const numberError =
    number.length === format?.length || touched ? numberIssue : undefined;
  const input =
    bank && type && format && name.trim() && !nameIssue && !numberIssue
      ? { name: name.trim(), bank: bank.name, type, number }
      : undefined;

  const choose = (nextBank: Bank, nextType: Account["type"] | undefined) => {
    setBank(nextBank);
    setType(nextType);
    setNumber("");
    setTouched(false);
  };

  return (
    <EditPanel
      title="New account"
      subtitle="Synced in the browser extension's popup"
      saveLabel="Add account"
      onSave={input && (() => onChange((api) => api.account.create(input)))}
      removal={undefined}
      onClose={onClose}
    >
      <Field id="name" label="Name" message={nameIssue ?? ""} invalid>
        {nameInput(name, setName)}
      </Field>
      <Choices
        label="Bank"
        options={syncedBanks.map((option) => [
          option.name,
          <>
            <img className="bank" src={option.logo} alt="" />
            {option.name}
          </>,
        ])}
        value={bank?.name}
        onChange={(chosen) => {
          const next = syncedBanks.find(({ name }) => name === chosen);
          if (!next) return;
          const types = typesOf(next);
          choose(next, types.length === 1 ? types[0] : undefined);
        }}
      />
      {bank && (
        <Choices
          label="Type"
          options={typesOf(bank).map((option) => [
            option,
            accountTypeNames[option],
          ])}
          value={type}
          onChange={(chosen) => {
            if (chosen !== type) choose(bank, chosen);
          }}
        />
      )}
      {format && (
        <Field
          id="number"
          label={format.label}
          message={
            numberError ??
            (format.label === "IBAN"
              ? `German IBAN, ${String(format.length)} characters`
              : `${String(format.length)} digits`)
          }
          invalid={!!numberError}
        >
          <input
            key={`${bank?.name ?? ""}-${type ?? ""}`}
            className="input mono"
            id="number"
            autoComplete="off"
            spellCheck={false}
            inputMode={format.label === "IBAN" ? "text" : "numeric"}
            placeholder={groupAccountNumber(
              (format.label === "IBAN" ? "DE" : "").padEnd(format.length, "0"),
              format.groups,
            )}
            value={groupAccountNumber(number, format.groups)}
            onChange={(event) => {
              setNumber(typeAccountNumber(event, number, format));
            }}
            onBlur={() => {
              if (number) setTouched(true);
            }}
          />
        </Field>
      )}
    </EditPanel>
  );
}

function EditAccount({
  account,
  accounts,
  onChange,
  onClose,
}: Props & { account: Account }) {
  const [name, setName] = useState(account.name);
  const [startBalance, setStartBalance] = useState(
    account.startBalance === null ? "" : formatMoneyInput(account.startBalance),
  );
  const [closed, setClosed] = useState(account.closed);
  const nameIssue = accountNameIssue(
    accounts,
    account.bank,
    name.trim(),
    account.id,
  );
  const parsedStartBalance = startBalance.trim()
    ? parseMoneyInput(startBalance)
    : null;
  const typeName = accountTypeNames[account.type];
  const changed =
    name.trim() !== account.name ||
    parsedStartBalance !== account.startBalance ||
    closed !== account.closed;

  return (
    <EditPanel
      title={account.name}
      icon={<img className="logo" src={bankLogo(account.bank)} alt="" />}
      subtitle={`${account.bank} · ${typeName}`}
      onSave={
        changed && name.trim() && !nameIssue && parsedStartBalance !== undefined
          ? () =>
              onChange((api) =>
                api.account.update({
                  id: account.id,
                  name: name.trim(),
                  startBalance: parsedStartBalance,
                  closed,
                }),
              )
          : undefined
      }
      removal={{
        label: "Delete account",
        question: `This deletes the ${account.bank} ${typeName.toLowerCase()} and all its transactions. It can't be undone.`,
        confirmation: account.name,
        remove: () => onChange((api) => api.account.remove({ id: account.id })),
      }}
      onClose={onClose}
    >
      <Field id="name" label="Name" message={nameIssue ?? ""} invalid>
        {nameInput(name, setName)}
      </Field>
      {account.type === "cash" && (
        <Field
          id="start-balance"
          label="Start balance"
          message={
            parsedStartBalance === undefined
              ? "Write an amount in euros, such as 1.250,00."
              : ""
          }
          invalid={parsedStartBalance === undefined}
        >
          <input
            className="input"
            id="start-balance"
            autoComplete="off"
            inputMode="decimal"
            placeholder="None"
            value={startBalance}
            onChange={(event) => {
              setStartBalance(event.target.value);
            }}
          />
        </Field>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={closed}
          onChange={(event) => {
            setClosed(event.target.checked);
          }}
        />
        Closed
      </label>
    </EditPanel>
  );
}
