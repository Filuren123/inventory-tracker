import {
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
    DataTypes,
} from 'sequelize';
import { sequelize } from '../conn.ts';

export class UserModel extends Model<
    InferAttributes<UserModel>,
    InferCreationAttributes<UserModel>
> {
    declare id: CreationOptional<number>;
    declare username: string;
    declare password: string;
}

UserModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'users',
    },
);
