import "./InventoryPage.css";
import { useEffect, useState } from "react";
import type { RichInventory } from "../../../model/richInventory";

import InventoryToolbar from "../inventoryToolbar/InventoryToolbar";
import InventoryList from "../inventoryList/InventoryList";

import { getAllInventory } from "../../../api/inventory";
import { useInventoryFilters } from "../useInventoryFilters";
import CategoryPage from "../../categories/categoryPage/CategoryPage";
import type { Category } from "../../../model/category.interface";
import { getAllCategories } from "../../../api/categories";

const InventoryPage = () => {
    const [inventory, setInventory] = useState<RichInventory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const fetchAll = async () => {
      try {
        const [inventoryData, categoryData] = await Promise.all([
            getAllInventory(),
            getAllCategories(),
          ]);
          setInventory(inventoryData);
          setCategories(categoryData);
        } catch (err: any) {
          console.error("Could not fetch data", err);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);


    const {
    filtered,
    searchTerm, setSearchTerm,
    filters, setFilter,
    sort, setSort,
  } = useInventoryFilters(inventory);

  function getDescendantIds(categoryId: number, categories: Category[]): Set<number> {
    const result = new Set<number>();
    const queue = [categoryId];

    while (queue.length > 0) {
      const current = queue.pop()!;
      result.add(current);
      categories
        .filter(cat => cat.parent_id === current)
        .forEach(cat => queue.push(cat.id));
    }

    return result;
  }
  
  const filteredByCategory = selectedCategoryId
    ? (() => {
        const ids = getDescendantIds(selectedCategoryId, categories);
        return filtered.filter(item =>
            item.product?.category_id != null && ids.has(item.product.category_id)
        );
    })()
    : filtered;


  return (
    <>
    <main className="category-main-page">
				<aside>
					<CategoryPage
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
            onRefresh={fetchAll}
          />
				</aside>
				<section>
          <InventoryToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setFilter}
            sort={sort}
            onSortChange={setSort}
          />
          <InventoryList items={filteredByCategory} />
				</section>
			</main>
    </>
  );

}

export default InventoryPage;