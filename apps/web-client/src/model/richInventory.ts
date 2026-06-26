import type { Category } from "./category.interface";
import type { Inventory } from "./inventory.interface";
import type { Product } from "./product.interface";

export interface RichInventory extends Inventory {
    product: Product | null;
    category: Category | null;

}