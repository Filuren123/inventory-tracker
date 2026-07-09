import axios from "./axios";
import type { RichInventory } from "../model/richInventory";

export async function getAllInventory(): Promise<RichInventory[]> {
    try {
        const res = await axios.get(`/inventory`, {});
        return res.data;
    } catch (err: any) {
        throw new Error(err.response.data);
    }
}

export async function getInventoryById(id: string): Promise<RichInventory> {
    try {
        const res = await axios.get(`/inventory/${id}`);
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data);
        }
        throw new Error("Server unreachable");
    }
}

export async function addInventory(
    product_id: number,
    storage_location: string,
    quantity?: string,
    expiry_date?: string,
    purchase_date?: string,
): Promise<RichInventory> {
    try {
        const res = await axios.post(`/inventory/add`, {
            product_id,
            storage_location,
            quantity,
            expiry_date,
            purchase_date,
        });
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data.message || e.response.data);
        }
        throw new Error("Server unreachable");
    }
}

export async function updateInventory(
    id: string,
    product_id?: number,
    storage_location?: string,
    quantity?: string,
    expiry_date?: string | null,
    purchase_date?: string | null,
): Promise<RichInventory> {
    try {
        const res = await axios.put(`/inventory/item/${id}`, {
            product_id,
            storage_location,
            quantity,
            expiry_date,
            purchase_date,
        });
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data.message || e.response.data);
        }
        throw new Error("Server unreachable");
    }
}

export async function deleteInventory(id: string): Promise<{ message: string }> {
    try {
        const res = await axios.delete(`/inventory/${id}`);
        return res.data;
    } catch (e: any) {
        if (e.response) {
            throw new Error(e.response.data.message || e.response.data);
        }
        throw new Error("Server unreachable");
    }
}