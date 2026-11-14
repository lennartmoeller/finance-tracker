import { useState, type ReactNode } from "react";
import { Trash } from "lucide-react";
import { errorMessage } from "@finance-tracker/shared/error-message";
import { Panel } from "./Panel.tsx";

export type Removal = {
  label: string;
  question: string;
  confirmation?: string;
  remove: () => Promise<void>;
};

export function EditPanel({
  title,
  icon,
  subtitle,
  saveLabel = "Save",
  onSave,
  removal,
  onClose,
  children,
}: {
  title: string;
  icon?: ReactNode;
  subtitle: ReactNode;
  saveLabel?: string;
  onSave: (() => Promise<void>) | undefined;
  removal: Removal | undefined;
  onClose: () => void;
  children: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      onClose();
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <Panel
      label={title}
      head={
        <>
          {icon}
          <div className="panel-title">
            <div className="panel-name">{title}</div>
            <div className="panel-subtitle">{subtitle}</div>
          </div>
        </>
      }
      onClose={onClose}
    >
      <form
        className="edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (onSave) void run(onSave);
        }}
      >
        {children}
        <div className="edit-actions">
          <button className="button primary" disabled={!onSave || busy}>
            {saveLabel}
          </button>
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
        {error && (
          <p className="edit-error" role="alert">
            {error}
          </p>
        )}
      </form>
      {removal &&
        (confirming ? (
          <div className="edit-removal">
            <p>{removal.question}</p>
            {removal.confirmation !== undefined && (
              <>
                <label className="edit-label" htmlFor="confirmation">
                  Type <strong>{removal.confirmation}</strong> to confirm
                </label>
                <input
                  className="input"
                  id="confirmation"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  value={typed}
                  onChange={(event) => {
                    setTyped(event.target.value);
                  }}
                />
              </>
            )}
            <div className="edit-actions">
              <button
                className="button danger"
                disabled={
                  busy ||
                  (removal.confirmation !== undefined &&
                    typed.trim() !== removal.confirmation)
                }
                onClick={() => void run(removal.remove)}
              >
                Delete
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setConfirming(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="edit-removal">
            <button
              className="button ghost-danger"
              onClick={() => {
                setConfirming(true);
                setError("");
              }}
            >
              <Trash />
              {removal.label}
            </button>
          </div>
        ))}
    </Panel>
  );
}
