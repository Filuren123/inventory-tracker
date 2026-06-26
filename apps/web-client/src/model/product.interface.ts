export interface Product {
    product_id: number;
    ean_code: string | null;
    name: string;
    brand: string | null;
    category_id: number | null;
    default_storage_location: string | null;
    minimum_quantity: number;
    package_size: number | null;
    unit: string | null;
    min_price: number | null;
    min_price_location: string | null;
    link: string | null;
}
