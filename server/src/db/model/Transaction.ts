import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize'
import { sequelize } from '../conn'
import { UserModel } from './User'
import { ProductModel } from './Product'

export class TransactionModel extends Model<InferAttributes<TransactionModel>, InferCreationAttributes<TransactionModel>> {
  declare id: CreationOptional<number>
  declare user_id: number
  declare product_id: number
  declare action: 'scan_in' | 'scan_out'
  declare quantity: number
  declare scanned_at: CreationOptional<Date>
  declare note: CreationOptional<string | null>
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
  }
)

TransactionModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' })
TransactionModel.belongsTo(ProductModel, { foreignKey: 'product_id', as: 'product' })
UserModel.hasMany(TransactionModel, { foreignKey: 'user_id', as: 'transactions' })
ProductModel.hasMany(TransactionModel, { foreignKey: 'product_id', as: 'transactions' })
