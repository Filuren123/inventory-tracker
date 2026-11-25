import express, { type Request, type Response } from 'express';
import {
    InventoryService,
    type InventoryPage,
    type InventorySort,
} from '../service/inventory.service.js';
import type { RichInventory } from '../model/richInventory.js';
import { StorageLocationValidationError } from '../service/storageLocation.service.js';

const fail = (res: Response, error: any) =>
    error instanceof StorageLocationValidationError
        ? res.status(error.status).send({ message: error.message })
        : res.status(500).send({ message: error.message || 'Internal Server Error' });

export const inventoryRouter = express.Router();

const inventoryService = new InventoryService();

const SORTS: InventorySort[] = ['name', 'expiry', 'added'];
const MAX_LIMIT = 100;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const int = (v: unknown) => {
    const n = Number(v);
    return typeof v === 'string' && v !== '' && Number.isInteger(n) ? n : undefined;
};

/**
 * Search, filter, sort and paginate inventory.
 * Query: q, category (includes subcategories), location, product, sort=name|expiry|added,
 * dir=asc|desc, limit (1-100, default 30), offset.
 */
inventoryRouter.get('/', async (req: Request, res: Response<InventoryPage | string>) => {
    try {
        const sort = str(req.query.sort) as InventorySort | undefined;
        const page = await inventoryService.queryInventory({
            q: str(req.query.q),
            categoryId: int(req.query.category),
            location: str(req.query.location),
            productId: int(req.query.product),
            sort: sort && SORTS.includes(sort) ? sort : 'name',
            dir: req.query.dir === 'desc' ? 'desc' : 'asc',
            limit: Math.min(Math.max(int(req.query.limit) ?? 30, 1), MAX_LIMIT),
            offset: Math.max(int(req.query.offset) ?? 0, 0),
        });
        res.status(200).json(page);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

/**
 * Get a specific inventory item by ID
 */
inventoryRouter.get(
    '/:id',
    async (req: Request<{ id: string }>, res: Response<RichInventory | string>) => {
        try {
            const item = await inventoryService.getInventoryById(req.params.id);
            if (!item) return res.status(404).send();
            res.status(200).json(item);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

const MAX_COUNT = 50;

/**
 * Create inventory items. `count` (1-50, default 1) adds that many identical items,
 * e.g. three of the same product with the same expiry. Always returns an array.
 */
inventoryRouter.post(
    '/add',
    async (
        req: Request<
            {},
            {},
            {
                product_id: number;
                storage_location: string;
                quantity?: string;
                expiry_date?: string;
                purchase_date?: string;
                count?: number;
            }
        >,
        res: Response<RichInventory[] | { message: string }>,
    ) => {
        try {
            const { product_id, storage_location, quantity, expiry_date, purchase_date } = req.body;
            if (!product_id || !storage_location) {
                return res
                    .status(400)
                    .send({ message: 'product_id and storage_location are required.' });
            }
            const count = req.body.count == null ? 1 : Number(req.body.count);
            if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
                return res.status(400).send({ message: `count must be a whole number from 1 to ${MAX_COUNT}.` });
            }
            const created = await inventoryService.createInventory(
                { product_id, storage_location, quantity, expiry_date, purchase_date },
                count,
            );
            res.status(201).json(created);
        } catch (error: any) {
            fail(res, error);
        }
    },
);

/**
 * Update an existing inventory item by ID
 */
inventoryRouter.put(
    '/item/:id',
    async (
        req: Request<
            { id: string },
            {},
            {
                product_id?: number;
                storage_location?: string;
                quantity?: string;
                expiry_date?: string | null;
                purchase_date?: string | null;
            }
        >,
        res: Response<RichInventory | { message: string }>,
    ) => {
        try {
            const { product_id, storage_location, quantity, expiry_date, purchase_date } = req.body;
            const updated = await inventoryService.updateInventory(req.params.id, {
                product_id,
                storage_location,
                quantity,
                expiry_date,
                purchase_date,
            });
            if (!updated) return res.status(404).send({ message: 'Inventory item not found' });
            res.status(200).json(updated);
        } catch (error: any) {
            fail(res, error);
        }
    },
);

/**
 * Delete an inventory item by ID
 */
inventoryRouter.delete(
    '/:id',
    async (req: Request<{ id: string }>, res: Response<{ message: string }>) => {
        try {
            const deleted = await inventoryService.deleteInventory(req.params.id);
            if (!deleted) return res.status(404).send({ message: 'Inventory item not found' });
            res.status(200).send({ message: `Inventory item ${req.params.id} successfully deleted.` });
        } catch (error: any) {
            fail(res, error);
        }
    },
);
