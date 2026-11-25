import type { InventorySort, SortDir } from '../../api/inventory';

export interface FilterState {
    q: string;
    category: number | null;
    location: string | null;
    sort: InventorySort;
    dir: SortDir;
}

export const SORT_OPTIONS: { value: `${InventorySort}:${SortDir}`; label: string }[] = [
    { value: 'name:asc', label: 'Name A–Ö' },
    { value: 'name:desc', label: 'Name Ö–A' },
    { value: 'expiry:asc', label: 'Expires soonest' },
    { value: 'expiry:desc', label: 'Expires latest' },
    { value: 'added:desc', label: 'Newest added' },
    { value: 'added:asc', label: 'Oldest added' },
];

export const DEFAULT_SORT: InventorySort = 'name';
export const DEFAULT_DIR: SortDir = 'asc';

/** Filters live in the URL so they survive reloads and back/forward. */
export function readFilters(params: URLSearchParams): FilterState {
    const sortDir = `${params.get('sort')}:${params.get('dir')}`;
    const valid = SORT_OPTIONS.some((o) => o.value === sortDir);
    const category = Number(params.get('category'));
    return {
        q: params.get('q') ?? '',
        category: params.get('category') && Number.isInteger(category) ? category : null,
        location: params.get('location') || null,
        sort: valid ? (params.get('sort') as InventorySort) : DEFAULT_SORT,
        dir: valid ? (params.get('dir') as SortDir) : DEFAULT_DIR,
    };
}

export function writeFilters(f: FilterState): URLSearchParams {
    const out = new URLSearchParams();
    if (f.q) out.set('q', f.q);
    if (f.category != null) out.set('category', String(f.category));
    if (f.location) out.set('location', f.location);
    if (f.sort !== DEFAULT_SORT || f.dir !== DEFAULT_DIR) {
        out.set('sort', f.sort);
        out.set('dir', f.dir);
    }
    return out;
}
