import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/** Minimal transient message. Render `toast` somewhere in the page. */
export function useToast(durationMs = 3500): { show: (message: string) => void; toast: ReactNode } {
    const [message, setMessage] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(
        (msg: string) => {
            if (timer.current) clearTimeout(timer.current);
            setMessage(msg);
            timer.current = setTimeout(() => setMessage(null), durationMs);
        },
        [durationMs],
    );

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const toast = message ? (
        <div className="toast" role="status">
            {message}
        </div>
    ) : null;

    return { show, toast };
}
