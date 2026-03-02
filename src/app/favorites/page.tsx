import type { Metadata } from 'next';
import FavoritesContent from './FavoritesContent';

export const metadata: Metadata = {
    title: '出るかもリスト',
    description: '出走を検討しているマラソン大会・ハーフマラソンの一覧。気になる大会を保存して、後から簡単にチェックできます。',
};

export default function FavoritesPage() {
    return <FavoritesContent />;
}
