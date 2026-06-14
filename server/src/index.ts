import { sequelize } from './db/conn';
import { app } from './start';

const PORT: number = Number(process.env.PORT ?? 8080);

(async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to sync database:', err);
        process.exit(1);
    }
})();
