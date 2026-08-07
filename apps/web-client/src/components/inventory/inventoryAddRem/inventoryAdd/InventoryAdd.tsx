import { useRef, useState } from "react";
import SmartDateField from "../../../utils/smartDateField/SmartDateField";
import "./InventoryAdd.css";
import { todayISO } from "../../../../utils/dates";
import { addInventory } from "../../../../api/inventory";
import ProductDisplay from "../../../product/productDisplay/ProductDisplay";
import { getProductByEAN } from "../../../../api/products";

const InventoryAdd = () => {
    const [eanCode, setEanCode] = useState('');
    const [activeProductId, setActiveProductId] = useState<number | null>(null);
    const [storageLocation, setStorageLocation] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(todayISO());

    const eanRef = useRef<HTMLInputElement>(null);
    
    const handleEanInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const activeProduct = await getProductByEAN(value);
        if (activeProduct) {
            setActiveProductId(activeProduct.product_id);
            setStorageLocation(activeProduct.default_storage_location);
            setEanCode(value);
        } else {
            setActiveProductId(null);
        }
    }

    // Handle the form submission to add the item to the inventory
    const handleInventorySubmit = async (e) => {
        e.preventDefault();

        // Reject if no product is selected
        if (!activeProductId) {
            // TODO: Show better alert
            alert('Please select a product before adding to inventory.');
            return;
        }

        try {
            console.log(expiryDate)
            await addInventory(activeProductId, storageLocation, quantity || undefined, expiryDate || undefined, purchaseDate || undefined)

            alert('Item added to inventory successfully!');
        } catch (error) {
            console.error('Failed to add item to inventory:', error);
            alert('Failed to add item to inventory. Please try again.');
        } finally {
            resetForm();
        }
    }

    const resetForm = () => {
        setEanCode('');
        setActiveProductId(null);
        setStorageLocation('');
        setQuantity('');
        setExpiryDate('');
        setPurchaseDate(todayISO());

        setTimeout(() => {
            eanRef.current?.focus();
        }, 0);
    }

    const eanEnterPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        const expireDateField = document.getElementById('expiry-date') as HTMLInputElement;
        if (e.key === 'Enter') {
            e.preventDefault();
            expireDateField.focus();
        }
    }

    const handleEanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEanCode(e.target.value);
    }
    
    return (
        <main className="inventory-add-main">
            <section className="inventory-add-main-form">
                <h2 className="additem-subheader">INVENTORY</h2>
                <h1 className="additem-header">Add Item</h1>
                <div>
                    <div>Scan a barcode or enter item name</div>
                </div>
                <div className="additem-ean-searchbar">
                    <label htmlFor="eanOrName">
                        EAN Code or Name
                    </label>
                    <input ref={eanRef} type="text" name="" id="eanOrName" placeholder="Enter EAN or name..." value={eanCode} onChange={handleEanChange} onBlur={handleEanInputChange} onKeyDown={eanEnterPress} autoComplete="off" />
                </div>
                <form onSubmit={handleInventorySubmit}>
                    <h6 className="item-details-separator">ITEM DETAILS</h6>
                    <div className="additem-item-details">
                        <div className="additem-expiry-date">
                            <SmartDateField id="expiry-date" label="Expiry Date" value={expiryDate} onChange={setExpiryDate} />
                        </div>
                        <div className="additem-quantity-purchase-date">
                            <div className="quantity">
                                <label htmlFor="quantity">Quantity of items content</label>
                                <input type="text" name="" id="quantity" placeholder="E.g. Half full" value={quantity} onChange={e => setQuantity(e.target.value)} />
                            </div>
                            <div className="purchase-date">
                                <SmartDateField id="purchaseDate" label="Purchase Date" value={purchaseDate} onChange={setPurchaseDate} />
                            </div>
                        </div>
                        <div className="additem-storage-location">
                            <label htmlFor="stoageLocation">Storage Location (defualt prefilled)</label>
                            <input type="text" name="" id="stoageLocation" placeholder="E.g. Pantry, Frige, Freezer" value={storageLocation} onChange={e => setStorageLocation(e.target.value)} />
                        </div>
                    </div>
                    <button className="add-to-inventory-button">
                        Add to Inventory
                    </button>
                </form>
            </section>
            <aside className="additem-active-product">
                <h2 className="additem-subheader">PRODUCT</h2>
                <h1 className="additem-active-product-header">Active Product</h1>
                <ProductDisplay productId={activeProductId} />
            </aside>
        </main>
    )
}
export default InventoryAdd;