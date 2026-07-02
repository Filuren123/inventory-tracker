import axios from "axios";
import type { Product } from "../model/product.interface";

const baseURL: string = import.meta.env.VITE_API_URL;

export async function getProducts(): Promise<Product[]> {
    try {
        const res = await axios.get(`${baseURL}/product`, {});
        return res.data;
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}

export async function getProductByEAN(ean: string): Promise<Product[] | null> {
    try {
        const res = await axios.get(`${baseURL}/product/ean/${ean}`);
        return res.data;
    } catch (err: any) {
        throw new Error(err.respone.data);
    }
}