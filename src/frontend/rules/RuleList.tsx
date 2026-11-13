import { Fragment, type ReactNode } from "react";
import type { Brand, Rule } from "@finance-tracker/shared/contract";
import type { Change, Data } from "../App.tsx";
import { byId } from "../by-id.ts";
import { formatCount } from "../format.ts";
import { Logo } from "../Logo.tsx";

type Owner = { id: number; name: string; rules: Rule[] };

export type OwnerPanelProps<O extends Owner> = {
  owner: O | undefined;
  data: Data;
  onChange: Change;
  onClose: () => void;
};

export type Kind<O extends Owner> = {
  noun: "brand" | "category";
  rows: (data: Data) => [owner: O, depth: number, folder: boolean][];
  name: (owner: O) => ReactNode;
  counts: (data: Data) => Map<number | null, number>;
  intro: ReactNode;
  OwnerPanel: (props: OwnerPanelProps<O>) => ReactNode;
};

export const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

function RuleChip({
  rule,
  brands,
}: {
  rule: Rule;
  brands: Map<number | null, Brand>;
}) {
  const brand = brands.get(rule.requiredBrandId);
  const conditions = [
    brand && (
      <>
        <Logo src={brand.logo} name={brand.name} />
        {brand.name}
      </>
    ),
    rule.counterpartyPattern !== null && (
      <>
        <i>counterparty</i> <code>{rule.counterpartyPattern}</code>
      </>
    ),
    rule.descriptionPattern !== null && (
      <>
        <i>description</i> <code>{rule.descriptionPattern}</code>
      </>
    ),
  ].filter(Boolean);
  return (
    <span className="rule-chip">
      {conditions.map((condition, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="and">·</span>}
          {condition}
        </Fragment>
      ))}
    </span>
  );
}

export type Editing = { id?: number } | undefined;

export function RuleList<O extends Owner>({
  kind,
  data,
  editing,
  onEdit,
  onChange,
}: {
  kind: Kind<O>;
  data: Data;
  editing: Editing;
  onEdit: (editing: Editing) => void;
  onChange: Change;
}) {
  const brands = byId(data.brands);
  const counts = kind.counts(data);
  const rows = kind.rows(data);
  const edited = rows.find(([owner]) => owner.id === editing?.id)?.[0];

  return (
    <>
      {rows.length ? (
        <div className="scroll">
          {rows.map(([owner, depth, folder]) => (
            <button
              key={owner.id}
              className={folder ? "owner folder" : "owner"}
              aria-pressed={owner === edited}
              onClick={() => {
                onEdit({ id: owner.id });
              }}
            >
              <span className="owner-name" style={{ paddingLeft: depth * 20 }}>
                <span>{kind.name(owner)}</span>
              </span>
              <span className="rule-chips">
                {owner.rules.map((rule) => (
                  <RuleChip key={rule.id} rule={rule} brands={brands} />
                ))}
              </span>
              <span className="owner-count">
                {formatCount(counts.get(owner.id) ?? 0)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        kind.intro
      )}
      {editing && (
        <kind.OwnerPanel
          key={edited?.id ?? "new"}
          owner={edited}
          data={data}
          onChange={onChange}
          onClose={() => {
            onEdit(undefined);
          }}
        />
      )}
    </>
  );
}
