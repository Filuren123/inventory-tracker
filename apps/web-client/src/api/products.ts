import axios from "./axios";
import type { Product } from "../model/product.interface";

export async function getProducts(): Promise<Product[]> {
    try {
        const res = await axios.get(`/product`, {});
        return res.data;
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}

export async function getProductByEAN(ean: string): Promise<Product | null> {
    try {
        const res = await axios.get(`/product/ean/${ean}`);
        return res.data;
    } catch (err: any) {
        if (err.response?.status === 404) {
            return null;
        }
        throw new Error(err.response?.data ?? 'Failed to look up product');
    }
}

export async function addProduct(
    ean_code: string | null,
    name: string,
    brand: string | null,
    category_id: number | null,
    default_storage_location: string | null,
    minimum_quantity: number,
    package_size: number | null,
    unit: string | null,
    min_price: number | null,
    min_price_location: string | null,
    link: string | null,
): Promise<Product> {
    try {
        const res = await axios.post(`/product/add`, {
            ean_code,
            name,
            brand,
            category_id,
            default_storage_location,
            minimum_quantity,
            package_size,
            unit,
            min_price,
            min_price_location,
            link,
        });
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data);
        }
        throw new Error("Server unreachable");
    }
}

export async function updateProduct(
    id: string,
    ean_code?: string | null,
    name?: string,
    brand?: string | null,
    category_id?: number | null,
    default_storage_location?: string | null,
    minimum_quantity?: number,
    package_size?: number | null,
    unit?: string | null,
    min_price?: number | null,
    min_price_location?: string | null,
    link?: string | null,
): Promise<Product> {
    try {
        const res = await axios.put(`/product/item/${id}`, {
            ean_code,
            name,
            brand,
            category_id,
            default_storage_location,
            minimum_quantity,
            package_size,
            unit,
            min_price,
            min_price_location,
            link,
        });
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data);
        }
        throw new Error("Server unreachable");
    }
}

export async function deleteProduct(id: string): Promise<{ message: string }> {
    try {
        const res = await axios.delete(`/product/${id}`);
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data);
        }
        throw new Error("Server unreachable");
    }
}