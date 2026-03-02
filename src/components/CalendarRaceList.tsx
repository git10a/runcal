import { useState, useMemo } from 'react';
import { Race } from '@/lib/data';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarRaceListProps {
    filteredRaces: Race[];
}

export default function CalendarRaceList({ filteredRaces }: CalendarRaceListProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        const startPadding = firstDay.getDay();
        for (let i = startPadding - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push({ date: d, isCurrentMonth: false });
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            days.push({ date: d, isCurrentMonth: true });
        }

        const endPadding = 42 - days.length;
        for (let i = 1; i <= endPadding; i++) {
            const d = new Date(year, month + 1, i);
            days.push({ date: d, isCurrentMonth: false });
        }

        return days;
    }, [currentMonth]);

    const getRacesForDate = (date: Date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return filteredRaces.filter(r => r.date === dateStr);
    };

    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm min-h-[600px]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-bold">
                    {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
            <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-sm font-medium text-muted-foreground">
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                    <div key={day} className="py-2">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[120px]">
                {calendarDays.map((dayObj, i) => {
                    const dayRaces = getRacesForDate(dayObj.date);
                    return (
                        <div
                            key={i}
                            className={`p-2 border-r border-b border-border last:border-r-0 ${dayObj.isCurrentMonth ? 'bg-card' : 'bg-muted/10 opacity-60'
                                }`}
                        >
                            <div className={`text-sm font-medium mb-1 ${dayObj.date.toDateString() === new Date().toDateString()
                                ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto'
                                : 'text-center text-muted-foreground'
                                }`}>
                                {dayObj.date.getDate()}
                            </div>
                            <div className="space-y-1 overflow-y-auto max-h-[80px] pr-1 custom-scrollbar">
                                {dayRaces.map(race => (
                                    <a
                                        key={race.id}
                                        href={race.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block text-[10px] p-1.5 rounded truncate transition-colors ${race.entry_status === '受付中'
                                            ? 'bg-primary/20 text-orange-800 hover:bg-primary/30 font-bold'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                        title={race.name}
                                    >
                                        {race.entry_status === '受付中' && '🎌 '}
                                        {race.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
