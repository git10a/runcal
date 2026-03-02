"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check, X, MapPin, Ruler, Calendar, Info, PersonStanding } from 'lucide-react';

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

const REGIONS = [
    { name: '北海道・東北', prefs: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
    { name: '関東', prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
    { name: '中部', prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
    { name: '近畿', prefs: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
    { name: '中国', prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
    { name: '四国', prefs: ['徳島県', '香川県', '愛媛県', '高知県'] },
    { name: '九州・沖縄', prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] }
];

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

    // Filter out distances not present in the passed distances array (except 'すべて')
    const availableDistances = useMemo(() => {
        return DISTANCE_ORDER.filter(item =>
            item.value === null || distances.includes(item.value) ||
            // Also include if the item is "ウルトラ" and distances has "ウルトラ" or similar
            distances.some(d => d.includes(item.value as string))
        );
    }, [distances]);

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
                                        className={cn("px-4 py-2 text-sm rounded-xl font-bold transition-colors cursor-pointer w-full text-left mb-2", selectedPrefecture === null ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground hover:bg-primary/20 hover:text-primary-hover")}
                                    >
                                        すべて
                                    </button>

                                    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
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
                                                                onClick={() => { onFilterChange('prefecture', pref); setOpenDropdown(null); }}
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
                                                    onClick={() => {
                                                        onFilterChange('distance', dist.value);
                                                        // Optional: Close dropdown after selection
                                                        // setOpenDropdown(null); 
                                                    }}
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
                                                    onClick={() => onFilterChange('distance', dist.value)}
                                                >
                                                    {dist.label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setOpenDropdown(null)}
                                        className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-lg font-bold hover:bg-muted/80 transition-colors"
                                    >
                                        決定
                                    </button>
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
