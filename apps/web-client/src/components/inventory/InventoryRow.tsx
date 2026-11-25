import { useState } from 'react';
import type { RichInventory } from '../../model/richInventory';
import { expiryLabel, expiryStatus } from '../../utils/dates';

interface Props {
    item: RichInventory;
    categoryLabel: string;
    onRemove: (item: RichInventory) => Promise<void>;
}

const STATUS_BADGE = {
    expired: 'badge badge-danger',
    soon: 'badge badge-warning',
    ok: 'badge',
    none: 'badge',
} as const;

const InventoryRow = ({ item, categoryLabel, onRemove }: Props) => {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const product = item.product;
    const status = expiryStatus(item.expiry_date);

    const remove = async () => {
        setBusy(true);
        try {
            await onRemove(item);
        } finally {
            setBusy(false);
            setConfirming(false);
        }
    };

    return (
        <li className="inv-row">
            <div className="inv-main">
                <div className="inv-name">{product?.name ?? `Unknown product #${item.product_id}`}</div>
                <div className="inv-meta">
                    {product?.brand && <span>{product.brand}</span>}
                    <span>{categoryLabel || 'Uncategorised'}</span>
                    {product?.ean_code && <span className="inv-ean">{product.ean_code}</span>}
                </div>
            </div>

            <div className="inv-cell inv-location">
                <span className="inv-cell-label">Location</span>
                {item.storage_location}
            </div>

            <div className="inv-cell inv-expiry">
                <span className="inv-cell-label">Expiry</span>
                <span className={STATUS_BADGE[status]} title={item.expiry_date ?? undefined}>
                    {expiryLabel(item.expiry_date)}
                </span>
                {item.expiry_date && <span className="inv-date">{item.expiry_date}</span>}
            </div>

            <div className={`inv-cell inv-quantity ${item.quantity ? '' : 'inv-quantity--empty'}`}>
                <span className="inv-cell-label">Quantity</span>
                {item.quantity || <span className="muted">—</span>}
            </div>

            <div className="inv-actions">
                {confirming ? (
                    <>
                        <button type="button" className="btn btn-danger btn-sm" onClick={remove} disabled={busy}>
                            Remove
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setConfirming(false)}
                            disabled={busy}
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirming(true)}
                        aria-label={`Remove ${product?.name ?? 'item'}`}
                    >
                        Remove
                    </button>
                )}
            </div>
        </li>
    );
};

export default InventoryRow;
