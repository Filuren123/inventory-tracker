import type { Category } from "./category.interface.js";
import type { Inventory } from "./inventory.interface.js";
import type { Product } from "./product.interface.js";

export interface RichInventory extends Inventory {
    product: Product | null;
    category: Category | null;
}