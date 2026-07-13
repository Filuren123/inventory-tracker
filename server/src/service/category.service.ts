import { CategoryModel } from '../db/model/category.db.ts';
import type { Category } from '../model/category.interface.ts';

export class CategoryService {
    /**
     * Fetch all categories
     */
    async getAllCategories(): Promise<Category[]> {
        const categories = await CategoryModel.findAll();
        return categories as unknown as Category[];
    }

    /**
     * Fetch a specific category by its primary key ID
     */
    async getCategoryById(id: string | number): Promise<Category | null> {
        const categoryItem = await CategoryModel.findByPk(id);
        if (!categoryItem) return null;
        return categoryItem as unknown as Category;
    }

    /**
     * Create a brand new category
     */
    async createCategory(data: {
        name: string;
        parent_id?: number | null;
    }): Promise<Category> {
        const newCategory = await CategoryModel.create({
            name: data.name,
            parent_id: data.parent_id ?? null,
        });

        return newCategory as unknown as Category;
    }

    /**
     * Update fields on an existing category
     */
    async updateCategory(
        id: string | number,
        data: {
            name?: string;
            parent_id?: number | null;
        },
    ): Promise<Category | null> {
        const categoryItem = await CategoryModel.findByPk(id);
        if (!categoryItem) return null;

        await categoryItem.update({
            name: data.name ?? categoryItem.name,
            parent_id:
                data.parent_id !== undefined
                    ? data.parent_id
                    : categoryItem.parent_id,
        });

        return categoryItem as unknown as Category;
    }

    /**
     * Delete a category record by ID
     */
    async deleteCategory(id: string | number): Promise<boolean> {
        const categoryItem = await CategoryModel.findByPk(id);
        if (!categoryItem) return false;

        await categoryItem.destroy();
        return true;
    }
}