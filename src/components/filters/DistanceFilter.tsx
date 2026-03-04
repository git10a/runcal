"use client";

import { useMemo } from 'react';
import { Ruler, ChevronDown, PersonStanding } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistanceFilterProps {
    distances: string[];
    selectedDistance: string | null;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: string | null) => void;
    onClose: () => void;
}

const DISTANCE_ORDER = [
    { label: 'すべて', value: null },
    { label: '5km', value: '5km' },
    { label: '10km', value: '10km' },
    { label: 'ハーフ', value: 'ハーフ' },
    { label: '30km', value: '30km' },
    { label: 'フル', value: 'フル' },
    { label: 'ウルトラ', value: 'ウルトラ' },
    { label: 'それ以上', value: 'その他' }
];

export default function DistanceFilter({ distances, selectedDistance, isOpen, onToggle, onSelect, onClose }: DistanceFilterProps) {
    // Filter out distances not present in the passed distances array (except 'すべて')
    const availableDistances = useMemo(() => {
        return DISTANCE_ORDER.filter(item =>
            item.value === null || distances.includes(item.value) ||
            // Also include if the item is "ウルトラ" and distances has "ウルトラ" or similar
            distances.some(d => d.includes(item.value as string))
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
                <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 z-50">
                    <div className="text-sm font-bold mb-8 text-center text-muted-foreground">
                        走りたい距離は？
                    </div>

                    {/* Custom Slider Track */}
                    <div className="relative w-full h-2 bg-muted rounded-full mb-8">
                        {/* Selected Track progress */}
                        <div
                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                            style={{
                                width: `${(Math.max(0, availableDistances.findIndex(d => d.value === selectedDistance)) / Math.max(1, availableDistances.length - 1)) * 100}%`
                            }}
                        />

                        {/* Runner Icon */}
                        <div
                            className="absolute top-1/2 -translate-y-[120%] -translate-x-1/2 transition-all duration-300 ease-in-out text-primary drop-shadow-md z-10"
                            style={{
                                left: `${(Math.max(0, availableDistances.findIndex(d => d.value === selectedDistance)) / Math.max(1, availableDistances.length - 1)) * 100}%`
                            }}
                        >
                            <div className="relative group">
                                <PersonStanding size={28} className="animate-pulse" />
                                {/* Tooltip showing current selection */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {availableDistances.find(d => d.value === selectedDistance)?.label || 'すべて'}
                                </div>
                            </div>
                        </div>

                        {/* Stops / Nodes */}
                        {availableDistances.map((dist, index) => {
                            const isSelected = selectedDistance === dist.value;
                            const position = (index / Math.max(1, availableDistances.length - 1)) * 100;

                            return (
                                <div key={dist.label || 'null'} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${position}%` }}>
                                    {/* Node button */}
                                    <button
                                        onClick={() => onSelect(dist.value)}
                                        className={cn(
                                            "w-4 h-4 rounded-full transition-all border-2 cursor-pointer z-0 hover:scale-125",
                                            isSelected
                                                ? "bg-primary border-primary ring-2 ring-primary/30"
                                                : "bg-card border-muted-foreground/30 hover:border-primary/50"
                                        )}
                                        aria-label={dist.label}
                                    />
                                    {/* Label below the node */}
                                    <div
                                        className={cn(
                                            "absolute top-5 text-[10px] whitespace-nowrap font-medium transition-colors cursor-pointer select-none",
                                            isSelected ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() => onSelect(dist.value)}
                                    >
                                        {dist.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={onClose}
                            className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-lg font-bold hover:bg-muted/80 transition-colors cursor-pointer"
                        >
                            決定
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
