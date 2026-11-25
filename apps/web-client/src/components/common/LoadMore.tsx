import { useEffect, useRef } from 'react';

interface Props {
    hasMore: boolean;
    loading: boolean;
    error: string | null;
    onLoadMore: () => void;
    onRetry: () => void;
    /** Changes whenever more items render, so the observer re-checks visibility. */
    itemCount: number;
}

/**
 * Infinite-scroll trigger: loads the next page when it scrolls near the viewport.
 * Also renders the loading / error / end-of-list states.
 */
const LoadMore = ({ hasMore, loading, error, onLoadMore, onRetry, itemCount }: Props) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || !hasMore || loading || error) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) onLoadMore();
            },
            { rootMargin: '600px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, error, onLoadMore, itemCount]);

    return (
        <div ref={ref} className="load-more" aria-live="polite">
            {loading && <span className="spinner" aria-label="Loading" />}
            {error && (
                <div className="load-more-error">
                    <span>{error}</span>
                    <button type="button" className="btn btn-sm" onClick={onRetry}>
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoadMore;
