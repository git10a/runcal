import type { Metadata } from 'next';
import FavoritesContent from './FavoritesContent';

export const metadata: Metadata = {
    title: 'お気に入りのマラソン大会',
    description: 'お気に入りに登録したマラソン大会・ハーフマラソンの一覧。気になる大会を保存して、後から簡単にチェックできます。',
};

export default function FavoritesPage() {
    return <FavoritesContent />;
}
