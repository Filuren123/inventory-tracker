import type { Category } from "./category.interface.ts";
import type { Inventory } from "./inventory.interface.ts";
import type { Product } from "./product.interface.ts";

export interface RichInventory extends Inventory {
    product: Product | null;
    category: Category | null;
}