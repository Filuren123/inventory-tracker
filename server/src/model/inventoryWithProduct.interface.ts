import { Inventory } from "./inventory.interface";
import { Product } from "./product.interface";

export interface InventoryWithProduct extends Inventory {
    product: Product | null;
}