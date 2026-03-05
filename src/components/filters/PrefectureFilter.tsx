"use client";

import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/lib/data';

interface PrefectureFilterProps {
    prefectures: string[];
    selectedPrefecture: string | null;
    selectedRegion: string | null;
    isOpen: boolean;
    onToggle: () => void;
    onSelectPrefecture: (value: string | null) => void;
    onSelectRegion: (value: string | null) => void;
}

export default function PrefectureFilter({ prefectures, selectedPrefecture, selectedRegion, isOpen, onToggle, onSelectPrefecture, onSelectRegion }: PrefectureFilterProps) {
    return (
        <div className="static sm:relative">
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                    selectedPrefecture || selectedRegion || isOpen
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-card border-border/80 text-foreground hover:bg-muted"
                )}
            >
                <MapPin size={14} />
                <span>{selectedPrefecture || selectedRegion || '開催地'}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-70", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-[24rem] bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { onSelectPrefecture(null); onSelectRegion(null); }}
                            className={cn("px-4 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer w-full text-left mb-2", !selectedPrefecture && !selectedRegion ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                        >
                            すべて
                        </button>

                        {/* 地方で絞り込み（北海道・東北、関東など） */}
                        <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-border/60">
                            {REGIONS.map(region => {
                                const availablePrefs = region.prefs.filter(p => prefectures.includes(p));
                                if (availablePrefs.length === 0) return null;
                                const isRegionSelected = selectedRegion === region.name;

                                return (
                                    <button
                                        key={region.name}
                                        onClick={() => onSelectRegion(isRegionSelected ? null : region.name)}
                                        className={cn("px-3 py-1.5 text-sm rounded-xl font-medium transition-colors cursor-pointer", isRegionSelected ? "bg-primary text-primary-foreground shadow-sm font-bold" : "bg-muted/50 text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                    >
                                        {region.name}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 都道府県で絞り込み */}
                        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto overscroll-contain pr-2">
                            <div className="text-xs font-bold text-muted-foreground">都道府県</div>
                            {REGIONS.map(region => {
                                const availablePrefs = region.prefs.filter(p => prefectures.includes(p));
                                if (availablePrefs.length === 0) return null;

                                return (
                                    <div key={region.name} className="flex flex-col gap-2">
                                        <div className="text-xs font-bold text-muted-foreground border-b pb-1">
                                            {region.name}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {availablePrefs.map(pref => (
                                                <button
                                                    key={pref}
                                                    onClick={() => onSelectPrefecture(pref)}
                                                    className={cn("px-3 py-1.5 text-sm rounded-xl font-medium transition-colors cursor-pointer", selectedPrefecture === pref ? "bg-primary text-primary-foreground shadow-sm font-bold" : "bg-muted/50 text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                                >
                                                    {pref}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
