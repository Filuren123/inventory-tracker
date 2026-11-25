import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { addInventory } from '../../api/inventory';
import { getProductByEAN, searchProducts } from '../../api/products';
import { errorMessage } from '../../api/axios';
import { useCategories } from '../../hooks/useCategories';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useLocations } from '../../hooks/useLocations';
import type { Product } from '../../model/product.interface';
import { categoryPath } from '../../utils/categoryTree';
import { todayISO } from '../../utils/dates';
import LocationSelect from '../common/LocationSelect';
import SmartDateField from '../common/SmartDateField';
import ProductDetails from '../product/ProductDetails';
import ProductForm from '../product/ProductForm';
import './InventoryAdd.css';

type EanState =
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'missing'; ean: string }
    | { state: 'error'; message: string };

type Status = { kind: 'success' | 'error'; text: string } | null;

const isDigits = (s: string) => /^\d+$/.test(s);

const InventoryAdd = () => {
    // Step 1: find or create the product
    const [term, setTerm] = useState('');
    const [selected, setSelected] = useState<Product | null>(null);
    const [creating, setCreating] = useState<{ ean_code: string; name: string } | null>(null);
    const [ean, setEan] = useState<EanState>({ state: 'idle' });
    const [results, setResults] = useState<{ q: string; items: Product[] }>({ q: '', items: [] });

    // Step 2: item details
    const [location, setLocation] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(todayISO());
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    const { categories, flat } = useCategories();
    const { locations, create: createLocation } = useLocations();

    const termRef = useRef<HTMLInputElement>(null);
    const expiryRef = useRef<HTMLInputElement>(null);
    const lastEan = useRef('');

    useEffect(() => termRef.current?.focus(), []);

    // Name search while typing (digits are treated as an EAN and looked up on Enter/blur).
    const query = useDebouncedValue(term.trim(), 200);
    const canSearch = query.length >= 2 && !isDigits(query) && !selected && !creating;
    useEffect(() => {
        if (!canSearch) return;
        const ac = new AbortController();
        searchProducts(query, 8, ac.signal).then(
            (items) => setResults({ q: query, items }),
            () => undefined,
        );
        return () => ac.abort();
    }, [query, canSearch]);
    const showResults = canSearch && results.q === query && query === term.trim();

    const select = (product: Product) => {
        setSelected(product);
        setCreating(null);
        setEan({ state: 'idle' });
        setTerm(product.ean_code ?? product.name);
        lastEan.current = product.ean_code ?? '';
        setLocation((current) => current || product.default_storage_location || '');
        requestAnimationFrame(() => expiryRef.current?.focus());
    };

    const lookupEan = async (raw: string) => {
        const code = raw.trim();
        if (!isDigits(code) || code === lastEan.current) return;
        lastEan.current = code;
        setEan({ state: 'loading' });
        try {
            const product = await getProductByEAN(code);
            if (lastEan.current !== code) return;
            if (product) select(product);
            else setEan({ state: 'missing', ean: code });
        } catch (err) {
            setEan({ state: 'error', message: errorMessage(err, 'Lookup failed') });
        }
    };

    const onTermChange = (value: string) => {
        setTerm(value);
        if (selected && value.trim() !== (selected.ean_code ?? selected.name)) setSelected(null);
        if (value.trim() !== lastEan.current) {
            lastEan.current = '';
            setEan({ state: 'idle' });
        }
    };

    const onTermKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault(); // scanners send Enter after the code
        const value = term.trim();
        if (isDigits(value)) lookupEan(value);
        else if (showResults && results.items[0]) select(results.items[0]);
    };

    const startCreate = (prefill: { ean_code: string; name: string }) => {
        setStatus(null);
        setSelected(null);
        setCreating(prefill);
    };

    const reset = () => {
        setTerm('');
        setSelected(null);
        setCreating(null);
        setEan({ state: 'idle' });
        lastEan.current = '';
        setLocation('');
        setQuantity('');
        setExpiryDate('');
        setPurchaseDate(todayISO());
        termRef.current?.focus();
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selected) {
            setStatus({ kind: 'error', text: 'Choose or create a product first.' });
            termRef.current?.focus();
            return;
        }
        if (!location) {
            setStatus({ kind: 'error', text: 'Choose a storage location.' });
            return;
        }
        setSaving(true);
        setStatus(null);
        try {
            await addInventory({
                product_id: selected.product_id,
                storage_location: location,
                quantity: quantity.trim() || undefined,
                expiry_date: expiryDate || undefined,
                purchase_date: purchaseDate || undefined,
            });
            setStatus({ kind: 'success', text: `Added ${selected.name}.` });
            reset();
        } catch (err) {
            setStatus({ kind: 'error', text: errorMessage(err, 'Could not add item') });
        } finally {
            setSaving(false);
        }
    };

    const termIsCode = isDigits(term.trim());

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Add item</h1>
                    <p>Scan a barcode or search by name, then fill in the details.</p>
                </div>
            </div>

            <div className="add-layout">
                <div className="add-main">
                    <section className="panel panel-body add-find">
                        <div className="field">
                            <div className="add-find-label">
                                <label htmlFor="term">EAN code or product name</label>
                                {!creating && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() =>
                                            startCreate(
                                                termIsCode
                                                    ? { ean_code: term.trim(), name: '' }
                                                    : { ean_code: '', name: selected ? '' : term.trim() },
                                            )
                                        }
                                    >
                                        + New product
                                    </button>
                                )}
                            </div>
                            <input
                                ref={termRef}
                                id="term"
                                className="input"
                                type="text"
                                placeholder="Scan, type an EAN, or search by name…"
                                value={term}
                                onChange={(e) => onTermChange(e.target.value)}
                                onBlur={() => lookupEan(term)}
                                onKeyDown={onTermKeyDown}
                                autoComplete="off"
                                role="combobox"
                                aria-expanded={showResults}
                                aria-controls="product-results"
                            />

                            {ean.state === 'loading' && <span className="hint">Looking up…</span>}
                            {ean.state === 'error' && <span className="field-error">{ean.message}</span>}
                            {selected && (
                                <span className="add-selected">
                                    ✓ {selected.name}
                                    {selected.brand ? ` · ${selected.brand}` : ''}
                                </span>
                            )}
                        </div>

                        {ean.state === 'missing' && !creating && (
                            <div className="add-missing">
                                <span>No product with EAN {ean.ean}.</span>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => startCreate({ ean_code: ean.ean, name: '' })}
                                >
                                    Create product
                                </button>
                            </div>
                        )}

                        {showResults && (
                            <ul id="product-results" className="add-results" role="listbox">
                                {results.items.map((p) => (
                                    <li key={p.product_id} role="option" aria-selected={false}>
                                        <button type="button" onClick={() => select(p)}>
                                            <span className="add-result-name">{p.name}</span>
                                            <span className="add-result-meta">
                                                {[p.brand, p.ean_code ?? 'No EAN'].filter(Boolean).join(' · ')}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                                {results.items.length === 0 && <li className="add-results-empty">No products found.</li>}
                                <li>
                                    <button
                                        type="button"
                                        className="add-result-create"
                                        onClick={() => startCreate({ ean_code: '', name: term.trim() })}
                                    >
                                        + New product “{term.trim()}”
                                    </button>
                                </li>
                            </ul>
                        )}
                    </section>

                    {creating && (
                        <ProductForm
                            key={`${creating.ean_code}|${creating.name}`}
                            initial={creating}
                            categories={flat}
                            locations={locations}
                            onCreateLocation={createLocation}
                            onCreated={(product) => {
                                select(product);
                                setStatus({ kind: 'success', text: `Created ${product.name}. Now add the item.` });
                            }}
                            onCancel={() => {
                                setCreating(null);
                                termRef.current?.focus();
                            }}
                        />
                    )}

                    {!creating && (
                        <form className="panel panel-body add-form" onSubmit={submit} noValidate>
                            <div className="section-label">Item details</div>
                            <div className="form-grid">
                                <SmartDateField
                                    ref={expiryRef}
                                    id="expiry-date"
                                    label="Expiry date"
                                    value={expiryDate}
                                    onChange={setExpiryDate}
                                />
                                <SmartDateField
                                    id="purchase-date"
                                    label="Purchase date"
                                    value={purchaseDate}
                                    onChange={setPurchaseDate}
                                />
                                <div className="field">
                                    <label htmlFor="location">
                                        Storage location <span className="required">*</span>
                                    </label>
                                    <LocationSelect
                                        id="location"
                                        locations={locations}
                                        value={location}
                                        onChange={setLocation}
                                        onCreate={createLocation}
                                        emptyLabel="Choose location…"
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="quantity">Quantity</label>
                                    <input
                                        id="quantity"
                                        className="input"
                                        placeholder="e.g. Half full"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </div>
                            </div>

                            {status && (
                                <div
                                    className={`alert ${status.kind === 'success' ? 'alert-success' : 'alert-error'}`}
                                    role="status"
                                >
                                    {status.text}
                                </div>
                            )}

                            <div className="add-actions">
                                <button type="submit" className="btn btn-primary" disabled={saving || !selected}>
                                    {saving ? 'Adding…' : 'Add to inventory'}
                                </button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        reset();
                                        setStatus(null);
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <aside className="panel panel-body add-product" aria-live="polite">
                    <div className="section-label">Product</div>
                    {selected ? (
                        <ProductDetails product={selected} categoryLabel={categoryPath(categories, selected.category_id)} />
                    ) : creating ? (
                        <p className="muted">Creating a new product.</p>
                    ) : (
                        <p className="muted">
                            No product selected. Scan a barcode, or search by name. Products without a barcode are found
                            by name.
                        </p>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default InventoryAdd;
