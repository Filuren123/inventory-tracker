import express, { Request, Response } from 'express';
import { ProductService } from '../service/product.service';
import { Product } from '../model/product.interface';

export const productRouter = express.Router();
const productService = new ProductService();

/**
 * Get all products
 */
productRouter.get(
    '/',
    async (req: Request<{}, {}, {}>, res: Response<Product[]>) => {
        try {
            const products = await productService.getAllProducts();
            res.status(200).json(products);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Get a specific product by ID
 */
productRouter.get(
    '/:id',
    async (req: Request<{ id: string }, {}, {}>, res: Response<Product>) => {
        try {
            const productItem = await productService.getProductById(
                req.params.id,
            );

            if (!productItem) {
                return res.status(404).send();
            }
            res.status(200).json(productItem);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Get a specific product by EAN code
 */
productRouter.get(
    '/ean/:ean',
    async (req: Request<{ ean: string }, {}, {}>, res: Response<Product | null>) => {
        try {
            const productItem = await productService.getProductByEAN(
                req.params.ean,
            );
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);

/**
 * Create a new product item
 */
productRouter.post(
    '/add',
    async (
        req: Request<
            {},
            {},
            {
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
            }
        >,
        res: Response<Product | { message: string }>,
    ) => {
        try {
            const { name } = req.body;

            // Basic validation matching the schema constraint (allowNull: false)
            if (!name) {
                return res
                    .status(400)
                    .send({ message: 'Product name is required.' });
            }

            const newProduct = await productService.createProduct(req.body);
            res.status(201).json(newProduct);
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);

/**
 * Update an existing product item by ID
 */
productRouter.put(
    '/item/:id',
    async (
        req: Request<
            { id: string },
            {},
            {
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
        >,
        res: Response<Product | { message: string }>,
    ) => {
        try {
            const updatedProduct = await productService.updateProduct(
                req.params.id,
                req.body,
            );

            if (!updatedProduct) {
                return res.status(404).send({ message: 'Product not found' });
            }

            res.status(200).json(updatedProduct);
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);

/**
 * Delete a product item by ID
 */
productRouter.delete(
    '/:id',
    async (
        req: Request<{ id: string }, {}, {}>,
        res: Response<{ message: string }>,
    ) => {
        try {
            const isDeleted = await productService.deleteProduct(req.params.id);

            if (!isDeleted) {
                return res.status(404).send({ message: 'Product not found' });
            }

            res.status(200).send({
                message: `Product ${req.params.id} successfully deleted.`,
            });
        } catch (error: any) {
            res.status(500).send({
                message: error.message || 'Internal Server Error',
            });
        }
    },
);
