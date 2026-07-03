import { sequelize } from './db/conn';
import { app } from './start';
import { User } from './model/user.interface';
import { UserService } from './service/user.service';

const PORT: number = Number(process.env.PORT ?? 8080);

const userService = new UserService();

(async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');

        const defaultUsername = process.env.ADMIN_USERNAME;
        const defaultPassword = process.env.ADMIN_PASSWORD;

        const [user, created] = await userService.findOrCreate({
            where: { username: defaultUsername },
            defaults: {
                password: defaultPassword,
            },
        });

        if (created) {
            console.log(`Default admin user '${defaultUsername}' created successfully.`);
        } else {
            console.log(`Admin user '${defaultUsername}' already exists.`);
        }

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to sync database or start server:', err);
        process.exit(1);
    }
})();