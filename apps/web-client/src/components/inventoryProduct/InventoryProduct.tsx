import "./InventoryProduct.css";
import { useEffect, useState } from "react";

import { getProducts } from "../../api/products";
import { getAllInventory } from "../../api/inventory";
import type { Product } from "../../model/product.interface";
import type { InventoryWithProduct } from "../../model/inventoryWithProduct.interface";

const InventoryProduct = () => {

    const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);

    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const data = await getAllInventory();
                setInventory(data);
            } catch (err: any) {
                console.error("Could not fetch products", err);
            }
        };

        fetchAllProducts();
    }, []);

    console.log("Fetched products:", inventory);

    return (
        <>
            {inventory.map((inv) => (
                <article key={inv.product.product_id}>
                    <div className="heading">
                        <h2>{inv.product.brand}</h2>
                        <div className="ean">EAN: {inv.product.ean_code}</div>
                    </div>
                    <div className="firstsec">
                        <h1>{inv.product.name}</h1>
                        <div className="category">{inv.product.category_id}</div>
                    </div>
                    <div className="secsec">
                        <div className="bestbefore">
                            Best before: {inv.expiry_date.toString()}
                        </div>
                        <div>
                            <button type="button" className="btn btn-primary">Se product</button>
                            <button type="button" className="btn btn-danger">Remove</button>
                        </div>
                    </div>
                </article>
            ))}
        </>
    )
}

export default InventoryProduct;