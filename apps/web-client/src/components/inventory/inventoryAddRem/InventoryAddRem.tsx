import { useRef, useEffect, useState } from 'react';
import './InventoryAddRem.css';
import { getProductByEAN, addProduct, updateProduct } from '../../../api/products';
import type { Product } from '../../../model/product.interface';
import { addInventory } from '../../../api/inventory';
import { getAllCategories } from '../../../api/categories';

// ---------------------------------------------------------------------------
// Smart date parser
// ---------------------------------------------------------------------------
function parseSmartDate(raw: string): string {
  if (!raw) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;

  const now = new Date();
  const thisYear = String(now.getFullYear());
  const thisMonth = String(now.getMonth() + 1).padStart(2, '0');

  let year = thisYear;
  let month = thisMonth;
  let day = digits;

  if (digits.length <= 2) {
    day = digits.padStart(2, '0');
  } else if (digits.length <= 4) {
    const padded = digits.padStart(4, '0');
    month = padded.slice(0, 2);
    day = padded.slice(2, 4);
  } else {
    const padded = digits.slice(-6).padStart(6, '0');
    year = `20${padded.slice(0, 2)}`;
    month = padded.slice(2, 4);
    day = padded.slice(4, 6);
  }

  return `${year}-${month}-${day}`;
}

