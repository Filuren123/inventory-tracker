import { useCallback, useEffect, useRef, useState } from 'react';
import { queryInventory, type InventoryQuery } from '../api/inventory';
import { errorMessage } from '../api/axios';
import type { RichInventory } from '../model/richInventory';

export const PAGE_SIZE = 30;

type Params = Omit<InventoryQuery, 'limit' | 'offset'>;

interface Loaded {
    key: string;
    token: number;
    items: RichInventory[];
    total: number | null;
    nextOffset: number | null;
    error: string | null;
}

/**
 * Paginated inventory for infinite scroll. Changing `params` starts over from
 * the first page; `loadMore` appends the next one. Stale responses are dropped.
 */
export function useInventoryQuery(params: Params) {
    const key = JSON.stringify(params);
    const [state, setState] = useState<Loaded | null>(null);
    const [token, setToken] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const controller = useRef<AbortController | null>(null);

    // Fetch a page and fold it into state. All state updates happen in promise callbacks.
    const fetchPage = useCallback(
        (k: string, t: number, offset: number, ac: AbortController) =>
            queryInventory({ ...JSON.parse(k), limit: PAGE_SIZE, offset }, ac.signal)
                .then(
                    (page) => {
                        if (ac.signal.aborted) return;
                        setState((prev) => {
                            const base = offset === 0 || prev?.key !== k ? [] : prev.items;
                            const seen = new Set(base.map((i) => i.id));
                            return {
                                key: k,
                                token: t,
                                items: [...base, ...page.items.filter((i) => !seen.has(i.id))],
                                total: page.total,
                                nextOffset: page.nextOffset,
                                error: null,
                            };
                        });
                    },
                    (err) => {
                        if (ac.signal.aborted) return;
                        const error = errorMessage(err, 'Could not load inventory');
                        setState((prev) =>
                            prev?.key === k
                                ? { ...prev, token: t, error }
                                : { key: k, token: t, items: [], total: null, nextOffset: 0, error },
                        );
                    },
                )
                .finally(() => {
                    if (controller.current === ac) {
                        controller.current = null;
                        setLoadingMore(false);
                    }
                }),
        [],
    );

    // First page whenever the query (or reload token) changes.
    useEffect(() => {
        controller.current?.abort();
        const ac = new AbortController();
        controller.current = ac;
        fetchPage(key, token, 0, ac);
        return () => ac.abort();
    }, [key, token, fetchPage]);

    const current = state?.key === key ? state : null;

    const loadMore = useCallback(() => {
        if (controller.current || !current || current.error || current.nextOffset == null) return;
        const ac = new AbortController();
        controller.current = ac;
        setLoadingMore(true);
        fetchPage(key, token, current.nextOffset, ac);
    }, [current, key, token, fetchPage]);

    const reload = useCallback(() => setToken((t) => t + 1), []);

    /** Drop an item locally after it was deleted, keeping the next page aligned. */
    const removeLocal = useCallback((id: number) => {
        setState((prev) =>
            prev && {
                ...prev,
                items: prev.items.filter((i) => i.id !== id),
                total: prev.total == null ? null : prev.total - 1,
                nextOffset: prev.nextOffset == null ? null : Math.max(prev.nextOffset - 1, 0),
            },
        );
    }, []);

    return {
        items: current?.items ?? [],
        total: current?.total ?? null,
        error: current?.error ?? null,
        loading: !current || current.token !== token || loadingMore,
        hasMore: current ? current.nextOffset != null : true,
        loadMore,
        /** After an error: start over from the first page. */
        retry: reload,
        reload,
        removeLocal,
    };
}
