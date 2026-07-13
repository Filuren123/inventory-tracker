import express, { type Request, type Response } from 'express';
import { InventoryService } from '../service/inventory.service.js';
import type { Inventory } from '../model/inventory.interface.js';
import type { RichInventory } from '../model/richInventory.js';

export const inventoryRouter = express.Router();
const inventoryService = new InventoryService();

/**
 * Get all inventory items
 */
inventoryRouter.get(
    '/',
    async (req: Request<{}, {}, {}>, res: Response<RichInventory[]>) => {
        try {
            const inventory = await inventoryService.getAllInventory();
            res.status(200).json(inventory);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Get a specific inventory item by ID
 */
inventoryRouter.get(
    '/:id',
    async (req: Request<{ id: string }, {}, {}>, res: Response<RichInventory>) => {
        try {
            const inventoryItem = await inventoryService.getInventoryById(
                req.params.id,
            );

            if (!inventoryItem) {
                return res.status(404).send();
            }
            res.status(200).json(inventoryItem);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Create a new inventory item
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
            }
        >,
        res: Response<RichInventory | { message: string }>,
    ) => {
        try {
            const {
                product_id,
                storage_location,
                quantity,
                expiry_date,
                purchase_date,
            } = req.body;

            // Basic validation
            if (!product_id || !storage_location) {
                return res
                    .status(400)
                    .send({
                        message:
                            'product_id and storage_location are required.',
                    });
            }

            const newInventory = await inventoryService.createInventory({
                product_id,
                storage_location,
                quantity,
                expiry_date,
                purchase_date,
            });

            res.status(201).json(newInventory);
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
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
            const {
                product_id,
                storage_location,
                quantity,
                expiry_date,
                purchase_date,
            } = req.body;

            const updatedInventory = await inventoryService.updateInventory(
                req.params.id,
                {
                    product_id,
                    storage_location,
                    quantity,
                    expiry_date,
                    purchase_date,
                },
            );

            if (!updatedInventory) {
                return res
                    .status(404)
                    .send({ message: 'Inventory item not found' });
            }

            res.status(200).json(updatedInventory);
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);

/**
 * Delete an inventory item by ID
 */
inventoryRouter.delete(
    '/:id',
    async (
        req: Request<{ id: string }, {}, {}>,
        res: Response<{ message: string }>,
    ) => {
        try {
            const isDeleted = await inventoryService.deleteInventory(
                req.params.id,
            );

            if (!isDeleted) {
                return res
                    .status(404)
                    .send({ message: 'Inventory item not found' });
            }

            res.status(200).send({
                message: `Inventory item ${req.params.id} successfully deleted.`,
            });
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);
