import {
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
    DataTypes,
} from 'sequelize';
import { sequelize } from '../conn.ts';
import { CategoryModel } from './category.db.ts';

export class ProductModel extends Model<
    InferAttributes<ProductModel>,
    InferCreationAttributes<ProductModel>
> {
    declare product_id: CreationOptional<number>;
    declare ean_code: CreationOptional<string | null>;
    declare name: string;
    declare brand: CreationOptional<string | null>;
    declare category_id: CreationOptional<number | null>;
    declare default_storage_location: CreationOptional<string | null>;
    declare minimum_quantity: CreationOptional<number>;
    declare package_size: CreationOptional<number | null>;
    declare unit: CreationOptional<string | null>;
    declare min_price: CreationOptional<number | null>;
    declare min_price_location: CreationOptional<string | null>;
    declare link: CreationOptional<string | null>;
}

ProductModel.init(
    {
        product_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ean_code: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        brand: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id',
            },
        },
        default_storage_location: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        minimum_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        package_size: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        unit: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        min_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        min_price_location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        link: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'products',
    },
);

ProductModel.belongsTo(CategoryModel, {
    foreignKey: 'category_id',
    as: 'category',
});
CategoryModel.hasMany(ProductModel, {
    foreignKey: 'category_id',
    as: 'products',
});
