import express, { type Request, type Response } from 'express';
import {
    StorageLocationService,
    StorageLocationValidationError,
    type StorageLocation,
    type StorageLocationUsage,
} from '../service/storageLocation.service.js';

export const storageLocationRouter = express.Router();

const service = new StorageLocationService();

const fail = (res: Response, error: any) =>
    error instanceof StorageLocationValidationError
        ? res.status(error.status).send({ message: error.message })
        : res.status(500).send({ message: error.message || 'Internal Server Error' });

/**
 * All storage locations, sorted by name.
 * `?usage=1` adds `items` and `products` counts for each.
 */
storageLocationRouter.get(
    '/',
    async (req: Request, res: Response<StorageLocation[] | StorageLocationUsage[] | string>) => {
        try {
            res.status(200).json(req.query.usage ? await service.getAllWithUsage() : await service.getAll());
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Create a storage location. Names are unique, case-insensitively.
 */
storageLocationRouter.post(
    '/add',
    async (req: Request<{}, {}, { name: string }>, res: Response<StorageLocation | { message: string }>) => {
        try {
            res.status(201).json(await service.create(req.body?.name));
        } catch (error: any) {
            fail(res, error);
        }
    },
);

/**
 * Delete a storage location. If items use it, `?moveTo=<id>` is required (409 otherwise)
 * and they move to that location; products' default location moves too (or is cleared).
 */
storageLocationRouter.delete(
    '/:id',
    async (req: Request<{ id: string }>, res: Response<{ message: string }>) => {
        try {
            const id = Number(req.params.id);
            const moveTo = req.query.moveTo != null && req.query.moveTo !== '' ? Number(req.query.moveTo) : undefined;
            if (!Number.isInteger(id) || (moveTo !== undefined && !Number.isInteger(moveTo))) {
                return res.status(400).send({ message: 'Invalid location id.' });
            }
            const deleted = await service.delete(id, moveTo);
            if (!deleted) return res.status(404).send({ message: 'Location not found' });
            res.status(200).send({ message: 'Location deleted.' });
        } catch (error: any) {
            fail(res, error);
        }
    },
);
