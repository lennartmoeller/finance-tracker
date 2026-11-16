export function quotedRows(text: string): string[][] | undefined {
  const cell = /"((?:[^"]|"")*)"(,|\n|$)/y;
  const rows: string[][] = [];
  let row: string[] = [];
  while (cell.lastIndex < text.length) {
    const [, quoted, separator] = cell.exec(text) ?? [];
    if (quoted === undefined) return undefined;
    row.push(quoted.replaceAll('""', '"'));
    if (separator === ",") continue;
    rows.push(row);
    row = [];
  }
  return row.length ? undefined : rows;
}
