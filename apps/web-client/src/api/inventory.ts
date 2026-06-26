import axios from "axios";
import type { RichInventory } from "../model/richInventory";

const baseURL: string = import.meta.env.VITE_API_URL;

export async function getAllInventory(): Promise<RichInventory[]> {
    try {
        const res = await axios.get(`${baseURL}/inventory`, {});
        return res.data;
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}
