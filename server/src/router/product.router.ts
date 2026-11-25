import express, { type Request, type Response } from 'express';
import { ProductService, ProductValidationError, type ProductInput } from '../service/product.service.js';
import { type Product } from '../model/product.interface.js';

export const productRouter = express.Router();

const productService = new ProductService();

const fail = (res: Response, error: any) =>
    error instanceof ProductValidationError
        ? res.status(error.status).send({ message: error.message })
        : res.status(500).send({ message: error.message || 'Internal Server Error' });

/**
 * Without `q`: all products. With `q`: name/brand/EAN search (limit 1-50, default 10).
 */
productRouter.get('/', async (req: Request, res: Response<Product[] | string>) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (!q) return res.status(200).json(await productService.getAllProducts());
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
        res.status(200).json(await productService.searchProducts(q, limit));
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

/**
 * Get a specific product by EAN code
 */
productRouter.get(
    '/ean/:ean',
    async (req: Request<{ ean: string }>, res: Response<Product | string>) => {
        try {
            const product = await productService.getProductByEAN(req.params.ean);
            if (!product) return res.status(404).send();
            res.status(200).json(product);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Get a specific product by ID
 */
productRouter.get('/:id', async (req: Request<{ id: string }>, res: Response<Product | string>) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) return res.status(404).send();
        res.status(200).json(product);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

/**
 * Create a product. Only `name` is required; `ean_code` may be empty for products without a barcode.
 */
productRouter.post(
    '/add',
    async (req: Request<{}, {}, ProductInput>, res: Response<Product | { message: string }>) => {
        try {
            res.status(201).json(await productService.createProduct(req.body ?? {}));
        } catch (error: any) {
            fail(res, error);
        }
    },
);

/**
 * Update the fields that are sent on an existing product
 */
productRouter.put(
    '/item/:id',
    async (req: Request<{ id: string }, {}, ProductInput>, res: Response<Product | { message: string }>) => {
        try {
            const updated = await productService.updateProduct(req.params.id, req.body ?? {});
            if (!updated) return res.status(404).send({ message: 'Product not found' });
            res.status(200).json(updated);
        } catch (error: any) {
            fail(res, error);
        }
    },
);

/**
 * Delete a product by ID
 */
productRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response<{ message: string }>) => {
    try {
        const deleted = await productService.deleteProduct(req.params.id);
        if (!deleted) return res.status(404).send({ message: 'Product not found' });
        res.status(200).send({ message: `Product ${req.params.id} successfully deleted.` });
    } catch (error: any) {
        fail(res, error);
    }
});
