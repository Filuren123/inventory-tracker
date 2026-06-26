import { Category } from "./category.interface";
import { Inventory } from "./inventory.interface";
import { Product } from "./product.interface";

export interface RichInventory extends Inventory {
    product: Product | null;
    category: Category | null;
}