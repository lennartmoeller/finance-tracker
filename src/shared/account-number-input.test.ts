import { expect, test } from "vitest";
import { iban } from "./account-number.ts";
import { typeAccountNumber } from "./account-number-input.ts";

test("a backspace right after a group's space deletes the character before it and keeps the caret there", () => {
  const input = {
    value: "DE893",
    selectionStart: 4,
    setSelectionRange(start: number) {
      this.selectionStart = start;
    },
  };
  const typed = typeAccountNumber(
    {
      currentTarget: input as unknown as HTMLInputElement,
      nativeEvent: { inputType: "deleteContentBackward" } as InputEvent,
    },
    "DE893",
    iban,
  );
  expect([typed, input.value, input.selectionStart]).toEqual([
    "DE83",
    "DE83",
    3,
  ]);
});
