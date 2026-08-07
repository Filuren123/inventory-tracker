import { useEffect, useState } from "react";
import { type Product } from "../../../model/product.interface";
import { getProductById } from "../../../api/products";
import type { Category } from "../../../model/category.interface";
import { getCategoryById } from "../../../api/categories";

const ProductDisplay = ({productId}: {productId: number | null}) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [productCategory, setProductCategory] = useState<Category | null>(null);

    // Get product data from API
    const fetchAll = async () => {
        if (productId == null) {
            setProduct({} as Product)
            setProductCategory(null);
            return;
        }
        try {
            const productFetch: Product | null = await getProductById(productId);
            setProduct(productFetch);

            if (productFetch?.category_id != null) {
                const categoryFetch: Category | null = await getCategoryById(productFetch.category_id);
                setProductCategory(categoryFetch);
            } else {
                setProductCategory(null);
            }
        } catch (err: any) {
            setProduct({} as Product)
            console.error("Could not fetch data", err);
        }
    }
    useEffect(() => {
        fetchAll();
    }, [productId]);
    
    if (product?.product_id == null) {
        return (
            <article>
                <h4>Enter EAN Code or Name to find product...</h4>
            </article>
        )
    }
    
    return (
        <>
            <article>
                <div>
                    <img src="/img/placeholder.png" alt="Product image" />
                </div>
                <ul>
                    <li>Product ID: {product?.product_id}</li>
                    <li>EAN Code: {product?.ean_code}</li>
                    <li>Name: {product?.name}</li>
                    <li>Brand: {product?.brand}</li>
                    <li>Category: {productCategory?.name ?? "Uncategorised"}</li>
                    <li>Defualt Storage Location: {product?.default_storage_location}</li>
                    <li>Minimum Quantity: {product?.minimum_quantity}</li>
                    <li>Package Size: {product?.package_size}</li>
                    <li>Minimum Price: {product?.min_price}</li>
                    <li>Minimum Price Location: {product?.min_price_location}</li>
                </ul>
            </article> 
        </>
    )
}
export default ProductDisplay;