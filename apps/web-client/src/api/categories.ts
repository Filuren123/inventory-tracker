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
