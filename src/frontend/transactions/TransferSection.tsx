import { useState, type ReactNode } from "react";
import type {
  CashTransaction,
  DepotTransaction,
} from "@finance-tracker/shared/contract";
import { negated } from "@finance-tracker/shared/decimal";
import { errorMessage } from "@finance-tracker/shared/error-message";
import { AccountName } from "../AccountName.tsx";
import type { Api, Change } from "../App.tsx";
import { formatAmount, formatDate } from "../format.ts";
import type { Row } from "./Transactions.tsx";

const amountText = (
  { amount, currency }: CashTransaction | DepotTransaction,
  negate = false,
) =>
  amount && currency
    ? formatAmount(negate ? negated(amount) : amount, currency)
    : "";

const daysFrom = (date: string, other: string) =>
  Math.round((Date.parse(other) - Date.parse(date)) / 86_400_000);

function proofText({ id, account, transferProof, partner }: Row) {
  if (!transferProof || !partner) return null;
  if (transferProof.kind === "pinned") return "Pinned by you.";
  if (transferProof.kind === "row")
    return `One row in ${account.bank}'s export.`;
  const [by, other] =
    transferProof.by === id
      ? [account, partner.row.account]
      : [partner.row.account, account];
  return transferProof.kind === "iban"
    ? `The ${by.name} booking's IBAN is the IBAN of ${other.name}.`
    : `The ${by.name} booking names ${other.bank}.`;
}

export function probableText({ part, probableTransfer, suggested }: Row) {
  if (!probableTransfer) return null;
  if (suggested)
    return `${suggested.row.account.name} has ${amountText(suggested.row.part)} on ${formatDate(suggested.row.part.date)}, an opposite amount within 7 days.`;
  const { bank } = probableTransfer;
  return `${part.amount?.startsWith("-") ? "Goes to" : "Comes from"} ${bank ?? ""}, but no ${bank ?? ""} booking of ${amountText(part, true)} lies within 7 days.`;
}

export function TransferSection({
  row,
  rows,
  onChange,
}: {
  row: Row;
  rows: Row[];
  onChange: Change;
}) {
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState("");
  const call = (change: (api: Api) => Promise<unknown>) => () => {
    setError("");
    onChange(change).catch((failure: unknown) => {
      setError(errorMessage(failure));
    });
  };
  const button = (label: string, onClick: () => void) => (
    <button
      key={label}
      type="button"
      className="button secondary"
      onClick={onClick}
    >
      {label}
    </button>
  );
  const pin = (other: Row) => {
    const days = daysFrom(row.part.date, other.part.date);
    const apart = Math.abs(days);
    return (
      <div key={other.id} className="candidate">
        <div>
          <AccountName account={other.account} />
          <small>
            {formatDate(other.part.date)} ·{" "}
            {days === 0
              ? "same day"
              : `${String(apart)} ${apart === 1 ? "day" : "days"} ${days < 0 ? "before" : "after"}`}
            {other.title && ` · ${other.title}`}
          </small>
        </div>
        {button(
          "Pin",
          call((api) => api.transfer.pin({ id: row.id, partnerId: other.id })),
        )}
      </div>
    );
  };
  const section = (
    heading: string | null,
    text: string | null,
    body: ReactNode,
    actions: ReactNode[],
  ) => (
    <section className="transfer-section">
      {heading && (
        <h3
          className={row.probableTransfer && !choosing ? "probable" : undefined}
        >
          {heading}
        </h3>
      )}
      {text && <p>{text}</p>}
      {body}
      <div className="transfer-actions">{actions}</div>
      {error && <p className="field-message invalid">{error}</p>}
    </section>
  );

  if (row.partner) {
    const ids = [row.id, row.partner.row.id];
    return row.transferProof?.kind === "pinned"
      ? section("Transfer", proofText(row), null, [
          button(
            "Unpin",
            call((api) => api.transfer.release({ ids })),
          ),
        ])
      : section("Transfer", proofText(row), null, [
          button(
            "Not a transfer",
            call((api) => api.transfer.exclude({ ids })),
          ),
        ]);
  }
  if (row.noTransfer)
    return section("Not a transfer", "Marked by you.", null, [
      button(
        "Undo",
        call((api) => api.transfer.release({ ids: [row.id] })),
      ),
    ]);
  if (choosing) {
    const candidates = rows
      .filter(
        (other) =>
          other.accountId !== row.accountId &&
          other.part.currency === row.part.currency &&
          row.part.amount !== null &&
          other.part.amount === negated(row.part.amount) &&
          other.transferProof?.kind !== "pinned" &&
          !other.noTransfer,
      )
      .sort(
        (a, b) =>
          Math.abs(daysFrom(row.part.date, a.part.date)) -
            Math.abs(daysFrom(row.part.date, b.part.date)) || a.id - b.id,
      );
    return section(
      "Pin a transfer partner",
      `Bookings of ${amountText(row.part, true)} on your other accounts, closest first.`,
      candidates.length ? (
        candidates.map(pin)
      ) : (
        <p>No booking of that amount.</p>
      ),
      [
        button("Cancel", () => {
          setChoosing(false);
        }),
      ],
    );
  }
  if (row.probableTransfer)
    return section(
      "Probably a transfer",
      probableText(row),
      row.suggested && pin(row.suggested.row),
      [
        button("Choose a partner…", () => {
          setChoosing(true);
        }),
        button(
          "Not a transfer",
          call((api) => api.transfer.exclude({ ids: [row.id] })),
        ),
      ],
    );
  return section(null, null, null, [
    button("Pin as transfer…", () => {
      setChoosing(true);
    }),
  ]);
}
