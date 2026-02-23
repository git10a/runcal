"use client";

import { useState, useMemo, useEffect } from 'react';
import { Race } from '@/lib/data';
import RaceCard from './RaceCard';
import FilterBar from './FilterBar';
import { Grid, List, Heart, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface RaceListProps {
    initialRaces: Race[];
    prefectures: string[];
    distances: string[];
}

export default function RaceList({ initialRaces, prefectures, distances }: RaceListProps) {
    const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
    const [selectedDistance, setSelectedDistance] = useState<string | null>(null);
    const [selectedEntryStatus, setSelectedEntryStatus] = useState<string | null>(null);
    const [selectedCertified, setSelectedCertified] = useState<boolean | null>(null);

    const [viewMode, setViewMode] = useState<'card' | 'table' | 'calendar'>('card');
    const { favorites, toggleFavorite, isLoaded } = useFavorites();

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const filteredRaces = useMemo(() => {
        let races = initialRaces;
        if (selectedPrefecture) {
            races = races.filter(r => r.prefecture === selectedPrefecture);
        }
        if (selectedDistance) {
            races = races.filter(r => r.distance.includes(selectedDistance));
        }
        if (selectedEntryStatus) {
            races = races.filter(r => r.entry_status === selectedEntryStatus);
        }
        if (selectedCertified !== null) {
            races = races.filter(r => r.is_jaaf_certified === selectedCertified);
        }
        return races;
    }, [initialRaces, selectedPrefecture, selectedDistance, selectedEntryStatus, selectedCertified]);

    const handleFilterChange = (type: 'prefecture' | 'distance' | 'entryStatus' | 'certified', value: any) => {
        if (type === 'prefecture') setSelectedPrefecture(value);
        if (type === 'distance') setSelectedDistance(value);
        if (type === 'entryStatus') setSelectedEntryStatus(value);
        if (type === 'certified') setSelectedCertified(value);
    };

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedPrefecture, selectedDistance, selectedEntryStatus, selectedCertified]);

    const totalPages = Math.ceil(filteredRaces.length / ITEMS_PER_PAGE);
    const paginatedRaces = filteredRaces.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Calendar Logic
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
        // Add padding days from previous month to start on Sunday
        const startPadding = firstDay.getDay();
        for (let i = startPadding - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push({ date: d, isCurrentMonth: false });
        }

        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            days.push({ date: d, isCurrentMonth: true });
        }

        // Add padding days for next month to complete rows
        const endPadding = 42 - days.length; // 6 rows of 7 days
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
        <>
            <FilterBar
                prefectures={prefectures}
                distances={distances}
                selectedPrefecture={selectedPrefecture}
                selectedDistance={selectedDistance}
                selectedEntryStatus={selectedEntryStatus}
                selectedCertified={selectedCertified}
                onFilterChange={handleFilterChange}
            />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">大会一覧</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {(() => {
                                const jstDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
                                const year = jstDate.getFullYear();
                                const month = String(jstDate.getMonth() + 1).padStart(2, '0');
                                const day = String(jstDate.getDate()).padStart(2, '0');
                                return `${year}年${month}月${day}日 現在`;
                            })()}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <p className="text-sm text-muted-foreground font-medium">{filteredRaces.length}件の大会が見つかりました</p>
                        <div className="flex bg-muted/60 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`flex items-center justify-center w-10 h-8 rounded-lg transition-all cursor-pointer ${viewMode === 'card' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                aria-label="カード表示"
                                title="カード表示"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center justify-center w-10 h-8 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                aria-label="テーブル表示"
                                title="テーブル表示"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center justify-center w-10 h-8 rounded-lg transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                aria-label="カレンダー表示"
                                title="カレンダー表示"
                            >
                                <CalendarDays size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {filteredRaces.length > 0 ? (
                    <>
                        {viewMode === 'card' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedRaces.map(race => (
                                    <RaceCard key={race.id} race={race} />
                                ))}
                            </div>
                        ) : viewMode === 'table' ? (
                            <div className="overflow-x-auto bg-card rounded-2xl border border-border shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border whitespace-nowrap">
                                        <tr>
                                            <th className="px-4 py-3 min-w-[120px]">開催日</th>
                                            <th className="px-4 py-3 min-w-[100px]">エントリ</th>
                                            <th className="px-4 py-3 min-w-[200px]">大会名</th>
                                            <th className="px-4 py-3 min-w-[140px]">開催地</th>
                                            <th className="px-4 py-3 min-w-[100px] text-center">制限時間</th>
                                            <th className="px-4 py-3 min-w-[80px]">公認</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedRaces.map(race => {
                                            const isFav = favorites.includes(race.id);
                                            return (
                                                <tr key={race.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        {(() => {
                                                            const [year, month, day] = race.date.split('-');
                                                            return `${year}/${parseInt(month)}/${parseInt(day)}`;
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${race.entry_status === '受付中' ? 'text-white bg-primary shadow-sm' :
                                                            race.entry_status === '受付終了' ? 'text-muted-foreground bg-muted-foreground/10' :
                                                                'text-orange-700 bg-orange-100/50'
                                                            }`}>
                                                            {race.entry_status === '受付中' ? '🎌 受付中' :
                                                                race.entry_status === '受付終了' ? '🔒 受付終了' :
                                                                    '⏳ エントリー前'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-bold">
                                                        <a href={race.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center pr-1 line-clamp-1">
                                                            {race.name.split(/[（(]/)[0].trim()}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                                                        {race.prefecture}{race.city && ` ${race.city}`}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-muted-foreground whitespace-nowrap">
                                                        {race.time_limit || 'ー'}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        {race.is_jaaf_certified && (
                                                            <span className="text-[10px] font-bold text-primary-hover bg-primary/10 px-2.5 py-1 rounded-full">陸連公認</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {isLoaded && (
                                                            <button
                                                                onClick={() => toggleFavorite(race.id)}
                                                                className={`transition-colors p-1.5 rounded-full shrink-0 cursor-pointer ${isFav ? 'text-red-500 hover:bg-red-50' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'}`}
                                                            >
                                                                <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
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
                                                            {race.name.split(/[（(]/)[0]}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-12 gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-muted"
                                >
                                    前のページ
                                </button>
                                <span className="text-sm font-bold text-muted-foreground mx-4">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-muted"
                                >
                                    次のページ
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                        <h3 className="text-lg font-medium text-foreground mb-2">条件に一致する大会がありません</h3>
                        <p className="text-muted-foreground text-sm">フィルターの条件を変更してお試しください。</p>
                        <button
                            onClick={() => {
                                setSelectedPrefecture(null);
                                setSelectedDistance(null);
                                setSelectedEntryStatus('受付中');
                                setSelectedCertified(null);
                            }}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary-hover transition-colors cursor-pointer"
                        >
                            条件をクリア
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
