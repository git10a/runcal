"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterType } from '@/types';
import MonthFilter from './filters/MonthFilter';
import PrefectureFilter from './filters/PrefectureFilter';
import DistanceFilter from './filters/DistanceFilter';
import TagsFilter from './filters/TagsFilter';

interface FilterBarProps {
    prefectures: string[];
    distances: string[];
    selectedPrefecture: string | null;
    selectedRegion: string | null;
    selectedDistance: string | null;
    selectedMonth: string | null;
    selectedTags: string[];
    showOnlyOpen: boolean;
    showOnlyCertified: boolean;
    onFilterChange: (type: FilterType, value: string | string[] | boolean | null) => void;
    onClearAll: () => void;
    totalResults: number;
}

export default function FilterBar({
    prefectures,
    distances,
    selectedPrefecture,
    selectedRegion,
    selectedDistance,
    selectedMonth,
    selectedTags,
    showOnlyOpen,
    showOnlyCertified,
    onFilterChange,
    onClearAll,
    totalResults
}: FilterBarProps) {
    const [openDropdown, setOpenDropdown] = useState<'prefecture' | 'distance' | 'month' | 'tags' | null>(null);
    const [showCertifiedTooltip, setShowCertifiedTooltip] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Check if any filter is active
    const hasActiveFilters = useMemo(() => {
        return selectedPrefecture !== null ||
            selectedRegion !== null ||
            selectedDistance !== null ||
            selectedMonth !== null ||
            selectedTags.length > 0 ||
            showOnlyOpen === false ||
            showOnlyCertified;
    }, [selectedPrefecture, selectedRegion, selectedDistance, selectedMonth, selectedTags, showOnlyOpen, showOnlyCertified]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={filterRef} className="bg-background/95 backdrop-blur-sm sticky top-16 z-40 py-4 mb-2 border-b border-border/50">
            <div className="container mx-auto px-4">
                {/* Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2 relative">
                    <MonthFilter
                        selectedMonth={selectedMonth}
                        isOpen={openDropdown === 'month'}
                        onToggle={() => setOpenDropdown(prev => prev === 'month' ? null : 'month')}
                        onSelect={(val) => { onFilterChange('month', val); setOpenDropdown(null); }}
                    />

                    <PrefectureFilter
                        prefectures={prefectures}
                        selectedPrefecture={selectedPrefecture}
                        selectedRegion={selectedRegion}
                        isOpen={openDropdown === 'prefecture'}
                        onToggle={() => setOpenDropdown(prev => prev === 'prefecture' ? null : 'prefecture')}
                        onSelectPrefecture={(val) => { onFilterChange('prefecture', val); setOpenDropdown(null); }}
                        onSelectRegion={(val) => { onFilterChange('region', val); setOpenDropdown(null); }}
                    />

                    <DistanceFilter
                        distances={distances}
                        selectedDistance={selectedDistance}
                        isOpen={openDropdown === 'distance'}
                        onToggle={() => setOpenDropdown(prev => prev === 'distance' ? null : 'distance')}
                        onSelect={(val) => { onFilterChange('distance', val); setOpenDropdown(null); }}
                    />

                    <TagsFilter
                        selectedTags={selectedTags}
                        isOpen={openDropdown === 'tags'}
                        onToggle={() => setOpenDropdown(prev => prev === 'tags' ? null : 'tags')}
                        onSelect={(val) => {
                            if (val === null) {
                                onFilterChange('tags', []);
                            } else {
                                const newTags = selectedTags.includes(val)
                                    ? selectedTags.filter(t => t !== val)
                                    : [...selectedTags, val];
                                onFilterChange('tags', newTags);
                            }
                        }}
                    />

                    {/* Only Open Toggle */}
                    <button
                        onClick={() => onFilterChange('onlyOpen', !showOnlyOpen)}
                        className={cn(
                            "px-3 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
                            showOnlyOpen
                                ? "bg-primary text-primary-foreground shadow-md border-primary"
                                : "bg-card border-border/80 text-foreground hover:bg-muted"
                        )}
                    >
                        受付中
                        {showOnlyOpen && <Check size={14} />}
                    </button>

                    {/* Certified Toggle */}
                    <div className="relative flex items-center">
                        <button
                            onClick={() => onFilterChange('onlyCertified', !showOnlyCertified)}
                            className={cn(
                                "px-3 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
                                showOnlyCertified
                                    ? "bg-primary text-primary-foreground shadow-md border-primary"
                                    : "bg-card border-border/80 text-foreground hover:bg-muted"
                            )}
                        >
                            公認
                            {showOnlyCertified && <Check size={14} />}
                        </button>
                        {/* Info Icon */}
                        <button
                            className="absolute -top-1 -right-1 w-4 h-4 bg-muted-foreground/20 hover:bg-muted-foreground/30 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                            onMouseEnter={() => setShowCertifiedTooltip(true)}
                            onMouseLeave={() => setShowCertifiedTooltip(false)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCertifiedTooltip(!showCertifiedTooltip);
                            }}
                            aria-label="陸連公認について"
                        >
                            <Info size={10} className="text-muted-foreground" />
                        </button>
                        {/* Tooltip */}
                        {showCertifiedTooltip && (
                            <div className="absolute top-full -left-[75px] sm:left-auto sm:right-0 mt-2 w-[260px] sm:w-72 bg-foreground text-background text-xs rounded-xl p-3 shadow-lg z-50">
                                <p className="font-bold mb-1">陸連公認とは？</p>
                                <p className="leading-relaxed">
                                    日本陸上競技連盟（JAAF）が正式に計測・認定したコースで開催される大会です。公認大会で出した記録は公式記録として認められ、陸連登録者のランキングに反映されます。
                                </p>
                                <div className="absolute -top-1.5 left-[140px] sm:left-auto sm:right-4 w-3 h-3 bg-foreground rotate-45"></div>
                            </div>
                        )}
                    </div>

                    {/* Clear All Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={onClearAll}
                            className="ml-auto px-3 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <X size={14} />
                            クリア
                        </button>
                    )}
                </div>

                {/* Results Count */}
                <div className="mt-3 text-sm text-muted-foreground">
                    {totalResults}件の大会
                </div>
            </div>
        </div>
    );
}
