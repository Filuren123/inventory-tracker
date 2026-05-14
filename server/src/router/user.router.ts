import express, { Request, Response } from "express";
import { UserService } from "../service/user.service";
import { User } from "../model/user.interface";

const userService = new UserService();

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