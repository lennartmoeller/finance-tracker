import type { Category } from "@finance-tracker/shared/contract";

export function categoryPath(
  categories: Map<number | null, Category>,
  category: Category,
): string {
  const parent = categories.get(category.parentId);
  return parent
    ? `${categoryPath(categories, parent)} › ${category.name}`
    : category.name;
}
