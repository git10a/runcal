"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid, List, CalendarDays } from 'lucide-react';

interface ViewToggleProps {
    currentQueryString: string;
}

export default function ViewToggle({ currentQueryString }: ViewToggleProps) {
    const pathname = usePathname();
    const baseQuery = currentQueryString ? `?${currentQueryString}` : '';

    return (
        <div className="flex bg-muted/60 p-1 rounded-xl">
            <Link
                href={`/${baseQuery}`}
                className={`flex items-center justify-center w-10 h-8 rounded-lg transition-all ${pathname === '/' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                aria-label="カード表示"
                title="カード表示"
            >
                <Grid size={16} />
            </Link>
            <Link
                href={`/list${baseQuery}`}
                className={`flex items-center justify-center w-10 h-8 rounded-lg transition-all ${pathname === '/list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                aria-label="リスト表示"
                title="リスト表示"
            >
                <List size={16} />
            </Link>
            <Link
                href={`/calendar${baseQuery}`}
                className={`flex items-center justify-center w-10 h-8 rounded-lg transition-all ${pathname === '/calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                aria-label="カレンダー表示"
                title="カレンダー表示"
            >
                <CalendarDays size={16} />
            </Link>
        </div>
    );
}
