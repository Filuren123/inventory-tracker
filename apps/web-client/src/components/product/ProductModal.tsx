import { useCallback, useEffect, useState } from 'react';
import { deleteInventory, queryInventory } from '../../api/inventory';
import { deleteProduct, getProductById } from '../../api/products';
import { errorMessage } from '../../api/axios';
import { useCategories } from '../../hooks/useCategories';
import { useLocations } from '../../hooks/useLocations';
import type { Product } from '../../model/product.interface';
import type { RichInventory } from '../../model/richInventory';
import { categoryPath } from '../../utils/categoryTree';
import { expiryLabel, expiryStatus } from '../../utils/dates';
import Modal from '../common/Modal';
import ProductDetails from './ProductDetails';
import ProductForm from './ProductForm';
import './ProductModal.css';

interface Props {
    /** Product to show; `null` opens the form for a new product. */
    productId: number | null;
    onClose: () => void;
    /** Something changed (product saved/deleted, item removed): refresh lists behind the modal. */
    onChanged: () => void;
}

const ITEM_LIMIT = 100;
const BADGE = { expired: 'badge badge-danger', soon: 'badge badge-warning', ok: 'badge', none: 'badge' } as const;

/** Product details plus every inventory item of it; edit or delete the product. */
const ProductModal = ({ productId, onClose, onChanged }: Props) => {
    const [id, setId] = useState(productId);
    const [product, setProduct] = useState<Product | null>(null);
    const [items, setItems] = useState<RichInventory[]>([]);
    const [itemTotal, setItemTotal] = useState(0);
    const [mode, setMode] = useState<'view' | 'edit'>(productId == null ? 'edit' : 'view');
    const [error, setError] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<number | 'product' | null>(null);
    const [busy, setBusy] = useState(false);
    const { categories, flat } = useCategories();
    const { locations, create: createLocation } = useLocations();

    const load = useCallback(
        (pid: number) =>
            Promise.all([
                getProductById(pid),
                queryInventory({ product: pid, sort: 'expiry', dir: 'asc', limit: ITEM_LIMIT, offset: 0 }),
            ]).then(
                ([p, page]) => {
                    if (!p) {
                        setError('This product no longer exists.');
                        return;
                    }
                    setProduct(p);
                    setItems(page.items);
                    setItemTotal(page.total);
                    setError(null);
                },
                (err) => setError(errorMessage(err, 'Could not load product')),
            ),
        [],
    );

    useEffect(() => {
        if (id != null) load(id);
    }, [id, load]);

    const removeItem = async (item: RichInventory) => {
        setBusy(true);
        try {
            await deleteInventory(item.id);
            setConfirm(null);
            await load(item.product_id);
            onChanged();
        } catch (err) {
            setError(errorMessage(err, 'Could not remove item'));
        } finally {
            setBusy(false);
        }
    };

    const removeProduct = async () => {
        if (!product) return;
        setBusy(true);
        try {
            await deleteProduct(product.product_id);
            onChanged();
            onClose();
        } catch (err) {
            setError(errorMessage(err, 'Could not delete product'));
            setBusy(false);
        }
    };

    const isNew = id == null;
    const title = isNew ? 'New product' : (product?.name ?? 'Product');

    return (
        <Modal
            title={mode === 'edit' && !isNew ? `Edit ${title}` : title}
            onClose={onClose}
            actions={
                product && mode === 'view' ? (
                    <button type="button" className="btn btn-sm" onClick={() => setMode('edit')}>
                        Edit
                    </button>
                ) : null
            }
        >
            {error && <div className="alert alert-error pm-error">{error}</div>}

            {!isNew && !product && !error && (
                <div className="empty-state">
                    <span className="spinner" aria-label="Loading" />
                </div>
            )}

            {mode === 'edit' && (isNew || product) && (
                <>
                    <ProductForm
                        {...(product ? { mode: 'edit' as const, product } : { mode: 'create' as const, initial: { ean_code: '', name: '' } })}
                        plain
                        categories={flat}
                        locations={locations}
                        onCreateLocation={createLocation}
                        onSaved={(saved) => {
                            setProduct(saved);
                            setMode('view');
                            onChanged();
                            if (isNew) setId(saved.product_id);
                        }}
                        onCancel={() => (isNew ? onClose() : setMode('view'))}
                    />
                    {product && (
                        <div className="pm-danger">
                            {confirm === 'product' ? (
                                <>
                                    <span>Delete {product.name} permanently?</span>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={removeProduct} disabled={busy}>
                                        Delete product
                                    </button>
                                    <button type="button" className="btn btn-sm" onClick={() => setConfirm(null)}>
                                        Cancel
                                    </button>
                                </>
                            ) : itemTotal > 0 ? (
                                <span className="muted">
                                    To delete this product, remove its {itemTotal} {itemTotal === 1 ? 'item' : 'items'} from the
                                    inventory first.
                                </span>
                            ) : (
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm('product')}>
                                    Delete product
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {mode === 'view' && product && (
                <div className="pm-view">
                    <ProductDetails product={product} categoryLabel={categoryPath(categories, product.category_id)} hideName />

                    <section aria-labelledby="pm-items-title">
                        <h3 id="pm-items-title" className="pm-items-title">
                            In stock <span className="muted">({itemTotal})</span>
                        </h3>
                        {items.length === 0 ? (
                            <p className="muted">No items of this product in the inventory.</p>
                        ) : (
                            <ul className="pm-items">
                                {items.map((item) => (
                                    <li key={item.id} className="pm-item">
                                        <span className={BADGE[expiryStatus(item.expiry_date)]}>{expiryLabel(item.expiry_date)}</span>
                                        <span className="pm-item-info">
                                            <span>{item.storage_location}</span>
                                            {item.quantity && <span>{item.quantity}</span>}
                                            <span className="muted">
                                                {item.expiry_date ? `Exp. ${item.expiry_date}` : 'No expiry'}
                                                {item.purchase_date ? ` · bought ${item.purchase_date}` : ''}
                                            </span>
                                        </span>
                                        <span className="pm-item-actions">
                                            {confirm === item.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => removeItem(item)}
                                                        disabled={busy}
                                                    >
                                                        Remove
                                                    </button>
                                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setConfirm(item.id)}
                                                    aria-label={`Remove item stored in ${item.storage_location}`}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {itemTotal > items.length && (
                            <p className="muted pm-more">
                                Showing the first {items.length} of {itemTotal}.
                            </p>
                        )}
                    </section>
                </div>
            )}
        </Modal>
    );
};

export default ProductModal;
