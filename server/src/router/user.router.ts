import express, { Request, Response } from "express";
import { UserService } from "../service/user.service";
import { User } from "../model/user.interface";
import { authenticateToken } from "../middlewares/auth.middleware";

const userService = new UserService();

const jwt = require("jsonwebtoken");

export const userRouter = express.Router();

userRouter.get(
    "/:username",
    async(
    req: Request<{ username: string }, {}, {}>,
    res: Response<User>
    ) => {
        try {
            const user: User = await userService.getUserByUsername(req.params.username);
            res.status(200).send(user);
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    }
);

userRouter.post(
    "/login",
    async(
    req: Request<{}, {}, { username: string; password: string }>,
    res: Response<{ accessToken: string }>
    ) => {
        try {
            // TODO: Authenticate user
            
            const username = req.body.username;
            const user = { username: username };
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            res.json({ accessToken: accessToken });

        } catch (error: any) {
        }
    }
);
