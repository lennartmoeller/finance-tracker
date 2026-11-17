import type { ReactNode } from "react";

export function Field({
  id,
  label,
  message,
  invalid = false,
  children,
}: {
  id: string;
  label: string;
  message?: string | undefined;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="edit-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {message !== undefined && (
        <p className={invalid ? "field-message invalid" : "field-message"}>
          {message}
        </p>
      )}
    </div>
  );
}
