import { queryInventory, type InventoryQuery } from '../api/inventory';
import type { RichInventory } from '../model/richInventory';
import { usePagedQuery } from './usePagedQuery';

export { PAGE_SIZE } from './usePagedQuery';

type Params = Omit<InventoryQuery, 'limit' | 'offset'>;

const inventoryId = (i: RichInventory) => i.id;

/** Paginated inventory for infinite scroll (see usePagedQuery). */
export function useInventoryQuery(params: Params) {
    return usePagedQuery(params, queryInventory, inventoryId, 'Could not load inventory');
}
