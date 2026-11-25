import { useState } from 'react';
import { queryProducts, type ProductWithStock } from '../../api/products';
import { useCategories } from '../../hooks/useCategories';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { categoryPath } from '../../utils/categoryTree';
import CategorySelect from '../common/CategorySelect';
import LoadMore from '../common/LoadMore';
import ProductModal from './ProductModal';
import './ProductsPage.css';

const productId = (p: ProductWithStock) => p.product_id;

/** Every product (not just those in stock): search, filter, open to view/edit. */
const ProductsPage = () => {
    const [search, setSearch] = useState('');
    const q = useDebouncedValue(search.trim(), 250);
    const [category, setCategory] = useState<number | null>(null);
    const [open, setOpen] = useState<number | 'new' | null>(null);
    const { categories, flat } = useCategories();

    const { items, total, loading, error, hasMore, loadMore, retry, reload } = usePagedQuery(
        { q, category },
        queryProducts,
        productId,
        'Could not load products',
    );

    const filtered = Boolean(q || category != null);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p>
                        {total == null
                            ? 'Loading…'
                            : `${total} ${total === 1 ? 'product' : 'products'}${filtered ? ' match' : ''}`}
                    </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setOpen('new')}>
                    New product
                </button>
            </div>

            <div className="prod-filters">
                <div className="field">
                    <label htmlFor="prod-search">Search</label>
                    <input
                        id="prod-search"
                        className="input"
                        type="search"
                        placeholder="Name, brand or EAN"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="field">
                    <label htmlFor="prod-category">Category</label>
                    <CategorySelect
                        id="prod-category"
                        options={flat}
                        value={category}
                        onChange={setCategory}
                        emptyLabel="All categories"
                    />
                </div>
            </div>

            <section className="panel" aria-label="Products">
                <div className="prod-head" aria-hidden>
                    <span>Product</span>
                    <span>Default location</span>
                    <span>In stock</span>
                </div>
                {items.length > 0 && (
                    <ul className="prod-list">
                        {items.map((p) => (
                            <li key={p.product_id}>
                                <button type="button" className="prod-row" onClick={() => setOpen(p.product_id)}>
                                    <span className="prod-main">
                                        <span className="prod-name">{p.name}</span>
                                        <span className="prod-meta">
                                            {p.brand && <span>{p.brand}</span>}
                                            <span>{categoryPath(categories, p.category_id) || 'Uncategorised'}</span>
                                            <span className="prod-ean">{p.ean_code ?? 'No EAN'}</span>
                                        </span>
                                    </span>
                                    <span className="prod-location">{p.default_storage_location ?? '—'}</span>
                                    <span className={`prod-stock ${p.in_stock === 0 ? 'muted' : ''}`}>
                                        {p.in_stock}
                                        <span className="prod-stock-label"> in stock</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {!loading && !error && items.length === 0 && (
                    <div className="empty-state">{filtered ? 'No products match.' : 'No products yet.'}</div>
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

            {open != null && (
                <ProductModal
                    productId={open === 'new' ? null : open}
                    onClose={() => setOpen(null)}
                    onChanged={reload}
                />
            )}
        </div>
    );
};

export default ProductsPage;
