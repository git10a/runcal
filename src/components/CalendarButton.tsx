'use client';

import { CalendarPlus } from 'lucide-react';
import { generateGoogleCalendarUrl } from '@/lib/calendar';

interface CalendarButtonProps {
    race: {
        name: string;
        date: string;
        entry_start_date: string | null;
        entry_end_date: string | null;
        url: string;
        prefecture: string;
        city: string | null;
    };
}

export default function CalendarButton({ race }: CalendarButtonProps) {
    const handleOpenLink = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const description = `大会公式サイト: ${race.url}`;
        const location = `${race.prefecture}${race.city ? ` ${race.city}` : ''}`;

        const url = generateGoogleCalendarUrl({
            title: `${race.name} (開催日)`,
            startDate: race.date,
            description,
            location
        });

        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            onClick={handleOpenLink}
            className="transition-colors p-2 rounded-full shrink-0 cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/5"
            title="大会開催日をカレンダーに登録"
            aria-label="大会開催日をカレンダーに登録"
        >
            <CalendarPlus size={20} />
        </button>
    );
}
