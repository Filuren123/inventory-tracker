export interface Transaction {
    id: number;
    user_id: number;
    product_id: number;
    action: 'scan_in' | 'scan_out';
    scanned_at: Date;
    note: string | null;
}
