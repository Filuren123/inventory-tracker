import { InventoryModel } from '../db/model/inventory.db';
import { Inventory } from '../model/inventory.interface';
import { Product } from '../model/product.interface';
import { InventoryWithProduct } from '../model/InventoryWithProduct.interface';
import { ProductService } from './product.service';

export class InventoryService {
    productService: ProductService = new ProductService();

    private async convertToInventoryWithProduct(inventory: Inventory): Promise<InventoryWithProduct> {
        const product: Product | null = await this.productService.getProductById(inventory.product_id);
        const inventoryWithProduct: InventoryWithProduct = {
            ...inventory,
            product: product
        }

        return inventoryWithProduct;
    }

    private async convertToInventoryWithProductArray(inventory: Inventory[]): Promise<InventoryWithProduct[]> {
        const convertedList: InventoryWithProduct[] = await Promise.all(
            inventory.map(inv => this.convertToInventoryWithProduct(inv))
        );

        return convertedList;
    }
    
    /**
     * Fetch all inventory items
     */
    async getAllInventory(): Promise<InventoryWithProduct[]> {
        // Cast to unknown then to Inventory[] to seamlessly align the Sequelize Model array with your Interface array
        const inventory = await InventoryModel.findAll() as Inventory[];

        return this.convertToInventoryWithProductArray(inventory);
    }

    /**
     * Fetch a specific inventory item by its primary key ID
     */
    async getInventoryById(id: string | number): Promise<InventoryWithProduct | null> {
        const inventoryItem = await InventoryModel.findByPk(id);
        if (!inventoryItem) return null;
        return this.convertToInventoryWithProduct(inventoryItem);
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
    }): Promise<InventoryWithProduct> {
        const newInventory = await InventoryModel.create({
            product_id: data.product_id,
            storage_location: data.storage_location,
            quantity: data.quantity,
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
            purchase_date: data.purchase_date
                ? new Date(data.purchase_date)
                : null,
        });

        return this.convertToInventoryWithProduct(newInventory);
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
    ): Promise<InventoryWithProduct | null> {
        const inventoryItem = await InventoryModel.findByPk(id);
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

        return this.convertToInventoryWithProduct(inventoryItem);
    }

    /**
     * Delete an inventory record by ID
     */
    async deleteInventory(id: string | number): Promise<boolean> {
        const inventoryItem = await InventoryModel.findByPk(id);
        if (!inventoryItem) return false;

        await inventoryItem.destroy();
        return true;
    }
}
