import express from 'express';
import dotenv from 'dotenv';
import { userRouter } from './router/user.router';

export const app = express();
dotenv.config();
app.use(express.json());

app.use('/user', userRouter);
