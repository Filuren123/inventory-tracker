import {
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
    DataTypes,
} from 'sequelize';
import { sequelize } from '../conn.js';

/** The storage locations users can pick from (Kyl, Frys, Skafferi, ...). */
export class StorageLocationModel extends Model<
    InferAttributes<StorageLocationModel>,
    InferCreationAttributes<StorageLocationModel>
> {
    declare id: CreationOptional<number>;
    declare name: string;
}

StorageLocationModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            // Same length as inventory.storage_location / products.default_storage_location
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
    },
    {
        sequelize,
        tableName: 'storage_locations',
    },
);
