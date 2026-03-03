"use client";

import { useState, useRef, useEffect } from 'react';
import { Race } from '@/types';
import FilterBar from '@/components/FilterBar';
import ViewToggle from '@/components/ViewToggle';
import TableRaceList from '@/components/TableRaceList';
import { useRaceFilters } from '@/hooks/useRaceFilters';

interface ListViewProps {
    initialRaces: Race[];
    prefectures: string[];
    distances: string[];
}

export default function ListView({ initialRaces, prefectures, distances }: ListViewProps) {
    const {
        filteredRaces,
        selectedPrefecture,
        selectedDistance,
        selectedMonth,
        showOnlyOpen,
        showOnlyCertified,
        handleFilterChange,
        handleClearAll,
        currentQueryString
    } = useRaceFilters(initialRaces);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 25; // More items per page since it's a tight list
    const listRef = useRef<HTMLDivElement>(null);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedPrefecture, selectedDistance, selectedMonth, showOnlyOpen, showOnlyCertified]);

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
                showOnlyOpen={showOnlyOpen}
                showOnlyCertified={showOnlyCertified}
                onFilterChange={(type, val) => {
                    handleFilterChange(type, val);
                }}
                onClearAll={() => {
                    handleClearAll();
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
                        <TableRaceList paginatedRaces={paginatedRaces} />

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
