import { UserModel } from '../db/model/user.db.ts';
import type { User } from '../model/user.interface.ts';

export class UserService {
    async getUserByUsername(username: string): Promise<User> {
        const user = await UserModel.findOne({ where: { username } });
        if (!user) throw new Error(`User with username '${username}' not found`);
        return user.get({ plain: true }) as User;
    }

    async getUserById(id: number): Promise<User> {
        const user = await UserModel.findByPk(id);
        if (!user) throw new Error(`User with ID '${id}' not found`);
        return user.get({ plain: true }) as User;
    }

    async getAllUsers(): Promise<Omit<User, 'password'>[]> {
        const users = await UserModel.findAll({
            attributes: { exclude: ['password'] }
        });
        return users.map(user => user.get({ plain: true }) as Omit<User, 'password'>);
    }

    async createUser(userData: Omit<User, 'id'>): Promise<User> {
        // Note: Password hashing should ideally be handled by a Sequelize 
        // 'beforeCreate' hook in your UserModel.
        const newUser = await UserModel.create(userData);
        return newUser.get({ plain: true }) as User;
    }

    async findOrCreate(options: { 
        where: Partial<User>, 
        defaults: Partial<User> 
    }): Promise<[User, boolean]> {
        const [user, created] = await UserModel.findOrCreate({
            where: options.where as any,
            defaults: options.defaults as any
        });
        
        return [user.get({ plain: true }) as User, created];
    }
}
