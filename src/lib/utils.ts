import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatRaceDate(dateString: string): string {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

export function normalizeRaceName(name: string): string {
    return name
        .replace(/第\d+回(記念)?/g, '')
        .replace(/20\d{2}/g, '')
        .replace(/令和\d+年(度)?/g, '')
        .trim();
}

export function getEntryStatusInfo(status?: string): { label: string, className: string } {
    switch (status) {
        case '受付中':
            return { label: '🎌 受付中', className: 'text-white bg-primary shadow-sm' };
        case '受付終了':
            return { label: '🔒 受付終了', className: 'text-muted-foreground bg-muted-foreground/10' };
        case '不明':
            return { label: '❓ 不明', className: 'text-muted-foreground bg-muted/60' };
        default:
            return { label: '⏳ エントリー前', className: 'text-orange-700 bg-orange-100/50' };
    }
}
