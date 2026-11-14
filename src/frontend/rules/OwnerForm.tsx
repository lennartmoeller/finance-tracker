import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import type { Brand, Rule, RuleInput } from "@finance-tracker/shared/contract";
import { EditPanel, type Removal } from "../EditPanel.tsx";
import { byName } from "./RuleList.tsx";

type Options = [value: string, label: string][];

type Field<Name extends string> = {
  name: Name;
  label: string;
  options?: Options;
  placeholder?: string;
};

type Draft = {
  id?: number;
  requiredBrandId: string;
  counterpartyPattern: string;
  descriptionPattern: string;
};

const draftOf = ({ id, ...rule }: Rule): Draft => ({
  id,
  requiredBrandId: String(rule.requiredBrandId ?? ""),
  counterpartyPattern: rule.counterpartyPattern ?? "",
  descriptionPattern: rule.descriptionPattern ?? "",
});

const inputOf = (draft: Draft): RuleInput => ({
  ...(draft.id === undefined ? {} : { id: draft.id }),
  requiredBrandId: draft.requiredBrandId ? Number(draft.requiredBrandId) : null,
  counterpartyPattern: draft.counterpartyPattern || null,
  descriptionPattern: draft.descriptionPattern || null,
});

function Control({
  id,
  value,
  onChange,
  options,
  placeholder,
  pattern,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options?: Options | undefined;
  placeholder?: string | undefined;
  pattern?: true;
}) {
  const props = {
    id,
    value,
    onChange: (event: { target: { value: string } }) => {
      onChange(event.target.value);
    },
  };
  return options ? (
    <select className="input" {...props}>
      {options.map(([option, text]) => (
        <option key={option} value={option}>
          {text}
        </option>
      ))}
    </select>
  ) : (
    <input
      className={pattern ? "input pattern" : "input"}
      autoComplete="off"
      spellCheck={false}
      placeholder={placeholder}
      {...props}
    />
  );
}

export function OwnerForm<Name extends string>({
  title,
  icon,
  subtitle,
  fields,
  initial,
  rules: initialRules,
  brands,
  onSave,
  removal,
  onClose,
}: {
  title: string;
  icon?: ReactNode;
  subtitle: ReactNode;
  fields: Field<Name>[];
  initial: Record<Name, string>;
  rules: Rule[] | undefined;
  brands?: Brand[];
  onSave: (values: Record<Name, string>, rules: RuleInput[]) => Promise<void>;
  removal: Removal | undefined;
  onClose: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [rules, setRules] = useState(() => (initialRules ?? []).map(draftOf));
  const changed =
    JSON.stringify([values, rules]) !==
    JSON.stringify([initial, (initialRules ?? []).map(draftOf)]);
  const brandOptions: Options | undefined = brands && [
    ["", "Any brand"],
    ...brands
      .toSorted(byName)
      .map(({ id, name }): [string, string] => [String(id), name]),
  ];
  const changeRule = (index: number, change: Partial<Draft>) => {
    setRules(
      rules.map((rule, other) =>
        other === index ? { ...rule, ...change } : rule,
      ),
    );
  };

  return (
    <EditPanel
      title={title}
      icon={icon}
      subtitle={subtitle}
      onSave={changed ? () => onSave(values, rules.map(inputOf)) : undefined}
      removal={removal}
      onClose={onClose}
    >
      {fields.map(({ name, label, options, placeholder }) => (
        <div key={name}>
          <label className="edit-label" htmlFor={name}>
            {label}
          </label>
          <Control
            id={name}
            value={values[name]}
            options={options}
            placeholder={placeholder}
            onChange={(value) => {
              setValues({ ...values, [name]: value });
            }}
          />
        </div>
      ))}
      {initialRules && (
        <div>
          <div className="rules-head">
            <span className="edit-label">Rules</span>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                setRules([
                  ...rules,
                  {
                    requiredBrandId: "",
                    counterpartyPattern: "",
                    descriptionPattern: "",
                  },
                ]);
              }}
            >
              <Plus />
              Add rule
            </button>
          </div>
          {rules.length === 0 && <p className="rules-none">No rules.</p>}
          {rules.map((rule, index) => (
            <div key={index} className="rule">
              {brandOptions && (
                <>
                  <label htmlFor={`rule-${String(index)}-brand`}>Brand</label>
                  <Control
                    id={`rule-${String(index)}-brand`}
                    value={rule.requiredBrandId}
                    options={brandOptions}
                    onChange={(requiredBrandId) => {
                      changeRule(index, { requiredBrandId });
                    }}
                  />
                </>
              )}
              <label htmlFor={`rule-${String(index)}-counterparty`}>
                Counterparty
              </label>
              <Control
                id={`rule-${String(index)}-counterparty`}
                value={rule.counterpartyPattern}
                placeholder="Any counterparty"
                pattern
                onChange={(counterpartyPattern) => {
                  changeRule(index, { counterpartyPattern });
                }}
              />
              <label htmlFor={`rule-${String(index)}-description`}>
                Description
              </label>
              <Control
                id={`rule-${String(index)}-description`}
                value={rule.descriptionPattern}
                placeholder="Any description"
                pattern
                onChange={(descriptionPattern) => {
                  changeRule(index, { descriptionPattern });
                }}
              />
              <button
                type="button"
                className="icon-button rule-remove"
                aria-label="Remove rule"
                onClick={() => {
                  setRules(rules.filter((_, other) => other !== index));
                }}
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      )}
    </EditPanel>
  );
}
