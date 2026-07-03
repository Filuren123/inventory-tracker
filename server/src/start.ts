import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Import all your routers
import { userRouter } from './router/user.router';
import { inventoryRouter } from './router/inventory.router';
import { productRouter } from './router/product.router';
import { categoryRouter } from './router/category.router';
import { authenticateToken } from './middlewares/auth.middleware';

dotenv.config();

export const app = express();

// Middleware
app.use(cors());
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