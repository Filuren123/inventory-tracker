import axios from "axios";
import type { Category } from "../model/category.interface";

const baseURL: string = import.meta.env.VITE_API_URL;

export async function getAllCategories(): Promise<Category[]> {
    try {
        const res = await axios.get(`${baseURL}/categories`, {});
        return res.data;
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}

export async function addCategory(name: string, parent_id?: number): Promise<Category> {
    try {
        const res = await axios.post(`${baseURL}/categories/add`, {name, parent_id});
        return res.data;
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}

export async function removeCategory(categoryId: number): Promise<void> {
    try {
        await axios.delete(`${baseURL}/categories/${categoryId}`);
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}