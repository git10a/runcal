"use client";

import { ClipboardCheck, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EntryStatusValue } from '@/types';

interface EntryStatusFilterProps {
    selectedStatus: EntryStatusValue | null;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: EntryStatusValue | null) => void;
}

const STATUS_OPTIONS: { label: string; value: EntryStatusValue }[] = [
    { label: 'エントリー前', value: 'エントリー前' },
    { label: '受付中', value: '受付中' },
    { label: '受付終了', value: '受付終了' },
];

export default function EntryStatusFilter({ selectedStatus, isOpen, onToggle, onSelect }: EntryStatusFilterProps) {
    return (
        <div className="static sm:relative">
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                    selectedStatus || isOpen
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-card border-border/80 text-foreground hover:bg-muted"
                )}
            >
                <ClipboardCheck size={14} />
                <span>{selectedStatus || '受付状況'}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-70", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-48 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 z-50">
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => onSelect(null)}
                            className={cn("flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedStatus === null ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                        >
                            <span>すべて</span>
                            {selectedStatus === null && <Check size={16} />}
                        </button>
                        {STATUS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => onSelect(opt.value)}
                                className={cn("flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-bold transition-colors cursor-pointer", selectedStatus === opt.value ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground")}
                            >
                                <span>{opt.label}</span>
                                {selectedStatus === opt.value && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
