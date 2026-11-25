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

export type ProductWithStock = Product & { in_stock: number };

export interface ProductPage {
    items: ProductWithStock[];
    total: number;
    nextOffset: number | null;
}

/** Paged list for the products page; search and category filter run on the server. */
export async function queryProducts(
    query: { q?: string; category?: number | null; limit?: number; offset?: number },
    signal?: AbortSignal,
): Promise<ProductPage> {
    const params: Record<string, string | number> = {};
    if (query.q) params.q = query.q;
    if (query.category != null) params.category = query.category;
    if (query.limit != null) params.limit = query.limit;
    if (query.offset != null) params.offset = query.offset;
    const res = await axios.get<ProductPage>('/product/list', { params, signal });
    return res.data;
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
