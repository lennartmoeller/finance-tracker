export const byId = <T extends { id: number }>(items: T[]) =>
  new Map<number | null, T>(items.map((item) => [item.id, item]));
