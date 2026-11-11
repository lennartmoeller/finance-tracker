import { CircleAlert, Wallet } from "lucide-react";
import type { Data } from "./App.tsx";
import { Intro } from "./Intro.tsx";

export function Loaded({
  data,
  error,
  skeleton,
  children,
}: {
  data: Data | undefined;
  error: string;
  skeleton: React.ReactNode;
  children: (data: Data) => React.ReactNode;
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
