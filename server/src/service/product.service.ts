import { ProductModel } from '../db/model/product.db';
import { Product } from '../model/product.interface';

export class ProductService {
    /**
     * Fetch all products
     */
    async getAllProducts(): Promise<Product[]> {
        const products = await ProductModel.findAll();
        return products as unknown as Product[];
    }

    /**
     * Fetch a specific product by its primary key ID
     */
    async getProductById(id: string | number): Promise<Product | null> {
        const productItem = await ProductModel.findByPk(id);
        if (!productItem) return null;
        return productItem as unknown as Product;
    }

    /**
     * Create a brand new product entry
     */
    async createProduct(data: {
        ean_code?: string | null;
        name: string;
        brand?: string | null;
        category_id?: number | null;
        default_storage_location?: string | null;
        minimum_quantity?: number;
        package_size?: number | null;
        unit?: string | null;
        min_price?: number | null;
        min_price_location?: string | null;
        link?: string | null;
    }): Promise<Product> {
        const newProduct = await ProductModel.create({
            ean_code: data.ean_code,
            name: data.name,
            brand: data.brand,
            category_id: data.category_id,
            default_storage_location: data.default_storage_location,
            minimum_quantity: data.minimum_quantity ?? 1,
            package_size: data.package_size,
            unit: data.unit,
            min_price: data.min_price,
            min_price_location: data.min_price_location,
            link: data.link,
        });

        return newProduct as unknown as Product;
    }

    /**
     * Update fields on an existing product item
     */
    async updateProduct(
        id: string | number,
        data: {
            ean_code?: string | null;
            name?: string;
            brand?: string | null;
            category_id?: number | null;
            default_storage_location?: string | null;
            minimum_quantity?: number;
            package_size?: number | null;
            unit?: string | null;
            min_price?: number | null;
            min_price_location?: string | null;
            link?: string | null;
        },
    ): Promise<Product | null> {
        const productItem = await ProductModel.findByPk(id);
        if (!productItem) return null;

        await productItem.update({
            ean_code:
                data.ean_code !== undefined
                    ? data.ean_code
                    : productItem.ean_code,
            name: data.name ?? productItem.name,
            brand: data.brand !== undefined ? data.brand : productItem.brand,
            category_id:
                data.category_id !== undefined
                    ? data.category_id
                    : productItem.category_id,
            default_storage_location:
                data.default_storage_location !== undefined
                    ? data.default_storage_location
                    : productItem.default_storage_location,
            minimum_quantity:
                data.minimum_quantity ?? productItem.minimum_quantity,
            package_size:
                data.package_size !== undefined
                    ? data.package_size
                    : productItem.package_size,
            unit: data.unit !== undefined ? data.unit : productItem.unit,
            min_price:
                data.min_price !== undefined
                    ? data.min_price
                    : productItem.min_price,
            min_price_location:
                data.min_price_location !== undefined
                    ? data.min_price_location
                    : productItem.min_price_location,
            link: data.link !== undefined ? data.link : productItem.link,
        });

        return productItem as unknown as Product;
    }

    /**
     * Delete a product record by ID
     */
    async deleteProduct(id: string | number): Promise<boolean> {
        const productItem = await ProductModel.findByPk(id);
        if (!productItem) return false;

        await productItem.destroy();
        return true;
    }
}
