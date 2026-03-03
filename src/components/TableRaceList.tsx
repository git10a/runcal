import { Race } from '@/lib/data';
import Image from 'next/image';
import { useFavorites } from '@/hooks/useFavorites';

interface TableRaceListProps {
    paginatedRaces: Race[];
}

export default function TableRaceList({ paginatedRaces }: TableRaceListProps) {
    const { favorites, toggleFavorite, isLoaded } = useFavorites();

    return (
        <div className="overflow-x-auto bg-card rounded-2xl border border-border shadow-sm min-h-[600px]">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border whitespace-nowrap">
                    <tr>
                        <th className="px-4 py-3 min-w-[120px]">開催日</th>
                        <th className="px-4 py-3 min-w-[100px]">エントリ</th>
                        <th className="px-4 py-3 min-w-[200px]">大会名</th>
                        <th className="px-4 py-3 min-w-[140px]">開催地</th>
                        <th className="px-4 py-3 min-w-[100px] text-center">制限時間</th>
                        <th className="px-4 py-3 min-w-[80px]">公認</th>
                        <th className="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {paginatedRaces.map(race => {
                        const isFav = favorites.includes(race.id);
                        return (
                            <tr key={race.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                    {(() => {
                                        const [year, month, day] = race.date.split('-');
                                        return `${year}/${parseInt(month)}/${parseInt(day)}`;
                                    })()}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                    <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${race.entry_status === '受付中' ? 'text-white bg-primary shadow-sm' :
                                        race.entry_status === '受付終了' ? 'text-muted-foreground bg-muted-foreground/10' :
                                            race.entry_status === '不明' ? 'text-muted-foreground bg-muted/60' :
                                                'text-orange-700 bg-orange-100/50'
                                        }`}>
                                        {race.entry_status === '受付中' ? '🎌 受付中' :
                                            race.entry_status === '受付終了' ? '🔒 受付終了' :
                                                race.entry_status === '不明' ? '❓ 不明' :
                                                    '⏳ エントリー前'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 font-bold">
                                    <a href={race.url} target="_blank" rel="noopener noreferrer" className="flex items-center pr-1 line-clamp-1">
                                        {race.name}
                                    </a>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                                    {race.prefecture}{race.city && ` ${race.city}`}
                                </td>
                                <td className="px-4 py-3.5 text-center text-muted-foreground whitespace-nowrap">
                                    {race.time_limit || 'ー'}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                    {race.is_jaaf_certified && (
                                        <span className="text-[10px] font-bold text-primary-hover bg-primary/10 px-2.5 py-1 rounded-full">陸連公認</span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5">
                                    {isLoaded && (
                                        <button
                                            onClick={() => toggleFavorite(race.id)}
                                            className={`transition-all p-1.5 rounded-full shrink-0 cursor-pointer flex items-center justify-center ${isFav ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-muted'}`}
                                            title="出るかもリスト"
                                        >
                                            <Image
                                                src="/thinking_face_3d.png"
                                                alt="🤔"
                                                width={18}
                                                height={18}
                                                className={`transition-all duration-300 ${isFav ? 'grayscale-0 opacity-100' : 'grayscale opacity-40 hover:opacity-100 hover:grayscale-0'}`}
                                            />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
