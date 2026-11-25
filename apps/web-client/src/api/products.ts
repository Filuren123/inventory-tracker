import axios, { isNotFound } from './axios';
import type { Product } from '../model/product.interface';

export async function getProductByEAN(ean: string): Promise<Product | null> {
    try {
        const res = await axios.get<Product>(`/product/ean/${encodeURIComponent(ean)}`);
        return res.data;
    } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
    }
}

/** Name / brand / EAN search, best matches first. */
export async function searchProducts(q: string, limit = 8, signal?: AbortSignal): Promise<Product[]> {
    const res = await axios.get<Product[]>('/product', { params: { q, limit }, signal });
    return res.data;
}

export async function getProductById(id: number): Promise<Product | null> {
    try {
        const res = await axios.get<Product>(`/product/${id}`);
        return res.data;
    } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
    }
}

export type ProductInput = Omit<Product, 'product_id'>;

export async function addProduct(product: ProductInput): Promise<Product> {
    const res = await axios.post<Product>('/product/add', product);
    return res.data;
}

export async function updateProduct(id: number, changes: Partial<ProductInput>): Promise<Product> {
    const res = await axios.put<Product>(`/product/item/${id}`, changes);
    return res.data;
}

export async function deleteProduct(id: number): Promise<void> {
    await axios.delete(`/product/${id}`);
}
