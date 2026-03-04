"use client";

import { useMemo } from 'react';
import { Ruler, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistanceFilterProps {
    distances: string[];
    selectedDistance: string | null;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: string | null) => void;
}

const DISTANCE_OPTIONS = [
    { label: '5km', value: '5km' },
    { label: '10km', value: '10km' },
    { label: 'ハーフ', value: 'ハーフ' },
    { label: '30km', value: '30km' },
    { label: 'フル', value: 'フル' },
    { label: 'ウルトラ', value: 'ウルトラ' },
    { label: 'リレー', value: 'リレー' },
    { label: 'トレイル', value: 'トレイル' },
    { label: 'その他', value: 'その他' }
];

export default function DistanceFilter({ distances, selectedDistance, isOpen, onToggle, onSelect }: DistanceFilterProps) {
    // Filter out distances not present in the passed distances array
    const availableDistances = useMemo(() => {
        return DISTANCE_OPTIONS.filter(item =>
            distances.includes(item.value) ||
            distances.some(d => d.includes(item.value))
        );
    }, [distances]);

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                    selectedDistance || isOpen
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-card border-border/80 text-foreground hover:bg-muted"
                )}
            >
                <Ruler size={14} />
                <span>{selectedDistance || '種目'}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-70", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 sm:w-80 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onSelect(null)}
                            className={cn("px-4 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer w-full text-left", selectedDistance === null ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                        >
                            すべて
                        </button>

                        <div className="flex flex-wrap gap-2">
                            {availableDistances.map(dist => (
                                <button
                                    key={dist.value}
                                    onClick={() => onSelect(dist.value)}
                                    className={cn("px-3 py-1.5 text-sm rounded-xl font-medium transition-colors cursor-pointer", selectedDistance === dist.value ? "bg-primary text-primary-foreground shadow-sm font-bold" : "bg-muted/50 text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                >
                                    {dist.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
