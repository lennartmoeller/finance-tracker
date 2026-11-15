import type { Transaction } from "./contract.ts";

// The banks book a transfer's receiving side up to four days after its sending side, across weekends and holidays.
const maxDaysApart = 7;

type Listed = Pick<Transaction, "id" | "accountId" | "cash" | "depot">;

const daysBetween = (date: string, other: string) =>
  Math.abs(Date.parse(date) - Date.parse(other)) / 86_400_000;

// Pairs each transaction that sends an amount with one that receives it on another account, closest dates first, one to one.
export function transferPartners(transactions: Listed[]) {
  const movements = transactions.flatMap(({ id, accountId, cash, depot }) => {
    const part = cash ?? (depot?.type === "trade" ? depot : null);
    return part?.amount && part.currency
      ? [
          {
            id,
            accountId,
            date: part.date,
            sends: part.amount.startsWith("-"),
            key: `${part.currency} ${part.amount.replace(/^-/, "")}`,
          },
        ]
      : [];
  });
  const receivers = Map.groupBy(
    movements.filter(({ sends }) => !sends),
    ({ key }) => key,
  );
  const candidates = movements
    .filter(({ sends }) => sends)
    .flatMap((sender) =>
      (receivers.get(sender.key) ?? []).flatMap((receiver) => {
        const days = daysBetween(sender.date, receiver.date);
        return receiver.accountId !== sender.accountId && days <= maxDaysApart
          ? [{ days, sender, receiver }]
          : [];
      }),
    )
    .sort(
      (a, b) =>
        a.days - b.days ||
        a.sender.id - b.sender.id ||
        a.receiver.id - b.receiver.id,
    );
  const partners = new Map<number, number>();
  for (const { sender, receiver } of candidates)
    if (!partners.has(sender.id) && !partners.has(receiver.id))
      partners.set(sender.id, receiver.id).set(receiver.id, sender.id);
  return partners;
}
