import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Panel({
  label,
  head,
  onClose,
  children,
}: {
  label: string;
  head: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    addEventListener("keydown", close);
    return () => {
      removeEventListener("keydown", close);
    };
  }, [onClose]);

  return (
    <aside className="panel" aria-label={label}>
      <div className="panel-head">
        {head}
        <button className="icon-button" aria-label="Close" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </aside>
  );
}
