import { Fragment, useState, type ChangeEvent, type SubmitEvent } from "react";
import { Check } from "lucide-react";
import {
  accountNumberIssue,
  groupAccountNumber,
  type AccountNumberFormat,
} from "@finance-tracker/shared/account-number";
import { accountTypeNames } from "@finance-tracker/shared/account-types";
import type { Bank } from "@finance-tracker/shared/bank";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Account } from "@finance-tracker/shared/contract";
import { apiClient } from "../../api.ts";
import { banks } from "../../banks.ts";
import { accountNameIssue } from "./account-name.ts";
import { BankLogo } from "./BankLogo.tsx";

const accountTypes = (bank: Bank) =>
  Object.keys(bank.accounts) as Account["type"][];

export function AddAccount({
  accounts,
  onAdded,
}: {
  accounts: Account[];
  onAdded: (account: Account) => void;
}) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState<Bank>();
  const [type, setType] = useState<Account["type"]>();
  const [number, setNumber] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const format = type && bank?.accounts[type];
  const iban = format?.label === "IBAN";
  const nameIssue = bank && accountNameIssue(accounts, bank.name, name.trim());
  const numberIssue =
    bank &&
    format &&
    (accountNumberIssue(bank.name, format, number) ??
      (accounts.some(
        (account) => account.bank === bank.name && account.number === number,
      )
        ? `${bank.name} already has an account with this number.`
        : undefined));
  const complete = number.length === format?.length;
  const numberError = complete || touched ? numberIssue : undefined;

  function choose(nextBank: Bank, nextType: Account["type"] | undefined) {
    setBank(nextBank);
    setType(nextType);
    setNumber("");
    setTouched(false);
  }

  function typeNumber(
    event: ChangeEvent<HTMLInputElement>,
    { length, groups }: AccountNumberFormat,
  ) {
    const input = event.currentTarget;
    const clean = (text: string) =>
      iban
        ? text.toUpperCase().replace(/[^A-Z\d]/g, "")
        : text.replace(/\D/g, "");
    let typed = clean(input.value);
    let caret = clean(
      input.value.slice(0, input.selectionStart ?? undefined),
    ).length;
    // A backspace after a group's space deletes only the space, which grouping puts back, so it deletes the character before the space instead.
    if (
      typed === number &&
      caret > 0 &&
      (event.nativeEvent as InputEvent).inputType === "deleteContentBackward"
    ) {
      typed = typed.slice(0, caret - 1) + typed.slice(caret);
      caret--;
    }
    typed = typed.slice(0, length);
    input.value = groupAccountNumber(typed, groups);
    const position = groupAccountNumber(typed.slice(0, caret), groups).length;
    input.setSelectionRange(position, position);
    setNumber(typed);
  }

  async function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bank || !type) return;
    try {
      onAdded(
        await (
          await apiClient()
        ).account.create({ name: name.trim(), bank: bank.name, type, number }),
      );
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }

  return (
    <form className="form" onSubmit={(event) => void add(event)}>
      <div className="field">
        <label className="label" htmlFor="name">
          Name
        </label>
        <input
          className={nameIssue ? "input invalid" : "input"}
          id="name"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          maxLength={40}
          placeholder="e.g. Everyday spending"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <p className="field-msg error">{nameIssue}</p>
      </div>
      <div className="field">
        <span className="label" id="bank-label">
          Bank
        </span>
        <div className="banks" role="radiogroup" aria-labelledby="bank-label">
          {banks.map((option) => (
            <button
              type="button"
              key={option.name}
              className="bank"
              role="radio"
              aria-checked={option === bank}
              onClick={() => {
                const types = accountTypes(option);
                choose(option, types.length === 1 ? types[0] : undefined);
              }}
            >
              <BankLogo bank={option.name} size="medium" />
              {option.name}
            </button>
          ))}
        </div>
      </div>
      {bank && (
        <Fragment key={bank.name}>
          <div className="field reveal">
            <span className="label" id="type-label">
              Type
            </span>
            <div
              className="pills"
              role="radiogroup"
              aria-labelledby="type-label"
            >
              {accountTypes(bank).map((option) => (
                <button
                  type="button"
                  key={option}
                  className="pill"
                  role="radio"
                  aria-checked={option === type}
                  onClick={() => {
                    if (option !== type) choose(bank, option);
                  }}
                >
                  {accountTypeNames[option]}
                </button>
              ))}
            </div>
          </div>
          {format && (
            <div className="field reveal" key={type}>
              <label className="label" htmlFor="number">
                {format.label}
              </label>
              <div
                className={
                  complete && !numberIssue ? "input-wrap valid" : "input-wrap"
                }
              >
                <input
                  className={numberError ? "input mono invalid" : "input mono"}
                  id="number"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  inputMode={iban ? "text" : "numeric"}
                  placeholder={groupAccountNumber(
                    (iban ? "DE" : "").padEnd(format.length, "0"),
                    format.groups,
                  )}
                  value={groupAccountNumber(number, format.groups)}
                  onChange={(event) => {
                    typeNumber(event, format);
                  }}
                  onBlur={() => {
                    if (number) setTouched(true);
                  }}
                />
                <Check className="valid-icon" />
              </div>
              <p className={numberError ? "field-msg error" : "field-msg"}>
                {numberError ??
                  (number
                    ? ""
                    : iban
                      ? `German IBAN, ${format.length.toString()} characters`
                      : `${format.length.toString()} digits`)}
              </p>
            </div>
          )}
        </Fragment>
      )}
      <p className="field-msg error">{error}</p>
      <button
        className="button primary block"
        disabled={!name.trim() || !!nameIssue || !format || !!numberIssue}
      >
        Add account
      </button>
    </form>
  );
}
