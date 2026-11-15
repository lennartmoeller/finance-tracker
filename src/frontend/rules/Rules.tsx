import { useState } from "react";
import { Plus } from "lucide-react";
import type { Change, Loading } from "../App.tsx";
import { Loaded, SkeletonRows } from "../Loaded.tsx";
import { href, type Route } from "../route.ts";
import { Tabs } from "../Tabs.tsx";
import { brandKind } from "./Brands.tsx";
import { categoryKind } from "./Categories.tsx";
import { RuleList, type Editing } from "./RuleList.tsx";
import "./rules.css";

const skeleton = <SkeletonRows count={14} />;

type RulesTab = Extract<Route, { view: "rules" }>["tab"];

export function Rules({
  loading,
  tab,
  onChange,
}: {
  loading: Loading;
  tab: RulesTab;
  onChange: Change;
}) {
  const [editing, setEditing] = useState<Editing>();
  const list = { editing, onEdit: setEditing, onChange };
  return (
    <>
      <header className="page-head">
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
        <Tabs
          tabs={[
            [href({ view: "rules", tab: "brands" }), "Brands"],
            [href({ view: "rules", tab: "categories" }), "Categories"],
          ]}
          value={href({ view: "rules", tab })}
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
