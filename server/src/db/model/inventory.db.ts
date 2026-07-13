import {
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
    DataTypes,
} from 'sequelize';
import { sequelize } from '../conn.js';
import { ProductModel } from './product.db.js';

export class InventoryModel extends Model<
    InferAttributes<InventoryModel>,
    InferCreationAttributes<InventoryModel>
> {
    declare id: CreationOptional<number>;
    declare product_id: number;
    declare storage_location: string;
    declare quantity: CreationOptional<string>;
    declare expiry_date: CreationOptional<Date | null>;
    declare purchase_date: CreationOptional<Date | null>;
}

InventoryModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'product_id',
            },
        },
        storage_location: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        purchase_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'inventory',
    },
);

InventoryModel.belongsTo(ProductModel, {
    foreignKey: 'product_id',
    as: 'product',
});
ProductModel.hasMany(InventoryModel, {
    foreignKey: 'product_id',
    as: 'inventory',
});
