import { useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-regex.js";
import { errorMessage } from "@finance-tracker/shared/error-message";
import { pattern } from "./pattern.ts";

Prism.languages["postgresql-regex"] = Prism.languages.extend("regex", {});
const grammar = Prism.languages.insertBefore("postgresql-regex", "anchor", {
  "word-anchor": { pattern: /\\[mMyY]/, alias: "anchor" },
});

// PostgreSQL refuses a rule's pattern that matches the empty string, and with it every transaction.
const problem = (source: string, rule: boolean) => {
  try {
    const regex = pattern(source);
    return rule && regex.test("")
      ? "This pattern matches every transaction."
      : undefined;
  } catch (error) {
    return errorMessage(error);
  }
};

export function PatternText({ value }: { value: string }) {
  return (
    <span
      className="pattern-text"
      dangerouslySetInnerHTML={{
        __html: Prism.highlight(value, grammar, "postgresql-regex"),
      }}
    />
  );
}

export function PatternInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  rule = false,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  className?: string;
  rule?: boolean;
}) {
  const [scroll, setScroll] = useState(0);
  const message = value ? problem(value, rule) : undefined;
  // The input scrolls to its caret only after the event that moved it.
  const follow = ({ currentTarget }: { currentTarget: HTMLInputElement }) => {
    setTimeout(() => {
      setScroll(currentTarget.scrollLeft);
    });
  };
  return (
    <span className={`pattern-input ${className ?? ""}`}>
      <span className="pattern-mirror" aria-hidden>
        <span style={{ translate: `${String(-scroll)}px` }}>
          <PatternText value={value} />
        </span>
      </span>
      <input
        id={id}
        aria-label={label}
        aria-invalid={Boolean(message)}
        title={message}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onScroll={follow}
        onSelect={follow}
        onKeyUp={follow}
      />
    </span>
  );
}
