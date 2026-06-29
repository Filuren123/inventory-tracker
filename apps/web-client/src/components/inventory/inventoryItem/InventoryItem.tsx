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
            <div className="heading">
                <h2>{item.product.brand}</h2>
                <div className="ean">EAN: {item.product.ean_code}</div>
            </div>
            <div className="firstsec">
                <h1>{item.product.name}</h1>
                <div className="category">{item.product.category_id}</div>
            </div>
            <div className="secsec">
                <div className="bestbefore">
                    Best before: {item.expiry_date?.toString() || "N/A"}
                </div>
                <div>
                    <button type="button" className="btn btn-primary">Se product</button>
                    <button type="button" className="btn btn-danger">Remove</button>
                </div>
            </div>
        </article>
    )
}

export default InventoryItem;