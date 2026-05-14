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
        const user: User = await userService.getUserByUsername(req.params.username);
        return user;
    }
);