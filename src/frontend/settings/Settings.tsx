import { useState } from "react";
import type { Settings as InstallationSettings } from "@finance-tracker/shared/contract";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Change, Loading } from "../App.tsx";
import { Field } from "../Field.tsx";
import { formatDate, parseDateInput } from "../format.ts";
import { Loaded } from "../Loaded.tsx";
import "./settings.css";

const skeleton = (
  <div className="edit-form settings-form">
    <span className="skeleton" />
    <span className="skeleton field-skeleton" />
  </div>
);

export function Settings({
  loading,
  onChange,
}: {
  loading: Loading;
  onChange: Change;
}) {
  return (
    <>
      <header className="page-head plain">
        <h1>Settings</h1>
      </header>
      <Loaded loading={loading} skeleton={skeleton}>
        {(data) => (
          <SettingsForm settings={data.settings} onChange={onChange} />
        )}
      </Loaded>
    </>
  );
}

function SettingsForm({
  settings,
  onChange,
}: {
  settings: InstallationSettings;
  onChange: Change;
}) {
  const [start, setStart] = useState(
    settings.transactionsStart === null
      ? ""
      : formatDate(settings.transactionsStart),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const parsedStart = start.trim() ? parseDateInput(start) : null;
  const changed = parsedStart !== settings.transactionsStart;

  async function save(transactionsStart: string | null) {
    setBusy(true);
    setError("");
    try {
      await onChange((api) => api.settings.update({ transactionsStart }));
    } catch (failure) {
      setError(errorMessage(failure));
    }
    setBusy(false);
  }

  return (
    <form
      className="edit-form settings-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (parsedStart !== undefined) void save(parsedStart);
      }}
    >
      <Field
        id="transactions-start"
        label="Transactions begin on"
        message={
          parsedStart === undefined
            ? "Write a date such as 01.01.2024."
            : "Lists and charts begin on this day, while balances and gains still count every transaction. Empty shows all."
        }
        invalid={parsedStart === undefined}
      >
        <input
          className="input"
          id="transactions-start"
          autoComplete="off"
          inputMode="numeric"
          placeholder="None"
          value={start}
          onChange={(event) => {
            setStart(event.target.value);
          }}
        />
      </Field>
      <div className="edit-actions">
        <button
          className="button primary"
          disabled={!changed || parsedStart === undefined || busy}
        >
          Save
        </button>
      </div>
      {error && (
        <p className="edit-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
