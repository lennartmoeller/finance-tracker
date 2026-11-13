import { FolderTree } from "lucide-react";
import type { Category } from "@finance-tracker/shared/contract";
import type { Data } from "../App.tsx";
import { byId } from "../by-id.ts";
import { categoryPath } from "../category-path.ts";
import { Intro } from "../Intro.tsx";
import { EditPanel } from "./EditPanel.tsx";
import { byName, type Kind, type OwnerPanelProps } from "./RuleList.tsx";

const isFolder = (data: Data, { id }: Category) =>
  data.categories.some(({ parentId }) => parentId === id);

const tree = (
  data: Data,
  parentId: number | null,
  depth: number,
): [Category, number, boolean][] =>
  data.categories
    .filter((category) => category.parentId === parentId)
    .toSorted(byName)
    .flatMap((category) => [
      [category, depth, isFolder(data, category)],
      ...tree(data, category.id, depth + 1),
    ]);

export const categoryKind: Kind<Category> = {
  noun: "category",
  rows: (data) => tree(data, null, 0),
  name: (category) => category.name,
  counts: (data) => {
    const categories = byId(data.categories);
    const counts = new Map<number | null, number>();
    for (const { categoryId } of data.transactions)
      for (
        let category = categories.get(categoryId);
        category;
        category = categories.get(category.parentId)
      )
        counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
    return counts;
  },
  intro: (
    <Intro
      icon={<FolderTree />}
      title="No categories yet"
      text="A category's rules on brand, counterparty and description assign it to cash transactions."
    />
  ),
  OwnerPanel: CategoryPanel,
};

function CategoryPanel({
  owner: category,
  data,
  onChange,
  onClose,
}: OwnerPanelProps<Category>) {
  const categories = byId(data.categories);
  const parent = categories.get(category?.parentId ?? null);
  return (
    <EditPanel
      title={category?.name ?? "New category"}
      subtitle={parent ? categoryPath(categories, parent) : "Category"}
      fields={[
        { name: "name", label: "Name", placeholder: "Groceries" },
        {
          name: "parentId",
          label: "Parent",
          options: [
            ["", "None"],
            ...data.categories
              .map((other): [string, string] => [
                String(other.id),
                categoryPath(categories, other),
              ])
              .sort(([, a], [, b]) => a.localeCompare(b)),
          ],
        },
      ]}
      initial={{
        name: category?.name ?? "",
        parentId: String(category?.parentId ?? ""),
      }}
      rules={
        category && isFolder(data, category)
          ? undefined
          : (category?.rules ?? [])
      }
      brands={data.brands}
      onSave={({ name, parentId }, rules) => {
        const input = {
          name,
          parentId: parentId ? Number(parentId) : null,
          rules,
        };
        return onChange((api) =>
          category
            ? api.category.update({ id: category.id, ...input })
            : api.category.create(input),
        );
      }}
      removal={
        category && {
          label: "Delete category",
          question: `Delete the category “${category.name}”${category.rules.length ? " with its rules" : ""}?`,
          remove: () =>
            onChange((api) => api.category.remove({ id: category.id })),
        }
      }
      onClose={onClose}
    />
  );
}
