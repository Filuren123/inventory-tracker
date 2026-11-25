import { useState, type FormEvent } from 'react';
import { addProduct, updateProduct } from '../../api/products';
import { errorMessage } from '../../api/axios';
import type { Product } from '../../model/product.interface';
import type { CategoryNode } from '../../utils/categoryTree';
import CategorySelect from '../common/CategorySelect';
import LocationSelect from '../common/LocationSelect';
import './ProductForm.css';

type Mode =
    /** Prefill: EAN from a failed scan, or a name typed into the search. */
    | { mode: 'create'; initial: { ean_code: string; name: string } }
    | { mode: 'edit'; product: Product };

type Props = Mode & {
    categories: CategoryNode[];
    locations: string[];
    onCreateLocation: (name: string) => Promise<string>;
    onSaved: (product: Product) => void;
    onCancel: () => void;
    /** Render without its own border/heading, e.g. inside a modal. */
    plain?: boolean;
};

const UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'st'];

const toNumber = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));
const fromNumber = (n: number | string | null | undefined) => (n == null ? '' : String(Number(n)));

/** Create or edit a product. Only the name is required; EAN may be left empty. */
const ProductForm = (props: Props) => {
    const { categories, locations, onCreateLocation, onSaved, onCancel, plain } = props;
    const p = props.mode === 'edit' ? props.product : null;

    const [ean, setEan] = useState(p ? (p.ean_code ?? '') : props.mode === 'create' ? props.initial.ean_code : '');
    const [name, setName] = useState(p ? p.name : props.mode === 'create' ? props.initial.name : '');
    const [brand, setBrand] = useState(p?.brand ?? '');
    const [categoryId, setCategoryId] = useState<number | null>(p?.category_id ?? null);
    const [location, setLocation] = useState(p?.default_storage_location ?? '');
    const [size, setSize] = useState(fromNumber(p?.package_size));
    const [unit, setUnit] = useState(p?.unit ?? '');
    const [minQuantity, setMinQuantity] = useState(String(p?.minimum_quantity ?? 1));
    const [price, setPrice] = useState(fromNumber(p?.min_price));
    const [priceWhere, setPriceWhere] = useState(p?.min_price_location ?? '');
    const [link, setLink] = useState(p?.link ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const eanInvalid = ean.trim() !== '' && !/^\d{6,14}$/.test(ean.trim());
    const hasMoreDetails = Boolean(p && (p.min_price != null || p.min_price_location || p.link || p.minimum_quantity !== 1));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }
        if (eanInvalid) {
            setError('EAN code must be 6–14 digits, or left empty.');
            return;
        }
        setSaving(true);
        setError(null);
        const fields = {
            ean_code: ean.trim() || null,
            name: name.trim(),
            brand: brand.trim() || null,
            category_id: categoryId,
            default_storage_location: location || null,
            minimum_quantity: Number(minQuantity) || 1,
            package_size: toNumber(size),
            unit: unit || null,
            min_price: toNumber(price),
            min_price_location: priceWhere.trim() || null,
            link: link.trim() || null,
        };
        try {
            onSaved(p ? await updateProduct(p.product_id, fields) : await addProduct(fields));
        } catch (err) {
            setError(errorMessage(err, p ? 'Could not save product' : 'Could not create product'));
            setSaving(false);
        }
    };

    return (
        <form
            className={`product-form ${plain ? 'product-form--plain' : ''}`}
            onSubmit={submit}
            noValidate
            aria-label={p ? `Edit ${p.name}` : 'New product'}
        >
            {!plain && (
                <div className="product-form-head">
                    <h2>{p ? 'Edit product' : 'New product'}</h2>
                    <p className="muted">Fill in what you know; only the name is required.</p>
                </div>
            )}

            <div className="form-grid">
                <div className="field">
                    <label htmlFor="np-name">
                        Name <span className="required">*</span>
                    </label>
                    <input
                        id="np-name"
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus={!p}
                        autoComplete="off"
                    />
                </div>
                <div className="field">
                    <label htmlFor="np-ean">EAN code</label>
                    <input
                        id="np-ean"
                        className="input"
                        inputMode="numeric"
                        value={ean}
                        onChange={(e) => setEan(e.target.value)}
                        aria-invalid={eanInvalid}
                        autoComplete="off"
                    />
                    <span className={eanInvalid ? 'field-error' : 'hint'}>
                        {eanInvalid ? '6–14 digits' : 'Leave empty if the product has no barcode'}
                    </span>
                </div>
                <div className="field">
                    <label htmlFor="np-brand">Brand</label>
                    <input
                        id="np-brand"
                        className="input"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="field">
                    <label htmlFor="np-category">Category</label>
                    <CategorySelect
                        id="np-category"
                        options={categories}
                        value={categoryId}
                        onChange={setCategoryId}
                        emptyLabel="Uncategorised"
                    />
                </div>
                <div className="field">
                    <label htmlFor="np-location">Default storage location</label>
                    <LocationSelect
                        id="np-location"
                        locations={locations}
                        value={location}
                        onChange={setLocation}
                        onCreate={onCreateLocation}
                        emptyLabel="None"
                    />
                </div>
                <div className="field">
                    <span className="label" id="np-size-label">
                        Package size
                    </span>
                    <div className="product-form-size" role="group" aria-labelledby="np-size-label">
                        <input
                            className="input"
                            inputMode="decimal"
                            placeholder="500"
                            aria-label="Package size"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                        />
                        <select className="select" aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                            <option value="">Unit</option>
                            {[...new Set([...UNITS, ...(unit ? [unit] : [])])].map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <details className="product-form-more" open={hasMoreDetails}>
                <summary>More details</summary>
                <div className="form-grid">
                    <div className="field">
                        <label htmlFor="np-min">Minimum quantity</label>
                        <input
                            id="np-min"
                            className="input"
                            type="number"
                            min={0}
                            step={1}
                            value={minQuantity}
                            onChange={(e) => setMinQuantity(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="np-price">Lowest price (kr)</label>
                        <input
                            id="np-price"
                            className="input"
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="np-price-where">Lowest price at</label>
                        <input
                            id="np-price-where"
                            className="input"
                            placeholder="e.g. Willys"
                            value={priceWhere}
                            onChange={(e) => setPriceWhere(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="np-link">Link</label>
                        <input
                            id="np-link"
                            className="input"
                            type="url"
                            placeholder="https://…"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>
                </div>
            </details>

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            <div className="product-form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : p ? 'Save changes' : 'Create product'}
                </button>
                <button type="button" className="btn" onClick={onCancel} disabled={saving}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
