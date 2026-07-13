import {
    DataTypes,
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
} from 'sequelize';
import { sequelize } from '../conn.js';

export class CategoryModel extends Model<
    InferAttributes<CategoryModel>,
    InferCreationAttributes<CategoryModel>
> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare parent_id: CreationOptional<number | null>;
}

CategoryModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'categories',
    },
);

// Self-referencing associations
CategoryModel.hasMany(CategoryModel, {
    foreignKey: 'parent_id',
    as: 'children',
});
CategoryModel.belongsTo(CategoryModel, {
    foreignKey: 'parent_id',
    as: 'parent',
});
