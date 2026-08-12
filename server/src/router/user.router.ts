import express, { type Request, type Response } from 'express';
import { UserService } from '../service/user.service.js';
import type { User } from '../model/user.interface.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';

const userService = new UserService();

export const userRouter = express.Router();

userRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
    res.json({ user: (req as any).user });
});

userRouter.post(
    '/login',
    async (
        req: Request<{}, {}, { username: string; password: string }>,
        res: Response,
    ) => {
        try {
            const username = req.body.username;
            const password = req.body.password;

            // Check user credentials against .env file
            if (
                username !== process.env.ADMIN_USERNAME ||
                password !== process.env.ADMIN_PASSWORD
            ) {
                throw new Error('Invalid credentials');
            }

            const user = { username };
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
            });

            res.json({ success: true });
        } catch (error: any) {
            res.status(401).json({ message: 'Login failed' });
        }
    },
);

userRouter.post('/logout', (_req, res) => {
    res.clearCookie('accessToken');
    res.json({ success: true });
});

userRouter.get(
    '/:username',
    async (req: Request<{ username: string }, {}, {}>, res: Response<User>) => {
        try {
            const user: User = await userService.getUserByUsername(
                req.params.username,
            );
            res.status(200).send(user);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    },
);