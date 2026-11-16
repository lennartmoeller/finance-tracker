import type { Account, Transaction } from "./contract.ts";

// The banks book a transfer's receiving side up to four days after its sending side, across weekends and holidays.
const maxDaysApart = 7;

export type Pairable = Pick<
  Transaction,
  "id" | "accountId" | "cash" | "depot" | "noTransfer"
> & { identity: string; pinnedPartnerId: number | null };

type Proof = NonNullable<Transaction["transferProof"]>;
type Probable = NonNullable<Transaction["probableTransfer"]>;
type Bank = Pick<Account, "id" | "bank" | "number">;

const daysBetween = (date: string, other: string) =>
  Math.abs(Date.parse(date) - Date.parse(other)) / 86_400_000;

const names = (counterparty: string | null, bank: string) =>
  counterparty !== null &&
  new RegExp(`\\b${RegExp.escape(bank)}\\b`, "i").test(counterparty);

// Pins first; then pairs of opposite equal amounts on two accounts at most 7 days apart that the banks' own words prove, closest dates first, one to one; then the marks on what stays unpaired.
export function transfers(transactions: Pairable[], accounts: Bank[]) {
  const accountOf = new Map(accounts.map((account) => [account.id, account]));
  const movements = transactions.flatMap((transaction) => {
    const { accountId, cash, depot } = transaction;
    const part = cash ?? (depot?.type === "trade" ? depot : null);
    const account = accountOf.get(accountId);
    return part?.amount && part.currency && account
      ? [
          {
            ...transaction,
            account,
            date: part.date,
            counterparty: cash?.counterparty ?? null,
            iban: cash?.counterpartyIban ?? null,
            sends: part.amount.startsWith("-"),
            key: `${part.currency} ${part.amount.replace(/^-/, "")}`,
          },
        ]
      : [];
  });
  type Movement = (typeof movements)[number];

  const pointsAt = (movement: Movement, account: Bank) =>
    movement.account.bank !== account.bank &&
    (names(movement.counterparty, account.bank) ||
      movement.iban === account.number);
  // A bank name says only "some account at that bank", so the booking on that account must not name anyone else.
  const proofOf = (one: Movement, other: Movement): Proof | null => {
    if (
      one.account.bank === other.account.bank &&
      one.identity === other.identity
    )
      return { kind: "row", by: null };
    for (const [by, at] of [
      [one, other],
      [other, one],
    ] as const)
      if (by.iban !== null && by.iban === at.account.number)
        return { kind: "iban", by: by.id };
    for (const [by, at] of [
      [one, other],
      [other, one],
    ] as const)
      if (
        by.account.bank !== at.account.bank &&
        names(by.counterparty, at.account.bank) &&
        (at.counterparty === null || pointsAt(at, by.account))
      )
        return { kind: "bank", by: by.id };
    return null;
  };

  const paired = new Map<number, { partnerId: number; proof: Proof }>();
  for (const { id, pinnedPartnerId } of transactions)
    if (pinnedPartnerId !== null)
      paired.set(id, {
        partnerId: pinnedPartnerId,
        proof: { kind: "pinned", by: null },
      });

  const opposites = (
    pool: Movement[],
    accept: (one: Movement, other: Movement) => boolean,
  ) => {
    const receivers = Map.groupBy(
      pool.filter(({ sends }) => !sends),
      ({ key }) => key,
    );
    return pool
      .filter(({ sends }) => sends)
      .flatMap((sender) =>
        (receivers.get(sender.key) ?? []).flatMap((receiver) => {
          const days = daysBetween(sender.date, receiver.date);
          return receiver.accountId !== sender.accountId &&
            days <= maxDaysApart &&
            accept(sender, receiver)
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
  };

  const free = movements.filter(
    ({ id, noTransfer }) => !noTransfer && !paired.has(id),
  );
  for (const { sender, receiver } of opposites(
    free,
    (one, other) => proofOf(one, other) !== null,
  )) {
    const proof = proofOf(sender, receiver);
    if (proof && !paired.has(sender.id) && !paired.has(receiver.id))
      paired
        .set(sender.id, { partnerId: receiver.id, proof })
        .set(receiver.id, { partnerId: sender.id, proof });
  }

  const unpaired = free.filter(({ id }) => !paired.has(id));
  const probable = new Map<number, Probable>();
  for (const { sender, receiver } of opposites(unpaired, () => true))
    for (const [one, other] of [
      [sender, receiver],
      [receiver, sender],
    ] as const)
      if (!probable.has(one.id))
        probable.set(one.id, { partnerId: other.id, bank: null });
  for (const movement of unpaired) {
    const target = accounts.find(
      (account) =>
        account.id !== movement.accountId && pointsAt(movement, account),
    );
    if (target && !probable.has(movement.id))
      probable.set(movement.id, { partnerId: null, bank: target.bank });
  }
  return { paired, probable };
}
