'use client';

import { useFavorites } from '@/hooks/useFavorites';
import Image from 'next/image';

interface FavoriteButtonProps {
    raceId: string;
}

export default function FavoriteButton({ raceId }: FavoriteButtonProps) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(raceId);

    return (
        <button
            onClick={() => toggleFavorite(raceId)}
            className={`w-full h-full flex items-center justify-center gap-2 font-bold text-sm transition-all rounded-xl cursor-pointer ${isFav ? 'text-orange-600 bg-orange-50 ring-1 ring-orange-200' : 'text-foreground hover:bg-muted'}`}
            aria-label="出るかもリストに追加/削除"
        >
            <Image
                src="/thinking_face_3d.png"
                alt="🤔"
                width={20}
                height={20}
                className={`transition-all duration-300 ${isFav ? 'grayscale-0 opacity-100 scale-110' : 'grayscale opacity-60'}`}
            />
            出るかも
        </button>
    );
}
