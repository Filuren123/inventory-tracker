import express, { type Request, type Response } from 'express';
import { CategoryService } from '../service/category.service.js';
import type { Category } from '../model/category.interface.js';

export const categoryRouter = express.Router();
const categoryService = new CategoryService();

/**
 * Get all categories
 */
categoryRouter.get(
    '/',
    async (req: Request<{}, {}, {}>, res: Response<Category[]>) => {
        try {
            const categories = await categoryService.getAllCategories();
            res.status(200).json(categories);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Get a specific category by ID
 */
categoryRouter.get(
    '/:id',
    async (req: Request<{ id: string }, {}, {}>, res: Response<Category>) => {
        try {
            const categoryItem = await categoryService.getCategoryById(
                req.params.id,
            );

            if (!categoryItem) {
                return res.status(404).send();
            }
            res.status(200).json(categoryItem);
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
        req: Request<
            {},
            {},
            {
                name: string;
                parent_id?: number | null;
            }
        >,
        res: Response<Category | { message: string }>,
    ) => {
        try {
            const { name } = req.body;

            if (!name) {
                return res
                    .status(400)
                    .send({ message: 'Category name is required.' });
            }

            const newCategory = await categoryService.createCategory(req.body);
            res.status(201).json(newCategory);
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);

/**
 * Update an existing category by ID
 */
categoryRouter.put(
    '/item/:id',
    async (
        req: Request<
            { id: string },
            {},
            {
                name?: string;
                parent_id?: number | null;
            }
        >,
        res: Response<Category | { message: string }>,
    ) => {
        try {
            const updatedCategory = await categoryService.updateCategory(
                req.params.id,
                req.body,
            );

            if (!updatedCategory) {
                return res.status(404).send({ message: 'Category not found' });
            }

            res.status(200).json(updatedCategory);
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);

/**
 * Delete a category by ID
 */
categoryRouter.delete(
    '/:id',
    async (
        req: Request<{ id: string }, {}, {}>,
        res: Response<{ message: string }>,
    ) => {
        try {
            const isDeleted = await categoryService.deleteCategory(
                req.params.id,
            );

            if (!isDeleted) {
                return res.status(404).send({ message: 'Category not found' });
            }

            res.status(200).send({
                message: `Category ${req.params.id} successfully deleted.`,
            });
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);