import axios, { isNotFound } from './axios';
import type { Category } from '../model/category.interface';

export async function getAllCategories(): Promise<Category[]> {
    const res = await axios.get<Category[]>('/categories');
    return res.data;
}

export async function getCategoryById(id: number): Promise<Category | null> {
    try {
        const res = await axios.get<Category>(`/categories/${id}`);
        return res.data;
    } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
    }
}

export async function addCategory(name: string, parentId: number | null): Promise<Category> {
    const res = await axios.post<Category>('/categories/add', { name, parent_id: parentId });
    return res.data;
}

export async function updateCategory(
    id: number,
    changes: { name?: string; parent_id?: number | null },
): Promise<Category> {
    const res = await axios.put<Category>(`/categories/item/${id}`, changes);
    return res.data;
}

/** Subcategories and products of the removed category move to its parent. */
export async function removeCategory(id: number): Promise<void> {
    await axios.delete(`/categories/${id}`);
}
