import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deleteInventory } from '../../api/inventory';
import { useLocations } from '../../hooks/useLocations';
import { errorMessage } from '../../api/axios';
import { useCategories } from '../../hooks/useCategories';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useInventoryQuery } from '../../hooks/useInventoryQuery';
import { useToast } from '../../hooks/useToast';
import type { RichInventory } from '../../model/richInventory';
import { categoryPath } from '../../utils/categoryTree';
import LoadMore from '../common/LoadMore';
import ProductModal from '../product/ProductModal';
import InventoryFilters from './InventoryFilters';
import InventoryRow from './InventoryRow';
import { readFilters, writeFilters, type FilterState } from './filters';
import './Inventory.css';

const InventoryPage = () => {
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => readFilters(params), [params]);

    const updateFilters = useCallback(
        (changes: Partial<FilterState>) =>
            setParams((prev) => writeFilters({ ...readFilters(prev), ...changes }), { replace: true }),
        [setParams],
    );

    // The search box updates instantly; the URL (and the query) follow after a short pause.
    const [search, setSearch] = useState(filters.q);
    const debouncedSearch = useDebouncedValue(search.trim(), 250);

    useEffect(() => {
        if (debouncedSearch !== readFilters(new URLSearchParams(window.location.search)).q) {
            updateFilters({ q: debouncedSearch });
        }
    }, [debouncedSearch, updateFilters]);

    // URL changed from outside (back/forward): bring the box in line, during render.
    const [syncedQ, setSyncedQ] = useState(filters.q);
    if (filters.q !== syncedQ) {
        setSyncedQ(filters.q);
        if (filters.q !== search.trim()) setSearch(filters.q);
    }

    const { categories, flat } = useCategories();
    const { locations } = useLocations();

    const { items, total, loading, error, hasMore, loadMore, retry, reload, removeLocal } = useInventoryQuery({
        q: filters.q,
        category: filters.category,
        location: filters.location,
        sort: filters.sort,
        dir: filters.dir,
    });

    const { show: showToast, toast } = useToast();
    const [openProduct, setOpenProduct] = useState<number | null>(null);

    const handleRemove = useCallback(
        async (item: RichInventory) => {
            try {
                await deleteInventory(item.id);
                removeLocal(item.id);
                showToast(`Removed ${item.product?.name ?? 'item'}`);
            } catch (err) {
                showToast(errorMessage(err, 'Could not remove item'));
            }
        },
        [removeLocal, showToast],
    );

    const isFiltered = Boolean(filters.q || filters.category != null || filters.location);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Inventory</h1>
                    <p>
                        {total == null
                            ? 'Loading…'
                            : `${total} ${total === 1 ? 'item' : 'items'}${isFiltered ? ' match' : ''}`}
                    </p>
                </div>
                <Link to="/add" className="btn btn-primary">
                    Add item
                </Link>
            </div>

            <InventoryFilters
                search={search}
                onSearchChange={setSearch}
                filters={filters}
                onChange={updateFilters}
                categories={flat}
                locations={locations}
            />

            <section className="panel inv-list-panel" aria-label="Inventory items">
                <div className="inv-head" aria-hidden>
                    <span>Product</span>
                    <span>Location</span>
                    <span>Expiry</span>
                    <span>Quantity</span>
                    <span />
                </div>

                {items.length > 0 && (
                    <ul className="inv-list">
                        {items.map((item) => (
                            <InventoryRow
                                key={item.id}
                                item={item}
                                categoryLabel={categoryPath(categories, item.product?.category_id ?? null)}
                                onRemove={handleRemove}
                                onOpen={setOpenProduct}
                            />
                        ))}
                    </ul>
                )}

                {!loading && !error && items.length === 0 && (
                    <div className="empty-state">
                        {isFiltered ? 'No items match these filters.' : 'The inventory is empty.'}
                    </div>
                )}

                <LoadMore
                    hasMore={hasMore}
                    loading={loading}
                    error={error}
                    onLoadMore={loadMore}
                    onRetry={retry}
                    itemCount={items.length}
                />
            </section>

            {openProduct != null && (
                <ProductModal productId={openProduct} onClose={() => setOpenProduct(null)} onChanged={reload} />
            )}

            {toast}
        </div>
    );
};

export default InventoryPage;
