import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { addLocation, deleteLocation, getLocationsWithUsage, type StorageLocationUsage } from '../../api/locations';
import { errorMessage } from '../../api/axios';
import './LocationManager.css';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** List, add and delete storage locations. Deleting a used location moves its items. */
const LocationManager = () => {
    const [rows, setRows] = useState<StorageLocationUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [deleting, setDeleting] = useState<number | null>(null);
    const [moveTo, setMoveTo] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    const fetchRows = useCallback(
        () =>
            getLocationsWithUsage().then(
                (data) => {
                    setRows(data);
                    setLoading(false);
                },
                (err) => {
                    setError(errorMessage(err, 'Could not load locations'));
                    setLoading(false);
                },
            ),
        [],
    );

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const run = async (action: () => Promise<unknown>) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            await fetchRows();
            return true;
        } catch (err) {
            setError(errorMessage(err, 'Could not save the change'));
            return false;
        } finally {
            setBusy(false);
        }
    };

    const add = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (await run(() => addLocation(name.trim()))) setName('');
    };

    const startDelete = (id: number) => {
        setError(null);
        setMoveTo(null);
        setDeleting(deleting === id ? null : id);
    };

    const confirmDelete = async (row: StorageLocationUsage) => {
        if (row.items > 0 && moveTo == null) return;
        if (await run(() => deleteLocation(row.id, moveTo ?? undefined))) setDeleting(null);
    };

    return (
        <section className="manage-section" aria-labelledby="locations-title">
            <div className="manage-section-header">
                <div>
                    <h2 id="locations-title">Storage locations</h2>
                    <p>The places items can be stored. Shown in the location dropdowns.</p>
                </div>
            </div>

            <form className="loc-add" onSubmit={add}>
                <div className="field">
                    <label htmlFor="loc-name">New location</label>
                    <input
                        id="loc-name"
                        className="input"
                        placeholder="e.g. Kyl"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
                    Add
                </button>
            </form>

            {error && <div className="alert alert-error loc-error">{error}</div>}

            <div className="panel">
                {loading && (
                    <div className="empty-state">
                        <span className="spinner" aria-label="Loading" />
                    </div>
                )}
                {!loading && rows.length === 0 && <div className="empty-state">No storage locations yet.</div>}
                <ul className="loc-list">
                    {rows.map((row) => {
                        const others = rows.filter((r) => r.id !== row.id);
                        const isDeleting = deleting === row.id;
                        return (
                            <li key={row.id} className={`loc-row ${isDeleting ? 'loc-row--editing' : ''}`}>
                                <div className="loc-line">
                                    <span className="loc-name">{row.name}</span>
                                    <span className="loc-usage">
                                        {plural(row.items, 'item', 'items')}
                                        {row.products > 0 && ` · default for ${plural(row.products, 'product', 'products')}`}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm loc-delete"
                                        onClick={() => startDelete(row.id)}
                                        aria-pressed={isDeleting}
                                        aria-label={`Delete ${row.name}`}
                                    >
                                        Delete
                                    </button>
                                </div>

                                {isDeleting && (
                                    <div className="loc-confirm">
                                        {row.items > 0 ? (
                                            <>
                                                <label htmlFor={`move-${row.id}`}>
                                                    Move {plural(row.items, 'item', 'items')}
                                                    {row.products > 0 && ` and ${plural(row.products, 'product default', 'product defaults')}`} to
                                                </label>
                                                <select
                                                    id={`move-${row.id}`}
                                                    className="select"
                                                    value={moveTo ?? ''}
                                                    onChange={(e) => setMoveTo(e.target.value ? Number(e.target.value) : null)}
                                                >
                                                    <option value="">Choose location…</option>
                                                    {others.map((o) => (
                                                        <option key={o.id} value={o.id}>
                                                            {o.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {others.length === 0 && (
                                                    <span className="field-error">Add another location first.</span>
                                                )}
                                            </>
                                        ) : (
                                            <span>
                                                Delete <strong>{row.name}</strong>?
                                                {row.products > 0 &&
                                                    ` ${plural(row.products, 'product', 'products')} will no longer have a default location.`}
                                            </span>
                                        )}
                                        <div className="loc-confirm-buttons">
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => confirmDelete(row)}
                                                disabled={busy || (row.items > 0 && moveTo == null)}
                                            >
                                                {row.items > 0 ? 'Move and delete' : 'Delete'}
                                            </button>
                                            <button type="button" className="btn btn-sm" onClick={() => setDeleting(null)}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
};

export default LocationManager;
