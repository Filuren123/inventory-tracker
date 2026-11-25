import { literal, Op } from 'sequelize';
import { ProductModel } from '../db/model/product.db.js';
import { CategoryModel } from '../db/model/category.db.js';
import type { Product } from '../model/product.interface.js';
import { StorageLocationService } from './storageLocation.service.js';

/** Bad input from the client; routers map it to 400 (or `status`). */
export class ProductValidationError extends Error {
    constructor(message: string, readonly status = 400) {
        super(message);
    }
}

export interface ProductInput {
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
}

const plain = (p: ProductModel): Product => p.get({ plain: true }) as Product;

const text = (v: unknown, max: number, field: string): string | null => {
    if (v == null) return null;
    if (typeof v !== 'string') throw new ProductValidationError(`${field} must be text.`);
    const t = v.trim();
    if (t.length > max) throw new ProductValidationError(`${field} is too long (max ${max}).`);
    return t || null;
};

const num = (v: unknown, field: string): number | null => {
    if (v == null || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new ProductValidationError(`${field} must be a positive number.`);
    return n;
};

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export class ProductService {
    locations = new StorageLocationService();

    async getAllProducts(): Promise<Product[]> {
        return (await ProductModel.findAll()).map(plain);
    }

    /** Name / brand / EAN search, best matches (name starts with the term) first. */
    async searchProducts(q: string, limit: number): Promise<Product[]> {
        const like = `%${likeEscape(q)}%`;
        const prefix = `${likeEscape(q)}%`;
        const rows = await ProductModel.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: like } },
                    { brand: { [Op.iLike]: like } },
                    { ean_code: { [Op.iLike]: like } },
                ],
            },
            order: [
                [literal(`CASE WHEN "name" ILIKE ${ProductModel.sequelize!.escape(prefix)} THEN 0 ELSE 1 END`), 'ASC'],
                [literal('"name" COLLATE "sv-SE-x-icu"'), 'ASC'],
            ],
            limit,
        });
        return rows.map(plain);
    }

    async getProductById(id: string | number): Promise<Product | null> {
        const p = await ProductModel.findByPk(id);
        return p ? plain(p) : null;
    }

    async getProductByEAN(ean: string): Promise<Product | null> {
        const p = await ProductModel.findOne({ where: { ean_code: ean.trim() } });
        return p ? plain(p) : null;
    }

    /** Validate and normalise only the fields present in `data`. */
    private async clean(data: ProductInput, currentId?: number): Promise<Partial<Product>> {
        const out: Partial<Product> = {};

        if ('ean_code' in data) {
            const ean = text(data.ean_code, 20, 'EAN code');
            if (ean && !/^\d{6,14}$/.test(ean)) {
                throw new ProductValidationError('EAN code must be 6–14 digits.');
            }
            if (ean) {
                const clash = await ProductModel.findOne({ where: { ean_code: ean } });
                if (clash && clash.product_id !== currentId) {
                    throw new ProductValidationError(`EAN ${ean} already belongs to "${clash.name}".`, 409);
                }
            }
            out.ean_code = ean; // empty -> NULL, so many products can lack an EAN
        }
        if ('name' in data) {
            const name = text(data.name, 255, 'Name');
            if (!name) throw new ProductValidationError('Product name is required.');
            out.name = name;
        }
        if ('brand' in data) out.brand = text(data.brand, 255, 'Brand');
        if ('category_id' in data) {
            const id = data.category_id == null ? null : Number(data.category_id);
            if (id != null && !(await CategoryModel.findByPk(id))) {
                throw new ProductValidationError('Category does not exist.');
            }
            out.category_id = id;
        }
        if ('default_storage_location' in data) {
            try {
                out.default_storage_location = await this.locations.resolve(data.default_storage_location, true);
            } catch (e: any) {
                throw new ProductValidationError(e.message);
            }
        }
        if ('minimum_quantity' in data) {
            const n = num(data.minimum_quantity, 'Minimum quantity') ?? 1;
            if (!Number.isInteger(n)) throw new ProductValidationError('Minimum quantity must be a whole number.');
            out.minimum_quantity = n;
        }
        if ('package_size' in data) out.package_size = num(data.package_size, 'Package size');
        if ('unit' in data) out.unit = text(data.unit, 50, 'Unit');
        if ('min_price' in data) out.min_price = num(data.min_price, 'Price');
        if ('min_price_location' in data) out.min_price_location = text(data.min_price_location, 255, 'Price location');
        if ('link' in data) {
            const link = text(data.link, 500, 'Link');
            if (link && !/^https?:\/\//i.test(link)) throw new ProductValidationError('Link must start with http:// or https://');
            out.link = link;
        }
        return out;
    }

    async createProduct(data: ProductInput): Promise<Product> {
        const values = await this.clean({ ...data, name: data.name ?? '' });
        const created = await ProductModel.create({
            minimum_quantity: 1,
            ...values,
            name: values.name!,
        });
        return plain(created);
    }

    async updateProduct(id: string | number, data: ProductInput): Promise<Product | null> {
        const product = await ProductModel.findByPk(id);
        if (!product) return null;
        // Treat `undefined` as "not sent" (JSON drops them anyway).
        const sent = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as ProductInput;
        await product.update(await this.clean(sent, product.product_id));
        return plain(product);
    }

    async deleteProduct(id: string | number): Promise<boolean> {
        const product = await ProductModel.findByPk(id);
        if (!product) return false;
        await product.destroy();
        return true;
    }
}
