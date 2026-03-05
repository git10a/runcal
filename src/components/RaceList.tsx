"use client";

import { useState, useRef } from 'react';
import { Race } from '@/types';
import RaceCard from './RaceCard';
import FilterBar from './FilterBar';
import ViewToggle from './ViewToggle';
import { useRaceFilters } from '@/hooks/useRaceFilters';

interface RaceListProps {
    initialRaces: Race[];
    prefectures: string[];
    distances: string[];
}

export default function RaceList({ initialRaces, prefectures, distances }: RaceListProps) {
    const {
        filteredRaces,
        selectedPrefecture,
        selectedDistance,
        selectedMonth,
        selectedTags,
        showOnlyOpen,
        showOnlyCertified,
        handleFilterChange,
        handleClearAll,
        currentQueryString
    } = useRaceFilters(initialRaces);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;
    const listRef = useRef<HTMLDivElement>(null);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const totalPages = Math.ceil(filteredRaces.length / ITEMS_PER_PAGE);
    const paginatedRaces = filteredRaces.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <>
            <FilterBar
                prefectures={prefectures}
                distances={distances}
                selectedPrefecture={selectedPrefecture}
                selectedDistance={selectedDistance}
                selectedMonth={selectedMonth}
                selectedTags={selectedTags}
                showOnlyOpen={showOnlyOpen}
                showOnlyCertified={showOnlyCertified}
                onFilterChange={(type, val) => {
                    handleFilterChange(type, val);
                    setCurrentPage(1);
                }}
                onClearAll={() => {
                    handleClearAll();
                    setCurrentPage(1);
                }}
                totalResults={filteredRaces.length}
            />
            <div className="container mx-auto px-4 py-8" ref={listRef}>
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
                        <ViewToggle currentQueryString={currentQueryString} />
                    </div>
                </div>

                {filteredRaces.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[600px] content-start">
                            {paginatedRaces.map(race => (
                                <RaceCard key={race.id} race={race} />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-12 gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-muted"
                                >
                                    前のページ
                                </button>
                                <span className="text-sm font-bold text-muted-foreground mx-4">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
                            onClick={handleClearAll}
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
