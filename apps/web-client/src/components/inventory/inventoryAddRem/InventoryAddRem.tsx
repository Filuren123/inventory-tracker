import { useRef, useEffect, useState } from 'react';
import './InventoryAddRem.css';
import { getProductByEAN, addProduct, updateProduct } from '../../../api/products';
import type { Product } from '../../../model/product.interface';
import { addInventory } from '../../../api/inventory';

// ---------------------------------------------------------------------------
// Smart date text field
// ---------------------------------------------------------------------------
// Accepts partial numeric input and expands it to YYYY-MM-DD on blur:
//   1-2 digits  -> day only            "26"     -> thisYear-thisMonth-26
//   3-4 digits  -> month + day         "0534"   -> thisYear-05-34
//   5-6 digits  -> year + month + day  "270202" -> 2027-02-02
// If the value already matches YYYY-MM-DD it is left untouched.
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

interface SmartDateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const SmartDateField = ({ id, label, value, onChange }: SmartDateFieldProps) => {
  const [draft, setDraft] = useState(value);

  // Keep the draft in sync when the parent resets/prefills the value
  // (e.g. purchase date defaulting to today, or cancel reverting the form).
  useEffect(() => {
    setDraft(value);
  }, [value]);

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
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface ProductFormState {
  productName: string;
  brand: string;
  productEan: string;
  categoryId: string;
  defaultStorage: string;
  minimumQuantity: string;
  packageSize: string;
  unit: string;
  minPrice: string;
  minPriceLocation: string;
  link: string;
}

const emptyProductForm: ProductFormState = {
  productName: '',
  brand: '',
  productEan: '',
  categoryId: '',
  defaultStorage: '',
  minimumQuantity: '',
  packageSize: '',
  unit: '',
  minPrice: '',
  minPriceLocation: '',
  link: '',
};

function productToForm(product: Product): ProductFormState {
  return {
    productName: product.name ?? '',
    brand: product.brand ?? '',
    productEan: product.ean_code ?? '',
    categoryId: product.category_id != null ? String(product.category_id) : '',
    defaultStorage: product.default_storage_location ?? '',
    minimumQuantity: product.minimum_quantity != null ? String(product.minimum_quantity) : '',
    packageSize: product.package_size != null ? String(product.package_size) : '',
    unit: product.unit ?? '',
    minPrice: product.min_price != null ? String(product.min_price) : '',
    minPriceLocation: product.min_price_location ?? '',
    link: product.link ?? '',
  };
}

// number-or-null helper for optional numeric fields
const numOrNull = (v: string): number | null => (v.trim() === '' ? null : Number(v));

const InventoryAddRem = () => {
  // Inventory state
  const [eanCode, setEanCode] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [inventorySubmitting, setInventorySubmitting] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventorySuccess, setInventorySuccess] = useState<string | null>(null);

  // Product state
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  // product_id of the product currently linked to this scan — used both to know
  // whether the product form is in "update" mode and as the target for addInventory.
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Not-found popup state
  const [showNotFoundPopup, setShowNotFoundPopup] = useState(false);
  const [popupEan, setPopupEan] = useState('');
  const [lookupPending, setLookupPending] = useState(false);

