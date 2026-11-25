import axios from './axios';

export interface StorageLocation {
    id: number;
    name: string;
}

export interface StorageLocationUsage extends StorageLocation {
    /** Inventory items stored here */
    items: number;
    /** Products with this as their default location */
    products: number;
}

export async function getLocations(): Promise<StorageLocation[]> {
    const res = await axios.get<StorageLocation[]>('/locations');
    return res.data;
}

export async function getLocationsWithUsage(): Promise<StorageLocationUsage[]> {
    const res = await axios.get<StorageLocationUsage[]>('/locations', { params: { usage: 1 } });
    return res.data;
}

export async function addLocation(name: string): Promise<StorageLocation> {
    const res = await axios.post<StorageLocation>('/locations/add', { name });
    return res.data;
}

/** Items stored at the location move to `moveToId` (required when it's in use). */
export async function deleteLocation(id: number, moveToId?: number): Promise<void> {
    await axios.delete(`/locations/${id}`, { params: moveToId != null ? { moveTo: moveToId } : {} });
}
