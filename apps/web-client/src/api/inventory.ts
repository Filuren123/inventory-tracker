import axios from "axios";
import type { InventoryWithProduct } from "../model/inventoryWithProduct.interface";

const baseURL: string = import.meta.env.VITE_API_URL;

export async function getAllInventory(): Promise<InventoryWithProduct[]> {
    try {
        const res = await axios.get(`${baseURL}/inventory`, {});
        return res.data;
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}
