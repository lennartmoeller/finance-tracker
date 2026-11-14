import {
  groupAccountNumber,
  type AccountNumberFormat,
} from "./account-number.ts";

export function typeAccountNumber(
  {
    currentTarget: input,
    nativeEvent,
  }: { currentTarget: HTMLInputElement; nativeEvent: Event },
  previous: string,
  { label, length, groups }: AccountNumberFormat,
): string {
  const clean = (text: string) =>
    label === "IBAN"
      ? text.toUpperCase().replace(/[^A-Z\d]/g, "")
      : text.replace(/\D/g, "");
  let typed = clean(input.value);
  let caret = clean(
    input.value.slice(0, input.selectionStart ?? undefined),
  ).length;
  // A backspace after a group's space deletes only the space, which grouping puts back, so it deletes the character before the space instead.
  if (
    typed === previous &&
    caret > 0 &&
    (nativeEvent as InputEvent).inputType === "deleteContentBackward"
  ) {
    typed = typed.slice(0, caret - 1) + typed.slice(caret);
    caret--;
  }
  typed = typed.slice(0, length);
  input.value = groupAccountNumber(typed, groups);
  const position = groupAccountNumber(typed.slice(0, caret), groups).length;
  input.setSelectionRange(position, position);
  return typed;
}
