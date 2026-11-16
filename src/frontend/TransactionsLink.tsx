import { ArrowRightLeft } from "lucide-react";
import type { Account } from "@finance-tracker/shared/contract";
import { href } from "./route.ts";

export function TransactionsLink({
  tab = "cash",
  filters,
  className,
  labelled = false,
}: {
  tab?: Account["type"];
  filters: Record<string, string>;
  className?: string | undefined;
  labelled?: boolean;
}) {
  return (
    <a
      className={className}
      title={labelled ? undefined : "Transactions"}
      href={href({
        view: "transactions",
        tab,
        filters,
        sort: null,
        transfers: null,
      })}
    >
      <ArrowRightLeft />
      {labelled && "Transactions"}
    </a>
  );
}
