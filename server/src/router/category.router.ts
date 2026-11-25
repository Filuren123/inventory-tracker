import express, { type Request, type Response } from 'express';
import { CategoryService, CategoryValidationError } from '../service/category.service.js';
import type { Category } from '../model/category.interface.js';

export const categoryRouter = express.Router();

const categoryService = new CategoryService();

const fail = (res: Response, error: any) =>
    error instanceof CategoryValidationError
        ? res.status(400).send({ message: error.message })
        : res.status(500).send({ message: error.message || 'Internal Server Error' });

/**
 * Get all categories (flat list; the client builds the tree from parent_id)
 */
categoryRouter.get('/', async (_req: Request, res: Response<Category[] | string>) => {
    try {
        res.status(200).json(await categoryService.getAllCategories());
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

/**
 * Get a specific category by ID
 */
categoryRouter.get(
    '/:id',
    async (req: Request<{ id: string }>, res: Response<Category | string>) => {
        try {
            const category = await categoryService.getCategoryById(req.params.id);
            if (!category) return res.status(404).send();
            res.status(200).json(category);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Create a new category
 */
categoryRouter.post(
    '/add',
    async (
        req: Request<{}, {}, { name: string; parent_id?: number | null }>,
        res: Response<Category | { message: string }>,
    ) => {
        try {
            res.status(201).json(await categoryService.createCategory(req.body));
        } catch (error: any) {
            fail(res, error);
        }
    },
);

/**
 * Rename and/or move a category. Moving into its own subtree is rejected.
 */
categoryRouter.put(
    '/item/:id',
    async (
        req: Request<{ id: string }, {}, { name?: string; parent_id?: number | null }>,
        res: Response<Category | { message: string }>,
    ) => {
        try {
            const updated = await categoryService.updateCategory(req.params.id, req.body);
            if (!updated) return res.status(404).send({ message: 'Category not found' });
            res.status(200).json(updated);
        } catch (error: any) {
            fail(res, error);
        }
    },
);

/**
 * Delete a category; its subcategories and products move to its parent.
 */
categoryRouter.delete(
    '/:id',
    async (req: Request<{ id: string }>, res: Response<{ message: string }>) => {
        try {
            const deleted = await categoryService.deleteCategory(req.params.id);
            if (!deleted) return res.status(404).send({ message: 'Category not found' });
            res.status(200).send({ message: `Category ${req.params.id} successfully deleted.` });
        } catch (error: any) {
            fail(res, error);
        }
    },
);
