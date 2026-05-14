import { UserModel } from '../db/model/user.db';
import { User } from '../model/user.interface';

export class UserService {
    async getUserByUsername(username: string): Promise<User> {
        const user = await UserModel.findOne({ where: { username } });
        if (!user) throw new Error("User not found");
        return user.get({ plain: true }) as User;
    }
}