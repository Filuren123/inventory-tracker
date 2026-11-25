import { CategoryModel } from '../db/model/category.db.js';
import { ProductModel } from '../db/model/product.db.js';
import { sequelize } from '../db/conn.js';
import type { Category } from '../model/category.interface.js';

/** Thrown for requests that are well-formed but not allowed; routers map it to 400. */
export class CategoryValidationError extends Error {}

const plain = (c: CategoryModel): Category => c.get({ plain: true }) as Category;

export class CategoryService {
    async getAllCategories(): Promise<Category[]> {
        const categories = await CategoryModel.findAll({ order: [['name', 'ASC']] });
        return categories.map(plain);
    }

    async getCategoryById(id: string | number): Promise<Category | null> {
        const category = await CategoryModel.findByPk(id);
        return category ? plain(category) : null;
    }

    /** The category itself plus every category below it. */
    async getDescendantIds(id: number): Promise<Set<number>> {
        const all = await CategoryModel.findAll({ attributes: ['id', 'parent_id'], raw: true });
        const childrenOf = new Map<number, number[]>();
        for (const c of all) {
            if (c.parent_id == null) continue;
            childrenOf.set(c.parent_id, [...(childrenOf.get(c.parent_id) ?? []), c.id]);
        }
        const result = new Set<number>();
        const stack = [id];
        while (stack.length) {
            const current = stack.pop()!;
            if (result.has(current)) continue;
            result.add(current);
            stack.push(...(childrenOf.get(current) ?? []));
        }
        return result;
    }

    private async assertValidParent(parentId: number | null | undefined, selfId?: number) {
        if (parentId == null) return;
        if (!(await CategoryModel.findByPk(parentId))) {
            throw new CategoryValidationError('Parent category does not exist.');
        }
        if (selfId != null && (await this.getDescendantIds(selfId)).has(parentId)) {
            throw new CategoryValidationError(
                'A category cannot be moved into itself or one of its subcategories.',
            );
        }
    }

    async createCategory(data: { name: string; parent_id?: number | null }): Promise<Category> {
        const name = data.name?.trim();
        if (!name) throw new CategoryValidationError('Category name is required.');
        await this.assertValidParent(data.parent_id);
        const created = await CategoryModel.create({ name, parent_id: data.parent_id ?? null });
        return plain(created);
    }

    async updateCategory(
        id: string | number,
        data: { name?: string; parent_id?: number | null },
    ): Promise<Category | null> {
        const category = await CategoryModel.findByPk(id);
        if (!category) return null;
        const name = data.name === undefined ? category.name : data.name.trim();
        if (!name) throw new CategoryValidationError('Category name is required.');
        if (data.parent_id !== undefined) {
            await this.assertValidParent(data.parent_id, category.id);
        }
        await category.update({
            name,
            parent_id: data.parent_id !== undefined ? data.parent_id : category.parent_id,
        });
        return plain(category);
    }

    /**
     * Delete a category. Its subcategories and products move up to its parent
     * (or become top-level / uncategorised), so nothing is lost.
     */
    async deleteCategory(id: string | number): Promise<boolean> {
        return sequelize.transaction(async (transaction) => {
            const category = await CategoryModel.findByPk(id, { transaction });
            if (!category) return false;
            const parentId = category.parent_id ?? null;
            await CategoryModel.update(
                { parent_id: parentId },
                { where: { parent_id: category.id }, transaction },
            );
            await ProductModel.update(
                { category_id: parentId },
                { where: { category_id: category.id }, transaction },
            );
            await category.destroy({ transaction });
            return true;
        });
    }
}
