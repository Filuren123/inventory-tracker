import type { Category } from '../model/category.interface';

export interface CategoryNode extends Category {
    children: CategoryNode[];
    depth: number;
}

const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, 'sv');

/** Build a sorted tree from the flat list. Orphans (missing parent) become roots. */
export function buildTree(categories: Category[]): CategoryNode[] {
    const nodes = new Map<number, CategoryNode>();
    categories.forEach((c) => nodes.set(c.id, { ...c, children: [], depth: 0 }));

    const roots: CategoryNode[] = [];
    nodes.forEach((node) => {
        const parent = node.parent_id != null ? nodes.get(node.parent_id) : undefined;
        (parent ? parent.children : roots).push(node);
    });

    const sortAndDepth = (list: CategoryNode[], depth: number) => {
        list.sort(byName);
        list.forEach((n) => {
            n.depth = depth;
            sortAndDepth(n.children, depth + 1);
        });
    };
    sortAndDepth(roots, 0);
    return roots;
}

/** Depth-first flattening, for indented <select> options and list rendering. */
export function flattenTree(tree: CategoryNode[]): CategoryNode[] {
    const out: CategoryNode[] = [];
    const walk = (list: CategoryNode[]) =>
        list.forEach((n) => {
            out.push(n);
            walk(n.children);
        });
    walk(tree);
    return out;
}

/** The ids of a category and everything below it. */
export function subtreeIds(categories: Category[], id: number): Set<number> {
    const result = new Set<number>([id]);
    let added = true;
    while (added) {
        added = false;
        for (const c of categories) {
            if (c.parent_id != null && result.has(c.parent_id) && !result.has(c.id)) {
                result.add(c.id);
                added = true;
            }
        }
    }
    return result;
}

/** "Skafferi › Kryddor › Salt" */
export function categoryPath(categories: Category[], id: number | null): string {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const parts: string[] = [];
    const seen = new Set<number>();
    let current = id != null ? byId.get(id) : undefined;
    while (current && !seen.has(current.id)) {
        seen.add(current.id);
        parts.unshift(current.name);
        current = current.parent_id != null ? byId.get(current.parent_id) : undefined;
    }
    return parts.join(' › ');
}
