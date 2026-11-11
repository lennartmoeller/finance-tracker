const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function ago(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ] as const) {
    if (Math.abs(seconds) >= size)
      return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function lastSyncText(lastSyncedAt: Date | null): string {
  return lastSyncedAt ? `Synced ${ago(lastSyncedAt)}` : "Never synced";
}

export function freshness(lastSyncedAt: Date | null): string {
  if (!lastSyncedAt) return "stale";
  // The user syncs about weekly, so a sync turns due after 7 days and overdue after 30.
  const days = (Date.now() - lastSyncedAt.getTime()) / 86_400_000;
  return days <= 7 ? "fresh" : days <= 30 ? "aging" : "stale";
}