  const eanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    eanRef.current?.focus();
  }, []);

  const preventEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const updateProductField = (field: keyof ProductFormState, value: string) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setActiveProductId(null);
    setProductError(null);
  };

  // ---- EAN lookup -----------------------------------------------------
  const lookupEan = async (ean: string) => {
    const code = ean.trim();
    if (!code || lookupPending) return;

    setLookupPending(true);
    setInventoryError(null);
    try {
      // Guard against the request (or the backend) hanging indefinitely —
      // without this, a non-responding server leaves the UI stuck on
      // "Looking up…" forever.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Lookup timed out — check the server.')), 8000),
      );
      const product = await Promise.race([getProductByEAN(code), timeout]);

      if (product) {
        setProductForm(productToForm(product));
        setActiveProductId(product.product_id);
        setProductError(null);
        if (product.default_storage_location) {
          setStorageLocation(product.default_storage_location);
        }
      } else {
        setPopupEan(code);
        setShowNotFoundPopup(true);
      }
    } catch (err: any) {
      // Logged so the real cause (network error, CORS, the response/data typo
      // in getProductByEAN's catch block, etc.) is visible in devtools even
      // though the message shown to the user is generic.
      console.error('EAN lookup failed:', err);
      setInventoryError(err.message ?? 'Failed to look up EAN code');
    } finally {
      setLookupPending(false);
    }
  };

  const handleEanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookupEan(eanCode);
    }
  };

  const handleEanBlur = () => {
    lookupEan(eanCode);
  };

  // ---- Not-found popup --------------------------------------------------
  const closePopupAndPrefill = () => {
    setShowNotFoundPopup(false);
    resetProductForm();
    updateProductField('productEan', popupEan);
  };

  // Any button click inside the popup closes it and prefills the EAN.
  const handlePopupClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      closePopupAndPrefill();
    }
  };

  // ---- Form submits -------------------------------------------------
  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInventoryError(null);
    setInventorySuccess(null);

    if (!activeProductId) {
      setInventoryError('Add or find a matching product before adding inventory.');
      return;
    }
    if (!storageLocation.trim()) {
      setInventoryError('Storage location is required.');
      return;
    }

    setInventorySubmitting(true);
    try {
      await addInventory(
        activeProductId,
        storageLocation,
        quantity || undefined,
        expiryDate || undefined,
        purchaseDate || undefined,
      );
      setInventorySuccess('Added to inventory.');
      setStorageLocation('');
      setQuantity('');
      setExpiryDate('');
      setPurchaseDate(todayISO());
      setEanCode('');
      eanRef.current?.focus();
    } catch (err: any) {
      setInventoryError(err.message ?? 'Failed to add inventory');
    } finally {
      setInventorySubmitting(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);

    if (!productForm.productName.trim()) {
      setProductError('Product name is required.');
      return;
    }

    setProductSubmitting(true);
    try {
      const eanValue = productForm.productEan.trim() || null;
      const brandValue = productForm.brand.trim() || null;
      const categoryValue = numOrNull(productForm.categoryId);
      const defaultStorageValue = productForm.defaultStorage.trim() || null;
      const minimumQuantityValue = productForm.minimumQuantity.trim() === ''
        ? 0
        : Number(productForm.minimumQuantity);
      const packageSizeValue = numOrNull(productForm.packageSize);
      const unitValue = productForm.unit.trim() || null;
      const minPriceValue = numOrNull(productForm.minPrice);
      const minPriceLocationValue = productForm.minPriceLocation.trim() || null;
      const linkValue = productForm.link.trim() || null;

      let product: Product;
      if (activeProductId != null) {
        product = await updateProduct(
          String(activeProductId),
          eanValue,
          productForm.productName,
          brandValue,
          categoryValue,
          defaultStorageValue,
          minimumQuantityValue,
          packageSizeValue,
          unitValue,
          minPriceValue,
          minPriceLocationValue,
          linkValue,
        );
      } else {
        product = await addProduct(
          eanValue,
          productForm.productName,
          brandValue,
          categoryValue,
          defaultStorageValue,
          minimumQuantityValue,
          packageSizeValue,
          unitValue,
          minPriceValue,
          minPriceLocationValue,
          linkValue,
        );
      }

      setProductForm(productToForm(product));
      setActiveProductId(product.product_id);
      if (product.default_storage_location) {
        setStorageLocation(product.default_storage_location);
      }
    } catch (err: any) {
      setProductError(err.message ?? 'Failed to save product');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    resetProductForm();
  };

  return (
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
                <path d="M3 5v14M7 5v14M11 5v14M15 5v9M19 5v9M15 17h4v2h-4zM3 3h4M3 21h4M17 3h4M17 21h4" strokeLinecap="round"/>
              </svg>
              EAN Code
            </label>
            <input
              ref={eanRef}
              id="ean-code"
              className="ap-input ap-input--scan"
              type="text"
              placeholder="Scan or type EAN..."
              value={eanCode}
              onChange={e => setEanCode(e.target.value)}
              onKeyDown={handleEanKeyDown}
              onBlur={handleEanBlur}
              autoComplete="off"
            />
            {lookupPending && <p className="ap-hint">Looking up…</p>}
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
            <SmartDateField
              id="purchase-date"
              label="Purchase date"
              value={purchaseDate}
              onChange={setPurchaseDate}
            />
          </div>

          <SmartDateField
            id="expiry-date"
            label="Expiry date"
            value={expiryDate}
            onChange={setExpiryDate}
          />

          {inventoryError && <p className="ap-error">{inventoryError}</p>}
          {inventorySuccess && <p className="ap-success">{inventorySuccess}</p>}

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
              ? 'This product already exists — review and update its details'
              : 'Register a product that can be tracked in inventory'}
          </p>
        </div>

        <form className="ap-form" onSubmit={handleProductSubmit} onKeyDown={preventEnter}>

          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label" htmlFor="product-name">Name</label>
              <input
                id="product-name"
                className="ap-input"
                type="text"
                placeholder="Product name"
                value={productForm.productName}
                onChange={e => updateProductField('productName', e.target.value)}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label" htmlFor="brand">Brand</label>
              <input
                id="brand"
                className="ap-input"
                type="text"
                placeholder="Brand name"
                value={productForm.brand}
                onChange={e => updateProductField('brand', e.target.value)}
              />
            </div>
          </div>

          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label" htmlFor="product-ean">EAN code</label>
              <input
                id="product-ean"
                className="ap-input"
                type="text"
                placeholder="Barcode"
                value={productForm.productEan}
                onChange={e => updateProductField('productEan', e.target.value)}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label" htmlFor="category">Category</label>
              <input
                id="category"
                className="ap-input"
                type="number"
                placeholder="Category ID"
                value={productForm.categoryId}
                onChange={e => updateProductField('categoryId', e.target.value)}
              />
            </div>
          </div>

          <div className="ap-section-label">Storage & quantity</div>

          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label" htmlFor="default-storage">Default storage</label>
              <input
                id="default-storage"
                className="ap-input"
                type="text"
                placeholder="e.g. Pantry"
                value={productForm.defaultStorage}
                onChange={e => updateProductField('defaultStorage', e.target.value)}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label" htmlFor="min-quantity">Min. quantity</label>
              <input
                id="min-quantity"
                className="ap-input"
                type="number"
                min="0"
                placeholder="0"
                value={productForm.minimumQuantity}
                onChange={e => updateProductField('minimumQuantity', e.target.value)}
              />
            </div>
          </div>

          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label" htmlFor="package-size">Package size</label>
              <input
                id="package-size"
                className="ap-input"
                type="number"
                placeholder="e.g. 500"
                value={productForm.packageSize}
                onChange={e => updateProductField('packageSize', e.target.value)}
              />
            </div>
            <div className="ap-field">
              <label className="ap-label" htmlFor="unit">Unit</label>
              <input
                id="unit"
                className="ap-input"
                type="text"
                placeholder="g, ml, pcs..."
                value={productForm.unit}
                onChange={e => updateProductField('unit', e.target.value)}
              />
            </div>
          </div>

          <div className="ap-section-label">Pricing</div>

          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label" htmlFor="min-price">Best price</label>
              <div className="ap-input-prefix-wrap">
                <span className="ap-input-prefix">kr</span>
                <input
                  id="min-price"
                  className="ap-input ap-input--prefixed"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={productForm.minPrice}
                  onChange={e => updateProductField('minPrice', e.target.value)}
                />
              </div>
            </div>
            <div className="ap-field">
              <label className="ap-label" htmlFor="min-price-location">Found at</label>
              <input
                id="min-price-location"
                className="ap-input"
                type="text"
                placeholder="Store name"
                value={productForm.minPriceLocation}
                onChange={e => updateProductField('minPriceLocation', e.target.value)}
              />
            </div>
          </div>

          <div className="ap-field">
            <label className="ap-label" htmlFor="link">Link</label>
            <input
              id="link"
              className="ap-input"
              type="url"
              placeholder="https://"
              value={productForm.link}
              onChange={e => updateProductField('link', e.target.value)}
            />
          </div>

          {productError && <p className="ap-error">{productError}</p>}

          <button type="submit" className="ap-btn ap-btn--secondary" disabled={productSubmitting}>
            {productSubmitting ? 'Saving…' : activeProductId ? 'Update product' : 'Save product'}
          </button>

          {activeProductId && (
            <button
              type="button"
              className="ap-btn ap-btn--ghost"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* ── Not-found popup ── */}
      {showNotFoundPopup && (
        <div className="ap-popup-overlay" onClick={closePopupAndPrefill}>
          <div className="ap-popup" onClick={e => { e.stopPropagation(); handlePopupClick(e); }}>
            <div className="ap-popup-header">
              <span>No product found for {popupEan}</span>
              <button type="button" className="ap-popup-close" onClick={closePopupAndPrefill}>
                ×
              </button>
            </div>
            <div className="ap-popup-body">
              <iframe
                className="ap-popup-iframe"
                title="Google image search"
                src={`https://www.google.com/search?q=${encodeURIComponent(popupEan)}&tbm=isch&igu=1`}
              />
              <p className="ap-popup-fallback-note">
                If the results above don't load,{' '}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(popupEan)}&tbm=isch`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  open the search in a new tab
                </a>{' '}
                instead.
              </p>
              <button type="button" className="ap-btn ap-btn--secondary" onClick={closePopupAndPrefill}>
                Continue to add product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAddRem;