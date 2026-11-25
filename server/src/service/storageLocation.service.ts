import { col, fn, literal, Op } from 'sequelize';
import { StorageLocationModel } from '../db/model/storageLocation.db.js';
import { InventoryModel } from '../db/model/inventory.db.js';
import { ProductModel } from '../db/model/product.db.js';
import { sequelize } from '../db/conn.js';

export interface StorageLocation {
    id: number;
    name: string;
}

export interface StorageLocationUsage extends StorageLocation {
    /** Inventory items stored here */
    items: number;
    /** Products with this as their default location */
    products: number;
}

/** Bad request; routers map it to `status` (400 by default). */
export class StorageLocationValidationError extends Error {
    constructor(message: string, readonly status = 400) {
        super(message);
    }
}

/** Exact, case-insensitive match (LIKE wildcards escaped). */
const sameName = (name: string) => ({ [Op.iLike]: name.trim().replace(/[\\%_]/g, (m) => `\\${m}`) });

export class StorageLocationService {
    async getAll(): Promise<StorageLocation[]> {
        const rows = await StorageLocationModel.findAll({
            attributes: ['id', 'name'],
            order: [[literal('"name" COLLATE "sv-SE-x-icu"'), 'ASC']],
            raw: true,
        });
        return rows as StorageLocation[];
    }

    /** All locations with how many items and products use each. */
    async getAllWithUsage(): Promise<StorageLocationUsage[]> {
        const [locations, inv, prod] = await Promise.all([
            this.getAll(),
            InventoryModel.findAll({
                attributes: [[fn('LOWER', col('storage_location')), 'key'], [fn('COUNT', col('id')), 'n']],
                group: [fn('LOWER', col('storage_location'))],
                raw: true,
            }),
            ProductModel.findAll({
                attributes: [[fn('LOWER', col('default_storage_location')), 'key'], [fn('COUNT', col('product_id')), 'n']],
                where: { default_storage_location: { [Op.ne]: null } },
                group: [fn('LOWER', col('default_storage_location'))],
                raw: true,
            }),
        ]);
        const toMap = (rows: unknown[]) =>
            new Map((rows as { key: string; n: string }[]).map((r) => [r.key, Number(r.n)]));
        const items = toMap(inv);
        const products = toMap(prod);
        return locations.map((l) => ({
            ...l,
            items: items.get(l.name.toLowerCase()) ?? 0,
            products: products.get(l.name.toLowerCase()) ?? 0,
        }));
    }

    /**
     * Delete a location. If inventory items use it, `moveToId` is required and
     * those items move there. Products using it as default move there too, or
     * get no default if there is no target.
     */
    async delete(id: number, moveToId?: number): Promise<boolean> {
        return sequelize.transaction(async (transaction) => {
            const location = await StorageLocationModel.findByPk(id, { transaction });
            if (!location) return false;

            let target: StorageLocationModel | null = null;
            if (moveToId != null) {
                if (moveToId === id) {
                    throw new StorageLocationValidationError('Choose a different location to move items to.');
                }
                target = await StorageLocationModel.findByPk(moveToId, { transaction });
                if (!target) throw new StorageLocationValidationError('The location to move items to does not exist.');
            }

            const itemCount = await InventoryModel.count({
                where: { storage_location: sameName(location.name) },
                transaction,
            });
            if (itemCount > 0 && !target) {
                throw new StorageLocationValidationError(
                    `"${location.name}" is used by ${itemCount} item(s). Choose where to move them.`,
                    409,
                );
            }

            if (target) {
                await InventoryModel.update(
                    { storage_location: target.name },
                    { where: { storage_location: sameName(location.name) }, transaction },
                );
            }
            await ProductModel.update(
                { default_storage_location: target ? target.name : null },
                { where: { default_storage_location: sameName(location.name) }, transaction },
            );
            await location.destroy({ transaction });
            return true;
        });
    }

    /** Case-insensitive lookup, returning the canonical stored name. */
    async findByName(name: string): Promise<StorageLocation | null> {
        const row = await StorageLocationModel.findOne({
            where: { name: sameName(name) },
            raw: true,
        });
        return (row as StorageLocation | null) ?? null;
    }

    async create(rawName: string): Promise<StorageLocation> {
        const name = rawName?.trim();
        if (!name) throw new StorageLocationValidationError('Location name is required.');
        if (name.length > 100) throw new StorageLocationValidationError('Location name is too long.');
        const existing = await this.findByName(name);
        if (existing) throw new StorageLocationValidationError(`"${existing.name}" already exists.`);
        const created = await StorageLocationModel.create({ name });
        return { id: created.id, name: created.name };
    }

    /**
     * Throws unless `name` is a known location; returns its canonical spelling.
     * `null`/empty is allowed only when `optional`.
     */
    async resolve(name: string | null | undefined, optional = false): Promise<string | null> {
        if (name == null || name.trim() === '') {
            if (optional) return null;
            throw new StorageLocationValidationError('Storage location is required.');
        }
        const found = await this.findByName(name);
        if (!found) throw new StorageLocationValidationError(`Unknown storage location "${name}".`);
        return found.name;
    }

    /**
     * One-time style backfill: make sure every location already used by inventory
     * or products exists in the table. Safe to run on every start.
     */
    async backfillFromExistingData(): Promise<number> {
        const [inv, prod] = await Promise.all([
            InventoryModel.findAll({
                attributes: [[fn('DISTINCT', col('storage_location')), 'name']],
                raw: true,
            }),
            ProductModel.findAll({
                attributes: [[fn('DISTINCT', col('default_storage_location')), 'name']],
                raw: true,
            }),
        ]);
        const names = new Map<string, string>();
        for (const r of [...inv, ...prod] as unknown as { name: string | null }[]) {
            const n = r.name?.trim();
            if (n && !names.has(n.toLowerCase())) names.set(n.toLowerCase(), n);
        }
        let added = 0;
        for (const n of names.values()) {
            if (!(await this.findByName(n))) {
                await StorageLocationModel.create({ name: n });
                added++;
            }
        }
        return added;
    }
}
