import express from 'express';
import dotenv from 'dotenv';
import dotenvFlow from 'dotenv-flow';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { userRouter } from './router/user.router.js';
import { inventoryRouter } from './router/inventory.router.js';
import { productRouter } from './router/product.router.js';
import { categoryRouter } from './router/category.router.js';
import { authenticateToken } from './middlewares/auth.middleware.js';

dotenvFlow.config();

console.log(`Running in ${process.env.NODE_ENV} mode`);
console.log(`Client URL: ${process.env.CLIENT_URL}`);

export const app = express();

// Middleware
app.use(cors({
	origin: process.env.CLIENT_URL,
	credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Request logger middleware for debugging
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
	next();
});

app.use('/user', userRouter);

app.use(authenticateToken); // Apply authentication middleware to all routes below
app.use('/inventory', inventoryRouter);
app.use('/product', productRouter);
app.use('/categories', categoryRouter);