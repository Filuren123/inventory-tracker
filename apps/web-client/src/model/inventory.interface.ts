export interface Inventory {
    id: number;
    product_id: number;
    storage_location: string;
    quantity: string | null;
    /** YYYY-MM-DD */
    expiry_date: string | null;
    /** YYYY-MM-DD */
    purchase_date: string | null;
    createdAt?: string;
}
