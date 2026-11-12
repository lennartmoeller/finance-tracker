const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const units = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
] as const;

function ago(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  const match = units.find(([, size]) => Math.abs(seconds) >= size);
  return match
    ? relativeTime.format(Math.round(seconds / match[1]), match[0])
    : "just now";
}

export const lastSyncText = (lastSyncedAt: Date | null) =>
  lastSyncedAt ? `Synced ${ago(lastSyncedAt)}` : "Never synced";

// The user syncs about weekly, so a sync turns due after 7 days and overdue after 30.
export function freshness(lastSyncedAt: Date | null) {
  const days = lastSyncedAt
    ? (Date.now() - lastSyncedAt.getTime()) / 86_400_000
    : Infinity;
  return days <= 7 ? "fresh" : days <= 30 ? "aging" : "stale";
}
