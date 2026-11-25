const pad = (n: number) => String(n).padStart(2, '0');

const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = (): string => toISO(new Date());

/**
 * Expand shorthand date input to YYYY-MM-DD:
 *   "5" -> this month, day 5 · "0612" -> 12 June this year · "270612" -> 2027-06-12
 */
export const parseSmartDate = (raw: string): string => {
    if (!raw) return raw;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const digits = raw.replace(/\D/g, '');
    if (!digits) return raw;

    const now = new Date();
    let year = String(now.getFullYear());
    let month = pad(now.getMonth() + 1);
    let day: string;

    if (digits.length <= 2) {
        day = digits.padStart(2, '0');
    } else if (digits.length <= 4) {
        const padded = digits.padStart(4, '0');
        month = padded.slice(0, 2);
        day = padded.slice(2, 4);
    } else {
        const padded = digits.slice(-6).padStart(6, '0');
        year = `20${padded.slice(0, 2)}`;
        month = padded.slice(2, 4);
        day = padded.slice(4, 6);
    }
    return `${year}-${month}-${day}`;
};

/** Whole days from today until an ISO date (negative = in the past). */
export const daysUntil = (iso: string): number => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const target = new Date(y!, m! - 1, d!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

export type ExpiryStatus = 'expired' | 'soon' | 'ok' | 'none';

export const SOON_DAYS = 7;

export const expiryStatus = (iso: string | null): ExpiryStatus => {
    if (!iso) return 'none';
    const days = daysUntil(iso);
    if (days < 0) return 'expired';
    if (days <= SOON_DAYS) return 'soon';
    return 'ok';
};

/** Short relative label for an expiry date, e.g. "Expired 3 d ago", "Today", "In 5 d". */
export const expiryLabel = (iso: string | null): string => {
    if (!iso) return 'No expiry';
    const days = daysUntil(iso);
    if (days === 0) return 'Expires today';
    if (days < 0) return `Expired ${-days} d ago`;
    if (days === 1) return 'Expires tomorrow';
    return `In ${days} d`;
};
