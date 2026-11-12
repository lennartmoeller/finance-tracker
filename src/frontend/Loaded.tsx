import type { ReactNode } from "react";
import { CircleAlert, Wallet } from "lucide-react";
import type { Data, Loading } from "./App.tsx";
import { Intro } from "./Intro.tsx";

export const SkeletonRows = ({ count }: { count: number }) =>
  Array.from({ length: count }, (_, row) => (
    <div className="skeleton-row" key={row}>
      {Array.from({ length: 5 }, (_, cell) => (
        <span className="skeleton" key={cell} />
      ))}
    </div>
  ));

export function Loaded({
  loading: { data, error },
  skeleton,
  children,
}: {
  loading: Loading;
  skeleton: ReactNode;
  children: (data: Data) => ReactNode;
}) {
  if (error)
    return (
      <div className="banner" role="alert">
        <CircleAlert />
        <span>{error}</span>
      </div>
    );
  if (!data) return skeleton;
  if (!data.accounts.length)
    return (
      <Intro
        icon={<Wallet />}
        title="No accounts yet"
        text="Add an account in the browser extension's popup and sync it."
      />
    );
  return children(data);
}
