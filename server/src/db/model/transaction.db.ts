import {
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
    DataTypes,
} from 'sequelize';
import { sequelize } from '../conn.js';
import { UserModel } from './user.db.js';
import { ProductModel } from './product.db.js';

export class TransactionModel extends Model<
    InferAttributes<TransactionModel>,
    InferCreationAttributes<TransactionModel>
> {
    declare id: CreationOptional<number>;
    declare user_id: number;
    declare product_id: number;
    declare action: 'scan_in' | 'scan_out';
    declare scanned_at: CreationOptional<Date>;
    declare note: CreationOptional<string | null>;
}

TransactionModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'product_id',
            },
        },
        action: {
            type: DataTypes.ENUM('scan_in', 'scan_out'),
            allowNull: false,
        },
        scanned_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'transactions',
    },
);

TransactionModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });
TransactionModel.belongsTo(ProductModel, {
    foreignKey: 'product_id',
    as: 'product',
});
UserModel.hasMany(TransactionModel, {
    foreignKey: 'user_id',
    as: 'transactions',
});
ProductModel.hasMany(TransactionModel, {
    foreignKey: 'product_id',
    as: 'transactions',
});
