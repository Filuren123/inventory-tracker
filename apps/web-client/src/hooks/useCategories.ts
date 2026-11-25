import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllCategories } from '../api/categories';
import { errorMessage } from '../api/axios';
import type { Category } from '../model/category.interface';
import { buildTree, flattenTree } from '../utils/categoryTree';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(
        () =>
            getAllCategories().then(
                (data) => {
                    setCategories(data);
                    setError(null);
                    setLoading(false);
                },
                (err) => {
                    setError(errorMessage(err, 'Could not load categories'));
                    setLoading(false);
                },
            ),
        [],
    );

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const reload = useCallback(() => {
        setLoading(true);
        return fetchAll();
    }, [fetchAll]);

    const tree = useMemo(() => buildTree(categories), [categories]);
    const flat = useMemo(() => flattenTree(tree), [tree]);

    return { categories, tree, flat, loading, error, reload };
}
