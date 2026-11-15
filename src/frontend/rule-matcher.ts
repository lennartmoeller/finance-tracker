import type {
  CashTransaction,
  RuleInput,
} from "@finance-tracker/shared/contract";
import { pattern } from "./pattern.ts";

const finds = (source: string | null) => {
  const regex = source === null ? undefined : pattern(source);
  return (text: string | null) => !regex || (text !== null && regex.test(text));
};

// Whether a rule's conditions hold for a cash transaction, as the backend's matchingRule reads them, without the precedence between rules.
export function ruleMatcher({
  requiredBrandId,
  counterpartyPattern,
  descriptionPattern,
}: RuleInput) {
  const counterparty = finds(counterpartyPattern);
  const description = finds(descriptionPattern);
  return (cash: CashTransaction, brandId: number | null) =>
    (requiredBrandId === null || requiredBrandId === brandId) &&
    counterparty(cash.counterparty) &&
    description(cash.description);
}
