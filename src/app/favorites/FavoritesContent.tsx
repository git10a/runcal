"use client";

import { useFavorites } from '@/hooks/useFavorites';
import { getAllRaces } from '@/lib/data';
import RaceCard from '@/components/RaceCard';
import Link from 'next/link';
import Image from 'next/image';

export default function FavoritesContent() {
    const { favorites, isLoaded } = useFavorites();
    const allRaces = getAllRaces();

    const favoriteRaces = allRaces.filter(race => favorites.includes(race.id));

    return (
        <div className="container mx-auto px-4 py-12 pb-24">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                    <Image src="/thinking_face_3d.png" alt="🤔" width={32} height={32} />
                    出るかもリスト
                </h1>
                <p className="text-muted-foreground">出走を検討している大会のリストです。気になった大会はとりあえずストックしておきましょう！</p>
            </div>

            {!isLoaded ? (
                <div className="text-center py-20 bg-card rounded-3xl ring-1 ring-border/50">
                    <p className="text-muted-foreground font-bold animate-pulse">読み込み中...</p>
                </div>
            ) : favoriteRaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteRaces.map(race => (
                        <RaceCard key={race.id} race={race} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-card rounded-3xl ring-1 ring-border/50 shadow-sm flex flex-col items-center justify-center">
                    <div className="mb-4">
                        <Image src="/thinking_face_3d.png" alt="🤔" width={64} height={64} className="opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">候補の大会がありません</h3>
                    <p className="text-muted-foreground text-sm font-medium mb-8">
                        気になる大会を見つけて、リストに追加しましょう。
                    </p>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm"
                    >
                        大会を探す
                    </Link>
                </div>
            )}
        </div>
    );
}
