import "./InventoryItem.css";
import type { RichInventory } from "../../../model/richInventory";

interface Props {
    item: RichInventory;
}

const InventoryItem = ({item}: Props) => {
    if (item.product == null) {
        return (
            <article>
                Product missing for inventory item with ID: {item.id}
            </article>
        )
    }

    return (
        <article>
            <div className="product-properties">
                <div>
                    <img src="/icons/shopping-bag.svg" alt="Product brand" />
                    <div>{item.product.brand}</div>
                </div>
                <div>
                    <img src="/icons/danger-symbol.svg" alt="Expiration date" />
                    <div>{item.expiry_date?.toString() || "N/A"}</div>
                </div>
                <div>
                    <img src="/icons/box.svg" alt="Storage location" />
                    <div>{item.storage_location}</div>
                </div>
                <div>
                    <img src="/icons/scale.svg" alt="Ammout" />
                    <div>{item.product.package_size || "N/A"}</div>
                </div>
                <div>
                    <img src="/icons/barcode.svg" alt="EAN code" />
                    <div>{item.product.ean_code}</div>
                </div>
            </div>
            <div className="middle">
                <div className="product-name">
                    {item.product.name}
                </div>
                <div className="category">
                    <div>{item.category?.name || "No cateogory"}</div>
                </div>
                <div className="tags">

                </div>
            </div>
            <div>
                <button>See product</button>
                <button>Remove product</button>
            </div>
        </article>
    )
}

export default InventoryItem;