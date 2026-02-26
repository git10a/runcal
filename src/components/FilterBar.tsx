"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check, X, MapPin, Ruler, Calendar, Info } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface FilterBarProps {
    prefectures: string[];
    distances: string[];
    selectedPrefecture: string | null;
    selectedDistance: string | null;
    selectedMonth: string | null;
    showOnlyOpen: boolean;
    showOnlyCertified: boolean;
    onFilterChange: (type: 'prefecture' | 'distance' | 'month' | 'onlyOpen' | 'onlyCertified', value: any) => void;
    onClearAll: () => void;
    totalResults: number;
}

export default function FilterBar({
    prefectures,
    distances,
    selectedPrefecture,
    selectedDistance,
    selectedMonth,
    showOnlyOpen,
    showOnlyCertified,
    onFilterChange,
    onClearAll,
    totalResults
}: FilterBarProps) {
    const [openDropdown, setOpenDropdown] = useState<'prefecture' | 'distance' | 'month' | null>(null);
    const [showCertifiedTooltip, setShowCertifiedTooltip] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Generate months for the next 12 months
    const monthOptions = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
            months.push({ value, label });
        }
        return months;
    }, []);

    // Check if any filter is active
    const hasActiveFilters = useMemo(() => {
        return selectedPrefecture !== null ||
            selectedDistance !== null ||
            selectedMonth !== null ||
            showOnlyOpen ||
            showOnlyCertified;
    }, [selectedPrefecture, selectedDistance, selectedMonth, showOnlyOpen, showOnlyCertified]);

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
                <div className="flex flex-wrap items-center gap-2">
                    {/* Month Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setOpenDropdown(prev => prev === 'month' ? null : 'month')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                                selectedMonth || openDropdown === 'month'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                                    : "bg-card border-border/80 text-foreground hover:bg-muted"
                            )}
                        >
                            <Calendar size={14} />
                            <span>{selectedMonth ? monthOptions.find(m => m.value === selectedMonth)?.label : '開催月'}</span>
                            <ChevronDown size={14} className={cn("transition-transform opacity-70", openDropdown === 'month' && "rotate-180")} />
                        </button>

                        {openDropdown === 'month' && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 z-50 max-h-64 overflow-y-auto">
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => { onFilterChange('month', null); setOpenDropdown(null); }}
                                        className={cn("flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedMonth === null ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                    >
                                        <span>すべて</span>
                                        {selectedMonth === null && <Check size={16} />}
                                    </button>
                                    {monthOptions.map(month => (
                                        <button
                                            key={month.value}
                                            onClick={() => { onFilterChange('month', month.value); setOpenDropdown(null); }}
                                            className={cn("flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedMonth === month.value ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                        >
                                            <span>{month.label}</span>
                                            {selectedMonth === month.value && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Prefecture Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setOpenDropdown(prev => prev === 'prefecture' ? null : 'prefecture')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                                selectedPrefecture || openDropdown === 'prefecture'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                                    : "bg-card border-border/80 text-foreground hover:bg-muted"
                            )}
                        >
                            <MapPin size={14} />
                            <span>{selectedPrefecture || '都道府県'}</span>
                            <ChevronDown size={14} className={cn("transition-transform opacity-70", openDropdown === 'prefecture' && "rotate-180")} />
                        </button>

                        {openDropdown === 'prefecture' && (
                            <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[24rem] bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { onFilterChange('prefecture', null); setOpenDropdown(null); }}
                                        className={cn("px-3 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedPrefecture === null ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                    >
                                        すべて
                                    </button>
                                    {prefectures.map(pref => (
                                        <button
                                            key={pref}
                                            onClick={() => { onFilterChange('prefecture', pref); setOpenDropdown(null); }}
                                            className={cn("px-3 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedPrefecture === pref ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                        >
                                            {pref}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Distance Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setOpenDropdown(prev => prev === 'distance' ? null : 'distance')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                                selectedDistance || openDropdown === 'distance'
                                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                                    : "bg-card border-border/80 text-foreground hover:bg-muted"
                            )}
                        >
                            <Ruler size={14} />
                            <span>{selectedDistance || '種目'}</span>
                            <ChevronDown size={14} className={cn("transition-transform opacity-70", openDropdown === 'distance' && "rotate-180")} />
                        </button>

                        {openDropdown === 'distance' && (
                            <div className="absolute top-full left-0 mt-2 w-52 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 z-50">
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => { onFilterChange('distance', null); setOpenDropdown(null); }}
                                        className={cn("flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedDistance === null ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                    >
                                        <span>すべて</span>
                                        {selectedDistance === null && <Check size={16} />}
                                    </button>
                                    {distances.map(dist => (
                                        <button
                                            key={dist}
                                            onClick={() => { onFilterChange('distance', dist); setOpenDropdown(null); }}
                                            className={cn("flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedDistance === dist ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                        >
                                            <span>{dist}</span>
                                            {selectedDistance === dist && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

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
                            <div className="absolute top-full right-0 mt-2 w-72 bg-foreground text-background text-xs rounded-xl p-3 shadow-lg z-50">
                                <p className="font-bold mb-1">陸連公認とは？</p>
                                <p className="leading-relaxed">
                                    日本陸上競技連盟（JAAF）が正式に計測・認定したコースで開催される大会です。公認大会で出した記録は公式記録として認められ、陸連登録者のランキングに反映されます。
                                </p>
                                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-foreground rotate-45"></div>
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
