import type { Account } from "@finance-tracker/shared/contract";

export const accountText = ({ bank, name }: Account) => `${bank} ${name}`;
