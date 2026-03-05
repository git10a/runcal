"use client";

import { useMemo } from 'react';
import { Tag, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AVAILABLE_TAGS = [
    "🏆 タイムが狙いやすい",
    "⛰️ タフなコース",
    "🏞️ 景色が良い",
    "🔰 初心者向け",
    "🎉 お祭り・応援が熱い",
    "♨️ 観光・温泉が楽しめる"
];

interface TagsFilterProps {
    selectedTags: string[];
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: string | null) => void;
}

export default function TagsFilter({ selectedTags, isOpen, onToggle, onSelect }: TagsFilterProps) {
    const handleTagClick = (tag: string) => {
        onSelect(tag);
    };

    return (
        <div className="static sm:relative">
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                    selectedTags.length > 0 || isOpen
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-card border-border/80 text-foreground hover:bg-muted"
                )}
            >
                <Tag size={14} />
                <span>特徴・コース {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-70", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onSelect(null)}
                            className={cn(
                                "px-4 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer w-full text-left",
                                selectedTags.length === 0
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover"
                            )}
                        >
                            すべて
                        </button>

                        <div className="space-y-1">
                            {AVAILABLE_TAGS.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagClick(tag)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2.5 text-sm rounded-xl font-medium transition-colors cursor-pointer w-full text-left",
                                            isSelected
                                                ? "bg-primary/10 text-primary-hover font-bold shadow-sm"
                                                : "bg-transparent text-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        <span>{tag.replace(/^.*? /, '')}</span>
                                        {isSelected && <Check size={16} className="text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
