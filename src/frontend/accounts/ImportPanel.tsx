import { useState } from "react";
import { CircleCheck, Upload } from "lucide-react";
import type { ExportFile } from "@finance-tracker/shared/bank";
import type { Account } from "@finance-tracker/shared/contract";
import { errorMessage } from "@finance-tracker/shared/error-message";
import type { Change } from "../App.tsx";
import { bankLogo } from "../banks.ts";
import { formatCount } from "../format.ts";
import { Panel } from "../Panel.tsx";

type Result = { imported: number; skipped: number } | { error: string };

export function ImportPanel({
  account,
  exportFile,
  onChange,
  onClose,
}: {
  account: Account;
  exportFile: ExportFile;
  onChange: Change;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<Result>();

  async function importFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setResult(undefined);
    try {
      const bytes = await file.arrayBuffer();
      setResult(
        await onChange((api) =>
          api.sync({
            accountId: account.id,
            ...exportFile.read(bytes, account.number),
          }),
        ),
      );
    } catch (failure) {
      setResult({ error: errorMessage(failure) });
    }
    setBusy(false);
  }

  return (
    <Panel
      label={`Import a file into ${account.name}`}
      head={
        <>
          <img className="logo" src={bankLogo(account.bank)} alt="" />
          <div className="panel-title">
            <div className="panel-name">{account.name}</div>
            <div className="panel-subtitle">Import a file</div>
          </div>
        </>
      }
      onClose={onClose}
    >
      <div className="edit-form">
        <div>
          <span className="edit-label">Import transactions</span>
          <p className="import-help">
            {exportFile.download} Transactions already stored are skipped.
          </p>
        </div>
        <div
          className={dragging ? "drop-zone dragging" : "drop-zone"}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => {
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void importFile(event.dataTransfer.files[0]);
          }}
        >
          <Upload />
          {busy ? (
            <span>Importing…</span>
          ) : (
            <>
              <span>Drop the file here, or</span>
              <label className="button secondary">
                Choose file
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={(event) => {
                    void importFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            </>
          )}
        </div>
        {result &&
          ("error" in result ? (
            <p className="import-status edit-error" role="alert">
              {result.error}
            </p>
          ) : (
            <p className="import-status">
              <CircleCheck />
              {result.imported
                ? `${formatCount(result.imported)} new`
                : "Nothing new"}{" "}
              · {formatCount(result.skipped)} skipped
            </p>
          ))}
      </div>
    </Panel>
  );
}
