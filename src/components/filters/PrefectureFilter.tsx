"use client";

import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrefectureFilterProps {
    prefectures: string[];
    selectedPrefecture: string | null;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: string | null) => void;
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

export default function PrefectureFilter({ prefectures, selectedPrefecture, isOpen, onToggle, onSelect }: PrefectureFilterProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all border cursor-pointer",
                    selectedPrefecture || isOpen
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-card border-border/80 text-foreground hover:bg-muted"
                )}
            >
                <MapPin size={14} />
                <span>{selectedPrefecture || '都道府県'}</span>
                <ChevronDown size={14} className={cn("transition-transform opacity-70", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[24rem] bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onSelect(null)}
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
                                                    onClick={() => onSelect(pref)}
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
