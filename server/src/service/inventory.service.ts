import { Op, literal, type Order, type WhereOptions } from 'sequelize';
import { InventoryModel } from '../db/model/inventory.db.js';
import { ProductModel } from '../db/model/product.db.js';
import { CategoryModel } from '../db/model/category.db.js';
import type { RichInventory } from '../model/richInventory.js';
import { CategoryService } from './category.service.js';
import { StorageLocationService, StorageLocationValidationError } from './storageLocation.service.js';
import { sequelize } from '../db/conn.js';

export type InventorySort = 'name' | 'expiry' | 'added';
export type SortDir = 'asc' | 'desc';

export interface InventoryQuery {
    q?: string;
    categoryId?: number;
    location?: string;
    productId?: number;
    sort?: InventorySort;
    dir?: SortDir;
    limit: number;
    offset: number;
}

export interface InventoryPage {
    items: RichInventory[];
    total: number;
    nextOffset: number | null;
}

const productInclude = (where?: WhereOptions) => ({
    model: ProductModel,
    as: 'product',
    required: true,
    ...(where ? { where } : {}),
    include: [{ model: CategoryModel, as: 'category', required: false }],
});

/** Escape LIKE wildcards so a search for "50%" matches literally. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

function toRich(instance: InventoryModel): RichInventory {
    const plain: any = instance.get({ plain: true });
    const { product, ...inventory } = plain;
    if (!product) return { ...inventory, product: null, category: null };
    const { category, ...productFields } = product;
    return { ...inventory, product: productFields, category: category ?? null };
}

export class InventoryService {
    categoryService = new CategoryService();
    locations = new StorageLocationService();

    /**
     * Search, filter, sort and paginate inventory items.
     * Search and filters run in the database, so they cover every item, not just loaded pages.
     */
    async queryInventory(query: InventoryQuery): Promise<InventoryPage> {
        const productWhere: Record<string | symbol, unknown> = {};

        if (query.q) {
            const like = `%${likeEscape(query.q)}%`;
            productWhere[Op.or] = [
                { name: { [Op.iLike]: like } },
                { brand: { [Op.iLike]: like } },
                { ean_code: { [Op.iLike]: like } },
            ];
        }

        if (query.categoryId != null) {
            const ids = await this.categoryService.getDescendantIds(query.categoryId);
            productWhere.category_id = { [Op.in]: [...ids] };
        }

        const where: WhereOptions = {};
        if (query.location) {
            (where as any).storage_location = query.location;
        }
        if (query.productId != null) {
            (where as any).product_id = query.productId;
        }

        const dir = query.dir === 'desc' ? 'DESC' : 'ASC';
        let order: Order;
        switch (query.sort) {
            case 'expiry':
                // Items without an expiry date always go last.
                order = [['expiry_date', `${dir} NULLS LAST`], ['id', 'ASC']];
                break;
            case 'added':
                order = [['createdAt', dir], ['id', dir]];
                break;
            default:
                // Swedish collation so Å/Ä/Ö sort after Z.
                order = [[literal('"product"."name" COLLATE "sv-SE-x-icu"'), dir], ['id', 'ASC']];
        }

        const { rows, count } = await InventoryModel.findAndCountAll({
            where,
            include: [productInclude(Reflect.ownKeys(productWhere).length ? productWhere : undefined)],
            order,
            limit: query.limit,
            offset: query.offset,
            distinct: true,
            subQuery: false,
        });

        const end = query.offset + rows.length;
        return {
            items: rows.map(toRich),
            total: count,
            nextOffset: end < count ? end : null,
        };
    }

    async getInventoryById(id: string | number): Promise<RichInventory | null> {
        const instance = await InventoryModel.findByPk(id, { include: [productInclude()] });
        return instance ? toRich(instance) : null;
    }

    /** Create `count` identical items (e.g. three of the same product and expiry) in one transaction. */
    async createInventory(
        data: {
            product_id: number;
            storage_location: string;
            quantity?: string;
            expiry_date?: string;
            purchase_date?: string;
        },
        count = 1,
    ): Promise<RichInventory[]> {
        if (!(await ProductModel.findByPk(data.product_id))) {
            throw new StorageLocationValidationError('Product does not exist.');
        }
        const values = {
            product_id: data.product_id,
            storage_location: (await this.locations.resolve(data.storage_location))!,
            quantity: data.quantity,
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
            purchase_date: data.purchase_date ? new Date(data.purchase_date) : null,
        };
        const created = await sequelize.transaction((transaction) =>
            InventoryModel.bulkCreate(Array.from({ length: count }, () => ({ ...values })), {
                transaction,
                returning: true,
            }),
        );
        const rows = await InventoryModel.findAll({
            where: { id: created.map((c) => c.id) },
            include: [productInclude()],
            order: [['id', 'ASC']],
        });
        return rows.map(toRich);
    }

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
        const item = await InventoryModel.findByPk(id);
        if (!item) return null;
        const toDate = (v: string | null | undefined, current: Date | null) =>
            v === undefined ? current : v ? new Date(v) : null;
        await item.update({
            product_id: data.product_id ?? item.product_id,
            storage_location:
                data.storage_location !== undefined
                    ? (await this.locations.resolve(data.storage_location))!
                    : item.storage_location,
            quantity: data.quantity ?? item.quantity,
            expiry_date: toDate(data.expiry_date, item.expiry_date),
            purchase_date: toDate(data.purchase_date, item.purchase_date),
        });
        return this.getInventoryById(item.id);
    }

    async deleteInventory(id: string | number): Promise<boolean> {
        const item = await InventoryModel.findByPk(id);
        if (!item) return false;
        await item.destroy();
        return true;
    }
}
