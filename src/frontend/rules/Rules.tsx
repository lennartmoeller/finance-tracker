import { useState } from "react";
import { Plus } from "lucide-react";
import type { Change, Loading } from "../App.tsx";
import { Loaded, SkeletonRows } from "../Loaded.tsx";
import { Tabs } from "../Tabs.tsx";
import { brandKind } from "./Brands.tsx";
import { categoryKind } from "./Categories.tsx";
import { RuleList, type Editing } from "./RuleList.tsx";
import "./rules.css";

const skeleton = <SkeletonRows count={14} />;

export function Rules({
  loading,
  onChange,
}: {
  loading: Loading;
  onChange: Change;
}) {
  const [tab, setTab] = useState<"brands" | "categories">("brands");
  const [editing, setEditing] = useState<Editing>();
  const list = { editing, onEdit: setEditing, onChange };
  return (
    <>
      <header className="page-head">
        <div className="page-title">
          <h1>Rules</h1>
          <button
            className="button secondary"
            disabled={!loading.data?.accounts.length}
            onClick={() => {
              setEditing({});
            }}
          >
            <Plus />
            New {(tab === "brands" ? brandKind : categoryKind).noun}
          </button>
        </div>
        <Tabs
          tabs={[
            ["brands", "Brands"],
            ["categories", "Categories"],
          ]}
          value={tab}
          onChange={(next) => {
            setTab(next);
            setEditing(undefined);
          }}
        />
      </header>
      <div className="content">
        <Loaded loading={loading} skeleton={skeleton}>
          {(data) =>
            tab === "brands" ? (
              <RuleList kind={brandKind} data={data} {...list} />
            ) : (
              <RuleList kind={categoryKind} data={data} {...list} />
            )
          }
        </Loaded>
      </div>
    </>
  );
}
