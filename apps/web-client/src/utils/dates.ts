export const parseSmartDate = (rawDate: string) => {
    if (!rawDate) return rawDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;

    const digits = rawDate.replace(/\D/g, '');
    if (!digits) return rawDate;

    const now = new Date();
    const thisYear = String(now.getFullYear());
    const thisMonth = String(now.getMonth() + 1).padStart(2, '0');

    let year = thisYear;
    let month = thisMonth;
    let day = digits;

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
}

export const todayISO = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}