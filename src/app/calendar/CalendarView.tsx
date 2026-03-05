"use client";

import { useRef } from 'react';
import { Race } from '@/types';
import FilterBar from '@/components/FilterBar';
import ViewToggle from '@/components/ViewToggle';
import CalendarRaceList from '@/components/CalendarRaceList';
import { useRaceFilters } from '@/hooks/useRaceFilters';

interface CalendarViewProps {
    initialRaces: Race[];
    prefectures: string[];
    distances: string[];
}

export default function CalendarView({ initialRaces, prefectures, distances }: CalendarViewProps) {
    const {
        filteredRaces,
        selectedPrefecture,
        selectedRegion,
        selectedDistance,
        selectedMonth,
        selectedTags,
        showOnlyOpen,
        showOnlyCertified,
        handleFilterChange,
        handleClearAll,
        currentQueryString
    } = useRaceFilters(initialRaces);

    const listRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <FilterBar
                prefectures={prefectures}
                distances={distances}
                selectedPrefecture={selectedPrefecture}
                selectedRegion={selectedRegion}
                selectedDistance={selectedDistance}
                selectedMonth={selectedMonth}
                selectedTags={selectedTags}
                showOnlyOpen={showOnlyOpen}
                showOnlyCertified={showOnlyCertified}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAll}
                totalResults={filteredRaces.length}
            />
            <div className="container mx-auto px-4 py-8" ref={listRef}>
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">大会カレンダー</h2>
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
                        <ViewToggle currentQueryString={currentQueryString} />
                    </div>
                </div>

                <CalendarRaceList filteredRaces={filteredRaces} />
            </div>
        </>
    );
}
