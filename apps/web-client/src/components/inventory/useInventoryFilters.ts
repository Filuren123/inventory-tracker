import { useState, useMemo } from "react";
import type { RichInventory } from "../../model/richInventory";

interface Filters {
    storageLocation?: string;
    category?: number;
    expiringBefore?: Date;
}

const getNestedValue = <T>(obj: T, path: string): any => {
    return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
}

export const useInventoryFilters = (items: RichInventory[]) => {
        const [searchTerm, setSearchTerm] = useState('');
        const [filters, setFilters] = useState<Filters>({});
        const [sort, setSort] = useState<{ key: keyof RichInventory | string; dir: 'asc' | 'desc' }>({
        key: 'product.name', dir: 'asc'
    });

    const setFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filtered = useMemo(() => {
        let result = items;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
            item.product?.name.toLowerCase().includes(term) ||
            item.product?.brand?.toLowerCase().includes(term) ||
            item.product?.ean_code?.includes(term)
            );
        }

        if (filters.storageLocation) {
            result = result.filter(i => i.storage_location === filters.storageLocation);
        }

        if (filters.expiringBefore) {
            result = result.filter(i => i.expiry_date && i.expiry_date <= filters.expiringBefore!);
        }

        // sort
        result = [...result].sort((a, b) => {
            const aVal = getNestedValue(a, sort.key);
            const bVal = getNestedValue(b, sort.key);
            const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return sort.dir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [items, searchTerm, filters, sort]);

    return { filtered, searchTerm, setSearchTerm, filters, setFilter, sort, setSort };
}