import type { Inventory } from "./inventory.interface";
import type { Product } from "./product.interface";

export interface InventoryWithProduct extends Inventory {
    product: Product;
}