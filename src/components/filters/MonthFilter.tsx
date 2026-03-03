"use client";

import { useMemo } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterType } from '@/types';

interface MonthFilterProps {
    selectedMonth: string | null;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: string | null) => void;
}

export default function MonthFilter({ selectedMonth, isOpen, onToggle, onSelect }: MonthFilterProps) {
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

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                    selectedMonth || isOpen
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-card border-border/80 text-foreground hover:bg-muted"
                )}
            >
                <Calendar size={14} />
                <span>{selectedMonth ? monthOptions.find(m => m.value === selectedMonth)?.label : '開催月'}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-70", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 z-50 max-h-64 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => onSelect(null)}
                            className={cn("flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedMonth === null ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                        >
                            <span>すべて</span>
                            {selectedMonth === null && <Check size={16} />}
                        </button>
                        {monthOptions.map(month => (
                            <button
                                key={month.value}
                                onClick={() => onSelect(month.value)}
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
    );
}
