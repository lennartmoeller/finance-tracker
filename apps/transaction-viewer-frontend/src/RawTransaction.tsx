import { useState } from "react";
import type {
  Account,
  Transaction,
} from "@finance-tracker/bank-data-api/contract";
import { deutscheBankGiroHeaderV1 } from "@finance-tracker/bank-data-api/deutsche-bank-giro";
import { finvestoHeaderV1 } from "@finance-tracker/bank-data-api/finvesto";
import { ingHeaderV1 } from "@finance-tracker/bank-data-api/ing";

type Json = Transaction["data"];

const headers: Partial<
  Record<Account["bank"], Partial<Record<Account["type"], string>>>
> = {
  ING: { giro: ingHeaderV1, savings: ingHeaderV1 },
  "Deutsche Bank": { giro: deutscheBankGiroHeaderV1 },
  finvesto: { depot: finvestoHeaderV1 },
};

function flatten(value: Json, path: string): [string, Exclude<Json, object>][] {
  return value !== null && typeof value === "object"
    ? Object.entries(value).flatMap(([key, inner]) =>
        flatten(inner, path ? `${path}.${key}` : key),
      )
    : [[path, value]];
}

export function RawTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}) {
  const [json, setJson] = useState(false);
  const columns = headers[account.bank]?.[account.type]?.split(";");
  return (
    <div className="raw-panel">
      <div className="raw-head">
        <strong>Raw transaction</strong>
        <span className="chip">Shape version {transaction.shapeVersion}</span>
        <div className="segmented" role="group" aria-label="Raw view">
          <button
            aria-pressed={!json}
            onClick={() => {
              setJson(false);
            }}
          >
            Fields
          </button>
          <button
            aria-pressed={json}
            onClick={() => {
              setJson(true);
            }}
          >
            JSON
          </button>
        </div>
      </div>
      {json ? (
        <pre className="json">{JSON.stringify(transaction.data, null, 2)}</pre>
      ) : (
        <dl className="fields">
          {flatten(transaction.data, "").map(([path, value]) => {
            const name = columns?.[Number(path)] ?? path;
            return (
              <div className="field" key={path}>
                <dt title={name}>{name}</dt>
                <dd>
                  {value === "" ? (
                    <span className="empty-field">empty</span>
                  ) : (
                    String(value)
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