const SmartDateField = ({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const handleBlur = () => {
    const parsed = parseSmartDate(draft);
    setDraft(parsed);
    onChange(parsed);
  };

  return (
    <div className="ap-field">
      <label className="ap-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="ap-input"
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

interface ProductFormState {
  productName: string; brand: string; productEan: string;
  categoryId: string; defaultStorage: string; minimumQuantity: string;
  packageSize: string; unit: string; minPrice: string;
  minPriceLocation: string; link: string;
}

const emptyProductForm: ProductFormState = {
  productName: '', brand: '', productEan: '', categoryId: '',
  defaultStorage: '', minimumQuantity: '', packageSize: '',
  unit: '', minPrice: '', minPriceLocation: '', link: '',
};

function productToForm(p: Product): ProductFormState {
  return {
    productName: p.name ?? '',
    brand: p.brand ?? '',
    productEan: p.ean_code ?? '',
    categoryId: p.category_id != null ? String(p.category_id) : '',
    defaultStorage: p.default_storage_location ?? '',
    minimumQuantity: p.minimum_quantity != null ? String(p.minimum_quantity) : '',
    packageSize: p.package_size != null ? String(p.package_size) : '',
    unit: p.unit ?? '',
    minPrice: p.min_price != null ? String(p.min_price) : '',
    minPriceLocation: p.min_price_location ?? '',
    link: p.link ?? '',
  };
}

const numOrNull = (v: string): number | null => v.trim() === '' ? null : Number(v);

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

// Category local definition matching API shape (assuming common id/name convention)
interface Category {
  category_id: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const InventoryAddRem = () => {
  // Inventory
  const [eanCode, setEanCode] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [inventorySubmitting, setInventorySubmitting] = useState(false);

  // Product
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);

  // Categories Dropdown State
  const [categories, setCategories] = useState<Category[]>([]);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eanRef = useRef<HTMLInputElement>(null);

  useEffect(() => { eanRef.current?.focus(); }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const showToast = (message: string, type: ToastType, duration = 2500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 300); // allow fade-out
    }, duration);
  };

  const preventEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const updateProductField = (field: keyof ProductFormState, value: string) =>
    setProductForm(prev => ({ ...prev, [field]: value }));

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setActiveProductId(null);
    setProductError(null);
  };

  // ── EAN lookup ────────────────────────────────────────────────────────────
  const lookupEan = async (ean: string) => {
    const code = ean.trim();
    if (!code || lookupPending) return;
    setLookupPending(true);
    try {
      const product = await Promise.race([
        getProductByEAN(code),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Lookup timed out')), 8000)
        ),
      ]);

      if (product) {
        setProductForm(productToForm(product));
        setActiveProductId(product.product_id);
        setProductError(null);
        if (product.default_storage_location) setStorageLocation(product.default_storage_location);
      } else {
        showToast("Product doesn't exist", 'error', 2000);
        setTimeout(() => {
          resetProductForm();
          updateProductField('productEan', code);
        }, 2000);
      }
    } catch (err: any) {
      console.error('EAN lookup failed:', err);
      showToast(err.message ?? 'Failed to look up EAN', 'error');
    } finally {
      setLookupPending(false);
    }
  };

  const handleEanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); lookupEan(eanCode); }
  };

  // ── Form submits ──────────────────────────────────────────────────────────
  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductId) {
      showToast('Find or add a product first', 'error');
      return;
    }
    if (!storageLocation.trim()) {
      showToast('Storage location is required', 'error');
      return;
    }

    setInventorySubmitting(true);
    try {
      await addInventory(activeProductId, storageLocation, quantity || undefined, expiryDate || undefined, purchaseDate || undefined);
      const name = productForm.productName || 'Item';
      showToast(`${name} added to inventory`, 'success', 3000);
      setStorageLocation('');
      setQuantity('');
      setExpiryDate('');
      setPurchaseDate(todayISO());
      setEanCode('');
      resetProductForm();
      eanRef.current?.focus();
    } catch (err: any) {
      showToast(err.message ?? 'Failed to add inventory', 'error');
    } finally {
      setInventorySubmitting(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);
    if (!productForm.productName.trim()) { setProductError('Product name is required.'); return; }

    setProductSubmitting(true);
    try {
      const payload = [
        productForm.productEan.trim() || null,
        productForm.productName,
        productForm.brand.trim() || null,
        numOrNull(productForm.categoryId),
        productForm.defaultStorage.trim() || null,
        productForm.minimumQuantity.trim() === '' ? 0 : Number(productForm.minimumQuantity),
        numOrNull(productForm.packageSize),
        productForm.unit.trim() || null,
        numOrNull(productForm.minPrice),
        productForm.minPriceLocation.trim() || null,
        productForm.link.trim() || null,
      ] as const;

      const product = activeProductId != null
        ? await updateProduct(String(activeProductId), ...payload)
        : await addProduct(...payload);

      setProductForm(productToForm(product));
      setActiveProductId(product.product_id);
      if (product.default_storage_location) setStorageLocation(product.default_storage_location);
    } catch (err: any) {
      setProductError(err.message ?? 'Failed to save product');
    } finally {
      setProductSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div className={`ap-toast ap-toast--${toast.type} ${toast.visible ? 'ap-toast--in' : 'ap-toast--out'}`}>
          {toast.type === 'success'
            ? <span className="ap-toast-icon">✓</span>
            : <span className="ap-toast-icon">✕</span>}
          {toast.message}
        </div>
      )}

      <div className="ap-page">

        {/* ── Left panel: Add Inventory ── */}
        <div className="ap-panel">
          <div className="ap-panel-header">
            <span className="ap-eyebrow">Inventory</span>
            <h1 className="ap-title">Add item</h1>
            <p className="ap-subtitle">Scan a barcode or enter an EAN code to register stock</p>
          </div>

          <form className="ap-form" onSubmit={handleInventorySubmit} onKeyDown={preventEnter}>
            <div className="ap-scan-zone">
              <label className="ap-label" htmlFor="ean-code">
                <svg className="ap-barcode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 5v14M7 5v14M11 5v14M15 5v9M19 5v9M15 17h4v2h-4zM3 3h4M3 21h4M17 3h4M17 21h4" strokeLinecap="round" />
                </svg>
                EAN Code
              </label>
              <input
                ref={eanRef}
                id="ean-code"
                className={`ap-input ap-input--scan ${lookupPending ? 'ap-input--loading' : ''}`}
                type="text"
                placeholder="Scan or type EAN..."
                value={eanCode}
                onChange={e => { setEanCode(e.target.value); }}
                onKeyDown={handleEanKeyDown}
                onBlur={() => lookupEan(eanCode)}
                autoComplete="off"
              />
              {lookupPending && <p className="ap-hint">Looking up…</p>}
              {!lookupPending && activeProductId && (
                <p className="ap-hint ap-hint--found">✓ {productForm.productName}</p>
              )}
            </div>

            <div className="ap-section-label">Item details</div>

            <div className="ap-field">
              <label className="ap-label" htmlFor="storage-location">Storage location</label>
              <input
                id="storage-location"
                className="ap-input"
                type="text"
                placeholder="e.g. Pantry, Fridge, Freezer"
                value={storageLocation}
                onChange={e => setStorageLocation(e.target.value)}
              />
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  className="ap-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>
              <SmartDateField id="purchase-date" label="Purchase date" value={purchaseDate} onChange={setPurchaseDate} />
            </div>

            <SmartDateField id="expiry-date" label="Expiry date" value={expiryDate} onChange={setExpiryDate} />

            <button type="submit" className="ap-btn ap-btn--primary" disabled={inventorySubmitting}>
              {inventorySubmitting ? 'Adding…' : 'Add to inventory'}
            </button>
          </form>
        </div>

        <div className="ap-divider" />

        {/* ── Right panel: Add / Update Product ── */}
        <div className="ap-panel">
          <div className="ap-panel-header">
            <span className="ap-eyebrow">Product</span>
            <h1 className="ap-title">{activeProductId ? 'Update product' : 'New product'}</h1>
            <p className="ap-subtitle">
              {activeProductId
                ? 'Product matched by EAN — review and update if needed'
                : 'Register a product that can be tracked in inventory'}
            </p>
          </div>

          <form className="ap-form" onSubmit={handleProductSubmit} onKeyDown={preventEnter}>
            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="product-name">Name</label>
                <input id="product-name" className="ap-input" type="text" placeholder="Product name" value={productForm.productName} onChange={e => updateProductField('productName', e.target.value)} />
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="brand">Brand</label>
                <input id="brand" className="ap-input" type="text" placeholder="Brand name" value={productForm.brand} onChange={e => updateProductField('brand', e.target.value)} />
              </div>
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="product-ean">EAN code</label>
                <input id="product-ean" className="ap-input" type="text" placeholder="Barcode" value={productForm.productEan} onChange={e => updateProductField('productEan', e.target.value)} />
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="category">Category</label>
                <select 
                  id="category" 
                  className="ap-input" 
                  value={productForm.categoryId} 
                  onChange={e => updateProductField('categoryId', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ap-section-label">Storage & quantity</div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="default-storage">Default storage</label>
                <input id="default-storage" className="ap-input" type="text" placeholder="e.g. Pantry" value={productForm.defaultStorage} onChange={e => updateProductField('defaultStorage', e.target.value)} />
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="min-quantity">Min. quantity</label>
                <input id="min-quantity" className="ap-input" type="number" min="0" placeholder="0" value={productForm.minimumQuantity} onChange={e => updateProductField('minimumQuantity', e.target.value)} />
              </div>
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="package-size">Package size</label>
                <input id="package-size" className="ap-input" type="number" placeholder="e.g. 500" value={productForm.packageSize} onChange={e => updateProductField('packageSize', e.target.value)} />
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="unit">Unit</label>
                <input id="unit" className="ap-input" type="text" placeholder="g, ml, pcs..." value={productForm.unit} onChange={e => updateProductField('unit', e.target.value)} />
              </div>
            </div>

            <div className="ap-section-label">Pricing</div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="min-price">Best price</label>
                <div className="ap-input-prefix-wrap">
                  <span className="ap-input-prefix">kr</span>
                  <input id="min-price" className="ap-input ap-input--prefixed" type="number" placeholder="0.00" step="0.01" min="0" value={productForm.minPrice} onChange={e => updateProductField('minPrice', e.target.value)} />
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="min-price-location">Found at</label>
                <input id="min-price-location" className="ap-input" type="text" placeholder="Store name" value={productForm.minPriceLocation} onChange={e => updateProductField('minPriceLocation', e.target.value)} />
              </div>
            </div>

            <div className="ap-field">
              <label className="ap-label" htmlFor="link">Link</label>
              <input id="link" className="ap-input" type="url" placeholder="https://" value={productForm.link} onChange={e => updateProductField('link', e.target.value)} />
            </div>

            {productError && <p className="ap-field-error">{productError}</p>}

            <div className={`ap-form-actions ${activeProductId ? 'ap-form-actions--row' : ''}`}>
              <button type="submit" className="ap-btn ap-btn--secondary" disabled={productSubmitting}>
                {productSubmitting ? 'Saving…' : activeProductId ? 'Update product' : 'Save product'}
              </button>
              {activeProductId && (
                <button type="button" className="ap-btn ap-btn--ghost" onClick={resetProductForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default InventoryAddRem;