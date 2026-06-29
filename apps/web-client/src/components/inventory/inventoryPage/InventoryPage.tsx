import "./InventoryPage.css";
import { useEffect, useState } from "react";
import type { RichInventory } from "../../../model/richInventory";

import { getAllInventory } from "../../../api/inventory";
import { useInventoryFilters } from "../useInventoryFilters";

const InventoryPage = () => {
    const [inventory, setInventory] = useState<RichInventory[]>([]);

    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const data = await getAllInventory();
                setInventory(data);
            } catch (err: any) {
                console.error("Could not fetch products", err);
            }
        };
        fetchAllProducts();
    }, []);

    const {
    filtered,
    searchTerm, setSearchTerm,
    filters, setFilter,
    sort, setSort,
  } = useInventoryFilters(inventory);

  return (
    <div>
      <InventoryToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
      />
      <InventoryList items={filtered} />
    </div>
  );

}

export default InventoryPage;