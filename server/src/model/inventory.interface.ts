export interface Inventory {
    id: number;
    product_id: number;
    storage_location: string;
    expiry_date: Date | null;
    purchase_date: Date | null;
}
