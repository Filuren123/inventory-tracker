import { useEffect, useRef, useState } from 'react';
import { addInventory, deleteInventory } from '../../api/inventory';
import { errorMessage } from '../../api/axios';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useInventoryQuery } from '../../hooks/useInventoryQuery';
import type { RichInventory } from '../../model/richInventory';
import { expiryLabel, expiryStatus } from '../../utils/dates';
import LoadMore from '../common/LoadMore';
import './InventoryRemove.css';

type Notice = { text: string; undo?: RichInventory } | null;

const BADGE = { expired: 'badge badge-danger', soon: 'badge badge-warning', ok: 'badge', none: 'badge' } as const;

const InventoryRemove = () => {
    const [search, setSearch] = useState('');
    const q = useDebouncedValue(search.trim(), 250);
    const query = useInventoryQuery({ q, sort: 'expiry', dir: 'asc' });
    const [notice, setNotice] = useState<Notice>(null);
    const [pendingId, setPendingId] = useState<number | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        searchRef.current?.focus();
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const notify = (n: Notice) => {
        if (timer.current) clearTimeout(timer.current);
        setNotice(n);
        timer.current = setTimeout(() => setNotice(null), 6000);
    };

    const remove = async (item: RichInventory) => {
        if (pendingId != null) return;
        setPendingId(item.id);
        try {
            await deleteInventory(item.id);
            query.removeLocal(item.id);
            notify({ text: `Removed ${item.product?.name ?? 'item'}`, undo: item });
        } catch (err) {
            notify({ text: errorMessage(err, 'Could not remove item') });
        } finally {
            setPendingId(null);
        }
    };

    const undo = async (item: RichInventory) => {
        setNotice(null);
        try {
            await addInventory({
                product_id: item.product_id,
                storage_location: item.storage_location,
                quantity: item.quantity ?? undefined,
                expiry_date: item.expiry_date ?? undefined,
                purchase_date: item.purchase_date ?? undefined,
            });
            query.reload();
            notify({ text: `Restored ${item.product?.name ?? 'item'}` });
        } catch (err) {
            notify({ text: errorMessage(err, 'Could not restore item') });
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Remove items</h1>
                    <p>Search, then tap an item to take it out of stock. Soonest expiry first.</p>
                </div>
            </div>

            <div className="field rem-search">
                <label htmlFor="rem-search">Search</label>
                <input
                    ref={searchRef}
                    id="rem-search"
                    className="input"
                    type="search"
                    placeholder="Name, brand or EAN"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                        // Scanner flow: Enter on an exact single match removes it.
                        if (e.key === 'Enter' && query.items.length === 1 && q === search.trim()) {
                            remove(query.items[0]!);
                            setSearch('');
                        }
                    }}
                    autoComplete="off"
                />
                {query.total != null && (
                    <span className="hint">
                        {query.total} {query.total === 1 ? 'item' : 'items'}
                    </span>
                )}
            </div>

            {!query.loading && !query.error && query.items.length === 0 && (
                <div className="panel empty-state">{q ? 'No matching items.' : 'The inventory is empty.'}</div>
            )}

            <ul className="rem-grid">
                {query.items.map((item) => {
                    const status = expiryStatus(item.expiry_date);
                    return (
                        <li key={item.id}>
                            <button
                                type="button"
                                className="rem-card"
                                onClick={() => remove(item)}
                                disabled={pendingId === item.id}
                                aria-label={`Remove ${item.product?.name ?? 'item'}`}
                            >
                                <span className="rem-card-top">
                                    <span className="muted">{item.product?.brand ?? '—'}</span>
                                    <span className="muted">{item.storage_location}</span>
                                </span>
                                <span className="rem-card-name">{item.product?.name ?? 'Unknown product'}</span>
                                <span className="rem-card-bottom">
                                    <span className={BADGE[status]}>{expiryLabel(item.expiry_date)}</span>
                                    {item.product?.ean_code && <span className="rem-ean">{item.product.ean_code}</span>}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <LoadMore
                hasMore={query.hasMore}
                loading={query.loading}
                error={query.error}
                onLoadMore={query.loadMore}
                onRetry={query.retry}
                itemCount={query.items.length}
            />

            {notice && (
                <div className="toast rem-toast" role="status">
                    <span>{notice.text}</span>
                    {notice.undo && (
                        <button type="button" className="rem-undo" onClick={() => undo(notice.undo!)}>
                            Undo
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventoryRemove;
