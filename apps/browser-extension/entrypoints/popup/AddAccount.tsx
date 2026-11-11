import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { Check } from "lucide-react";
import {
  accountNumberFormats,
  accountNumberIssue,
  groupAccountNumber,
} from "@finance-tracker/bank-data-api/account-number";
import { accountTypeNames } from "@finance-tracker/bank-data-api/account-type-names";
import { bank as banks } from "@finance-tracker/bank-data-api/bank";
import { errorMessage } from "@finance-tracker/bank-data-api/client";
import type { Account } from "@finance-tracker/bank-data-api/contract";
import { apiClient } from "../../api.ts";
import { accountNameTaken } from "./account-name.ts";
import { BankLogo } from "./BankLogo.tsx";

export function AddAccount({
  accounts,
  onAdded,
}: {
  accounts: Account[];
  onAdded: (account: Account) => void;
}) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState<Account["bank"]>();
  const [type, setType] = useState<Account["type"]>();
  const [number, setNumber] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const format = bank && type && accountNumberFormats[bank][type];
  const nameError = bank && accountNameTaken(accounts, bank, name.trim());
  const numberIssue =
    bank && format
      ? (accountNumberIssue(bank, format, number) ??
        (accounts.some(
          (account) => account.bank === bank && account.number === number,
        )
          ? `${bank} already has an account with this number.`
          : undefined))
      : undefined;
  const complete = format?.length === number.length;
  const numberError = complete || touched ? numberIssue : undefined;

  function selectType(next: Account["type"] | undefined) {
    setType(next);
    setNumber("");
    setTouched(false);
  }

  function formatNumber(event: ChangeEvent<HTMLInputElement>) {
    if (!format) return;
    const input = event.currentTarget;
    const clean = (text: string) =>
      format.label === "IBAN"
        ? text.toUpperCase().replace(/[^A-Z0-9]/g, "")
        : text.replace(/\D/g, "");
    let caret = clean(
      input.value.slice(0, input.selectionStart ?? undefined),
    ).length;
    let raw = clean(input.value);
    // Backspace right after a group's space deletes only the space, which grouping would put back, so it deletes the character before the space instead.
    if (
      (event.nativeEvent as InputEvent).inputType === "deleteContentBackward" &&
      raw === number &&
      caret > 0
    ) {
      raw = raw.slice(0, caret - 1) + raw.slice(caret);
      caret -= 1;
    }
    raw = raw.slice(0, format.length);
    const grouped = groupAccountNumber(raw, format.groups);
    let position = 0;
    for (let seen = 0; position < grouped.length && seen < caret; position++)
      if (grouped[position] !== " ") seen++;
    input.value = grouped;
    input.setSelectionRange(position, position);
    setNumber(raw);
  }

  async function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bank || !type) return;
    try {
      onAdded(
        await (
          await apiClient()
        ).account.create({ name: name.trim(), bank, type, number }),
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
          className={nameError ? "input invalid" : "input"}
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
        <p className="field-msg error">{nameError}</p>
      </div>
      <div className="field">
        <span className="label" id="bank-label">
          Bank
        </span>
        <div className="banks" role="radiogroup" aria-labelledby="bank-label">
          {banks.options.map((option) => (
            <button
              type="button"
              key={option}
              className="bank"
              role="radio"
              aria-checked={bank === option}
              onClick={() => {
                const types = Object.keys(
                  accountNumberFormats[option],
                ) as Account["type"][];
                setBank(option);
                selectType(types.length === 1 ? types[0] : undefined);
              }}
            >
              <BankLogo bank={option} size="medium" />
              {option}
            </button>
          ))}
        </div>
      </div>
      {bank && (
        <div className="field reveal" key={bank}>
          <span className="label" id="type-label">
            Type
          </span>
          <div className="pills" role="radiogroup" aria-labelledby="type-label">
            {(Object.keys(accountNumberFormats[bank]) as Account["type"][]).map(
              (option) => (
                <button
                  type="button"
                  key={option}
                  className="pill"
                  role="radio"
                  aria-checked={type === option}
                  onClick={() => {
                    if (option !== type) selectType(option);
                  }}
                >
                  {accountTypeNames[option]}
                </button>
              ),
            )}
          </div>
        </div>
      )}
      {format && (
        <div className="field reveal" key={`${bank}-${type}`}>
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
              inputMode={format.label === "IBAN" ? "text" : "numeric"}
              placeholder={groupAccountNumber(
                (format.label === "IBAN" ? "DE" : "").padEnd(
                  format.length,
                  "0",
                ),
                format.groups,
              )}
              onChange={formatNumber}
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
                : format.label === "IBAN"
                  ? `German IBAN, ${format.length.toString()} characters`
                  : `${format.length.toString()} digits`)}
          </p>
        </div>
      )}
      <p className="field-msg error">{error}</p>
      <button
        className="button primary block"
        disabled={!name.trim() || !!nameError || !format || !!numberIssue}
      >
        Add account
      </button>
    </form>
  );
}
