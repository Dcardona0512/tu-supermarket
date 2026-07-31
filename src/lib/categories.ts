import type { Category } from "@/lib/database.types";

/** Una categoría principal con sus subcategorías. */
export type CategoryNode = {
  category: Category;
  children: Category[];
};

/** Las categorías principales son las que no cuelgan de ninguna otra. */
export function isRoot(c: Category): boolean {
  return c.parent_id == null;
}

/**
 * Agrupa la lista plana en categorías principales con sus subcategorías,
 * conservando el orden alfabético en que llegan.
 */
export function buildTree(categories: Category[]): CategoryNode[] {
  const roots = categories.filter(isRoot);
  return roots.map((category) => ({
    category,
    children: categories.filter((c) => c.parent_id === category.id),
  }));
}

/**
 * La categoría elegida y sus subcategorías.
 *
 * Al filtrar por "Alimentos y despensa" también hay que mostrar lo que está
 * en "Enlatados", porque el producto se guarda en la subcategoría.
 */
export function categoryWithChildren(
  categories: Category[],
  id: string
): Set<string> {
  const ids = new Set<string>([id]);
  for (const c of categories) {
    if (c.parent_id === id) ids.add(c.id);
  }
  return ids;
}

/** Nombre para mostrar: "Alimentos y despensa › Enlatados". */
export function categoryPath(
  categories: Category[],
  id: string | null
): string | null {
  if (!id) return null;
  const cat = categories.find((c) => c.id === id);
  if (!cat) return null;
  const parent = cat.parent_id
    ? categories.find((c) => c.id === cat.parent_id)
    : null;
  return parent ? `${parent.name} › ${cat.name}` : cat.name;
}

/**
 * Lista para un desplegable: las principales y, debajo, sus subcategorías
 * con una sangría para que se vea a cuál pertenecen.
 */
export function categoryOptions(
  categories: Category[]
): { id: string; label: string; isChild: boolean }[] {
  return buildTree(categories).flatMap(({ category, children }) => [
    { id: category.id, label: category.name, isChild: false },
    ...children.map((c) => ({
      id: c.id,
      label: c.name,
      isChild: true,
    })),
  ]);
}
