// Timezone utility — always use Asia/Bangkok (UTC+7)
export const TIMEZONE = 'Asia/Bangkok';

/** Get current date/time in Bangkok timezone */
export function nowBangkok(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/** Get current month string as YYYY-MM in Bangkok timezone */
export function currentMonthBangkok(): string {
    const d = nowBangkok();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Get current date string as YYYY-MM-DD in Bangkok timezone */
export function todayBangkok(): string {
    const d = nowBangkok();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Format a date to Thai locale string */
export function formatThaiDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('th-TH', { timeZone: TIMEZONE, ...options });
}
