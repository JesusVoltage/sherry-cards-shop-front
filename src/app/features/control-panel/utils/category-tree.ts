import { AdminCategory } from '../models/admin.model';

export interface CategoryRow {
  category: AdminCategory;
  /** 1 para las raíces. */
  depth: number;
  path: string;
  /** Hermanas en orden, para subir y bajar dentro del mismo nivel. */
  siblingIds: number[];
  index: number;
}

export const MAX_CATEGORY_DEPTH = 6;

/** Aplana el árbol en orden de presentación: cada categoría seguida de sus subcategorías. */
export function categoryRows(categories: AdminCategory[]): CategoryRow[] {
  const byParent = new Map<number | null, AdminCategory[]>();
  const ids = new Set(categories.map((category) => category.id));
  for (const category of categories) {
    // Una categoría cuyo padre no llega se muestra en la raíz en lugar de desaparecer.
    const parent = category.parentId !== null && ids.has(category.parentId) ? category.parentId : null;
    byParent.set(parent, [...(byParent.get(parent) ?? []), category]);
  }
  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => Number(a.system) - Number(b.system) || a.displayOrder - b.displayOrder || a.id - b.id);
  }

  const rows: CategoryRow[] = [];
  const visit = (parentId: number | null, depth: number, prefix: string) => {
    const siblings = byParent.get(parentId) ?? [];
    const siblingIds = siblings.map((category) => category.id);
    siblings.forEach((category, index) => {
      const path = prefix ? `${prefix} › ${category.name}` : category.name;
      rows.push({ category, depth, path, siblingIds, index });
      if (depth < MAX_CATEGORY_DEPTH + 1) visit(category.id, depth + 1, path);
    });
  };
  visit(null, 1, '');
  return rows;
}

/** Ids de la categoría y de toda su rama: no pueden ser su nuevo padre. */
export function branchIds(categories: AdminCategory[], id: number): Set<number> {
  const branch = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId !== null && branch.has(category.parentId) && !branch.has(category.id)) {
        branch.add(category.id);
        grew = true;
      }
    }
  }
  return branch;
}
