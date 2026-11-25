import axios from './axios';
import type { RichInventory } from '../model/richInventory';

export type InventorySort = 'name' | 'expiry' | 'added';
export type SortDir = 'asc' | 'desc';

export interface InventoryQuery {
    q?: string;
    category?: number | null;
    location?: string | null;
    sort?: InventorySort;
    dir?: SortDir;
    limit?: number;
    offset?: number;
}

export interface InventoryPage {
    items: RichInventory[];
    total: number;
    nextOffset: number | null;
}

/** One page of inventory; search/filter/sort happen on the server across all items. */
export async function queryInventory(query: InventoryQuery, signal?: AbortSignal): Promise<InventoryPage> {
    const params: Record<string, string | number> = {};
    if (query.q) params.q = query.q;
    if (query.category != null) params.category = query.category;
    if (query.location) params.location = query.location;
    if (query.sort) params.sort = query.sort;
    if (query.dir) params.dir = query.dir;
    if (query.limit != null) params.limit = query.limit;
    if (query.offset != null) params.offset = query.offset;
    const res = await axios.get<InventoryPage>('/inventory', { params, signal });
    return res.data;
}

export async function getInventoryById(id: number): Promise<RichInventory> {
    const res = await axios.get<RichInventory>(`/inventory/${id}`);
    return res.data;
}

export async function addInventory(item: {
    product_id: number;
    storage_location: string;
    quantity?: string;
    expiry_date?: string;
    purchase_date?: string;
}): Promise<RichInventory> {
    const res = await axios.post<RichInventory>('/inventory/add', item);
    return res.data;
}

export async function updateInventory(
    id: number,
    changes: {
        product_id?: number;
        storage_location?: string;
        quantity?: string;
        expiry_date?: string | null;
        purchase_date?: string | null;
    },
): Promise<RichInventory> {
    const res = await axios.put<RichInventory>(`/inventory/item/${id}`, changes);
    return res.data;
}

export async function deleteInventory(id: number): Promise<void> {
    await axios.delete(`/inventory/${id}`);
}
