"use client";

import { useState, useRef, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface FilterBarProps {
    prefectures: string[];
    distances: string[];
    selectedPrefecture: string | null;
    selectedDistance: string | null;
    selectedEntryStatus: string | null;
    selectedCertified: boolean | null;
    onFilterChange: (type: 'prefecture' | 'distance' | 'entryStatus' | 'certified', value: any) => void;
}

export default function FilterBar({
    prefectures,
    distances,
    selectedPrefecture,
    selectedDistance,
    selectedEntryStatus,
    selectedCertified,
    onFilterChange
}: FilterBarProps) {
    const [openDropdown, setOpenDropdown] = useState<'prefecture' | 'distance' | 'entryStatus' | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const entryStatuses = ['受付中', 'エントリー前', '受付終了'];

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
        <div ref={filterRef} className="bg-background/95 backdrop-blur-sm sticky top-16 z-40 py-3 mb-2">
            <div className="container mx-auto px-4 flex items-center gap-3 relative z-50">

                {/* Prefecture Dropdown */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setOpenDropdown(prev => prev === 'prefecture' ? null : 'prefecture')}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                            selectedPrefecture || openDropdown === 'prefecture'
                                ? "bg-primary border-primary text-primary-foreground shadow-md"
                                : "bg-card border-border/80 text-foreground hover:bg-muted"
                        )}
                    >
                        地域: {selectedPrefecture || 'すべて'}
                        <ChevronDown size={16} className={cn("transition-transform text-current opacity-70", openDropdown === 'prefecture' && "rotate-180")} />
                    </button>

                    {openDropdown === 'prefecture' && (
                        <div className="absolute top-full left-0 mt-3 w-[calc(100vw-2rem)] sm:w-[22rem] bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => { onFilterChange('prefecture', null); setOpenDropdown(null); }}
                                    className={cn("px-4 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedPrefecture === null ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                >
                                    すべて
                                </button>
                                {prefectures.map(pref => (
                                    <button
                                        key={pref}
                                        onClick={() => { onFilterChange('prefecture', pref); setOpenDropdown(null); }}
                                        className={cn("px-4 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedPrefecture === pref ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                    >
                                        {pref}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Distance Dropdown */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setOpenDropdown(prev => prev === 'distance' ? null : 'distance')}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                            selectedDistance || openDropdown === 'distance'
                                ? "bg-primary border-primary text-primary-foreground shadow-md"
                                : "bg-card border-border/80 text-foreground hover:bg-muted"
                        )}
                    >
                        種目: {selectedDistance || 'すべて'}
                        <ChevronDown size={16} className={cn("transition-transform text-current opacity-70", openDropdown === 'distance' && "rotate-180")} />
                    </button>

                    {openDropdown === 'distance' && (
                        <div className="absolute top-full left-0 mt-3 w-64 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 z-50">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => { onFilterChange('distance', null); setOpenDropdown(null); }}
                                    className={cn("flex items-center justify-between px-4 py-3 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedDistance === null ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                >
                                    <span>すべて</span>
                                    {selectedDistance === null && <Check size={18} />}
                                </button>
                                {distances.map(dist => (
                                    <button
                                        key={dist}
                                        onClick={() => { onFilterChange('distance', dist); setOpenDropdown(null); }}
                                        className={cn("flex items-center justify-between px-4 py-3 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedDistance === dist ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                    >
                                        <span>{dist}</span>
                                        {selectedDistance === dist && <Check size={18} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Entry Status Dropdown */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setOpenDropdown(prev => prev === 'entryStatus' ? null : 'entryStatus')}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                            selectedEntryStatus || openDropdown === 'entryStatus'
                                ? "bg-primary border-primary text-primary-foreground shadow-md"
                                : "bg-card border-border/80 text-foreground hover:bg-muted"
                        )}
                    >
                        状況: {selectedEntryStatus || 'すべて'}
                        <ChevronDown size={16} className={cn("transition-transform text-current opacity-70", openDropdown === 'entryStatus' && "rotate-180")} />
                    </button>

                    {openDropdown === 'entryStatus' && (
                        <div className="absolute top-full left-0 mt-3 w-48 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 z-50">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => { onFilterChange('entryStatus', null); setOpenDropdown(null); }}
                                    className={cn("flex items-center justify-between px-4 py-3 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedEntryStatus === null ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                >
                                    <span>すべて</span>
                                    {selectedEntryStatus === null && <Check size={18} />}
                                </button>
                                {entryStatuses.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => { onFilterChange('entryStatus', status); setOpenDropdown(null); }}
                                        className={cn("flex items-center justify-between px-4 py-3 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedEntryStatus === status ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                                    >
                                        <span>{status}</span>
                                        {selectedEntryStatus === status && <Check size={18} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Certified Match toggle */}
                <div className="flex-shrink-0 ml-auto sm:ml-2">
                    <button
                        onClick={() => onFilterChange('certified', selectedCertified ? null : true)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
                            selectedCertified
                                ? "bg-primary text-primary-foreground shadow-md border-primary"
                                : "bg-transparent border-transparent text-muted-foreground hover:bg-muted"
                        )}
                    >
                        公認のみ
                        {selectedCertified && <Check size={14} className="text-primary-foreground" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
