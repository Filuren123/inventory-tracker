import { InventoryModel } from '../db/model/inventory.db';
import { Inventory } from '../model/inventory.interface';
import { Product } from '../model/product.interface';
import { RichInventory } from '../model/richInventory';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { Category } from '../model/category.interface';

export class InventoryService {
    productService: ProductService = new ProductService();
    categoryService: CategoryService = new CategoryService();

    private async convertToRichInventory(inventory: Inventory): Promise<RichInventory> {
        const product: Product | null = await this.productService.getProductById(inventory.product_id);
        let category: Category | null = null;
        if (product != null && product.category_id != null){
            category = await this.categoryService.getCategoryById(product.category_id);
        }
        const richInventory: RichInventory = {
            ...inventory,
            product: product,
            category: category
        }

        return richInventory;
    }

    private async convertToRichInventoryArray(inventory: Inventory[]): Promise<RichInventory[]> {
        const convertedList: RichInventory[] = await Promise.all(
            inventory.map(inv => this.convertToRichInventory(inv))
        );

        return convertedList;
    }
    
    /**
     * Fetch all inventory items
     */
    async getAllInventory(): Promise<RichInventory[]> {
        const instances: InventoryModel[] = await InventoryModel.findAll();
        const inventory: Inventory[] = instances.map(item => item.get({ plain: true }));

        return this.convertToRichInventoryArray(inventory);
    }

    /**
     * Fetch a specific inventory item by its primary key ID
     */
    async getInventoryById(id: string | number): Promise<RichInventory | null> {
        const instance: InventoryModel | null = await InventoryModel.findByPk(id);
        if (!instance) return null;
        const inventoryItem: Inventory = instance.get({ plain: true });
        return this.convertToRichInventory(inventoryItem);
    }

    /**
     * Create a brand new inventory entry
     */
    async createInventory(data: {
        product_id: number;
        storage_location: string;
        quantity?: string;
        expiry_date?: string;
        purchase_date?: string;
    }): Promise<RichInventory> {
        const newInventory: InventoryModel = await InventoryModel.create({
            product_id: data.product_id,
            storage_location: data.storage_location,
            quantity: data.quantity,
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
            purchase_date: data.purchase_date
                ? new Date(data.purchase_date)
                : null,
        });

        const newInventoryObj: Inventory = newInventory.get({ plain: true });
        return this.convertToRichInventory(newInventory);
    }

    /**
     * Update fields on an existing inventory item
     */
    async updateInventory(
        id: string | number,
        data: {
            product_id?: number;
            storage_location?: string;
            quantity?: string;
            expiry_date?: string | null;
            purchase_date?: string | null;
        },
    ): Promise<RichInventory | null> {
        const inventoryItem: InventoryModel | null = await InventoryModel.findByPk(id);
        if (!inventoryItem) return null;

        await inventoryItem.update({
            product_id: data.product_id ?? inventoryItem.product_id,
            storage_location:
                data.storage_location ?? inventoryItem.storage_location,
            quantity: data.quantity ?? inventoryItem.quantity,
            expiry_date:
                data.expiry_date !== undefined
                    ? data.expiry_date
                        ? new Date(data.expiry_date)
                        : null
                    : inventoryItem.expiry_date,
            purchase_date:
                data.purchase_date !== undefined
                    ? data.purchase_date
                        ? new Date(data.purchase_date)
                        : null
                    : inventoryItem.purchase_date,
        });

        const inventoryItemObj: Inventory = inventoryItem.get({ plain: true });
        return this.convertToRichInventory(inventoryItem);
    }

    /**
     * Delete an inventory record by ID
     */
    async deleteInventory(id: string | number): Promise<boolean> {
        const inventoryItem: InventoryModel | null = await InventoryModel.findByPk(id);
        if (!inventoryItem) return false;

        await inventoryItem.destroy();
        return true;
    }
}
