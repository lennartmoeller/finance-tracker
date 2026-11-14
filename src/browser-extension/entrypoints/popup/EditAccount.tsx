import { useState, type SubmitEvent } from "react";
import { Trash } from "lucide-react";
import { accountNameIssue } from "@finance-tracker/shared/account-name";
import { accountTypeNames } from "@finance-tracker/shared/account-type-names";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Account } from "@finance-tracker/shared/contract";
import { apiClient } from "../../api.ts";
import { BankLogo } from "./BankLogo.tsx";

type Api = Awaited<ReturnType<typeof apiClient>>;

export function EditAccount({
  account,
  accounts,
  onClose,
  onChanged,
}: {
  account: Account;
  accounts: Account[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [name, setName] = useState(account.name);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const nameIssue = accountNameIssue(
    accounts,
    account.bank,
    name.trim(),
    account.id,
  );
  const typeName = accountTypeNames[account.type];
  const cancel = (
    <button type="button" className="button secondary" onClick={onClose}>
      Cancel
    </button>
  );

  async function submit(
    event: SubmitEvent<HTMLFormElement>,
    change: (api: Api) => Promise<unknown>,
  ) {
    event.preventDefault();
    try {
      await change(await apiClient());
      onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }

  return (
    <div
      className="overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {removing ? (
        <form
          key="remove"
          className="dialog swap"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          onSubmit={(event) =>
            void submit(event, (api) => api.account.remove({ id: account.id }))
          }
        >
          <div className="dialog-icon">
            <Trash />
          </div>
          <h2 id="dialog-title">Remove “{account.name}”?</h2>
          <p className="dialog-text">
            This deletes the {account.bank} {typeName.toLowerCase()} and all its
            transactions. It can't be undone.
          </p>
          <label className="label confirm-label" htmlFor="confirmation">
            Type <strong>{account.name}</strong> to confirm
          </label>
          <input
            className="input"
            id="confirmation"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
            }}
          />
          <p className="field-msg error">{error}</p>
          <div className="dialog-actions">
            {cancel}
            <button
              className="button danger"
              disabled={confirmation.trim() !== account.name}
            >
              Remove
            </button>
          </div>
        </form>
      ) : (
        <form
          key="edit"
          className="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          onSubmit={(event) =>
            void submit(event, (api) =>
              api.account.update({
                id: account.id,
                name: name.trim(),
                startBalance: account.startBalance,
                closed: account.closed,
              }),
            )
          }
        >
          <div className="dialog-head">
            <BankLogo bank={account.bank} size="medium" />
            <div>
              <h2 id="dialog-title">Edit account</h2>
              <p className="subtitle">
                {account.bank} · {typeName}
              </p>
            </div>
          </div>
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
            value={name}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <p className="field-msg error">{nameIssue ?? error}</p>
          <div className="dialog-actions">
            {cancel}
            <button
              className="button primary"
              disabled={
                !name.trim() || name.trim() === account.name || !!nameIssue
              }
            >
              Save
            </button>
          </div>
          <div className="dialog-danger">
            <button
              type="button"
              className="button ghost-danger"
              onClick={() => {
                setRemoving(true);
                setError("");
              }}
            >
              <Trash />
              Remove account
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
