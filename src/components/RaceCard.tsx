import { Race } from '@/lib/data';
import { Heart, MapPin, Calendar, Award, Footprints } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import CalendarButton from './CalendarButton';

interface RaceCardProps {
    race: Race;
}

export default function RaceCard({ race }: RaceCardProps) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(race.id);

    return (
        <div className="bg-card text-card-foreground rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group flex flex-col justify-between h-full ring-1 ring-border/50 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                        {race.is_jaaf_certified && (
                            <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary-hover mb-3">
                                <Award size={12} className="mr-1" />
                                陸連公認
                            </span>
                        )}
                        <h3 className="font-extrabold text-lg leading-snug line-clamp-2">
                            {race.name.split(/[（(]/)[0].trim()}
                        </h3>
                    </div>
                    <div className="flex gap-1">
                        <CalendarButton race={race} />
                        <button
                            onClick={() => toggleFavorite(race.id)}
                            className={`transition-colors p-2 rounded-full shrink-0 cursor-pointer ${isFav ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'}`}
                        >
                            <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground font-medium mt-4">
                    <div className="flex items-center">
                        <Calendar size={16} className="mr-2.5 text-primary" />
                        <span>{(() => {
                            const [year, month, day] = race.date.split('-');
                            return `${year}年${parseInt(month)}月${parseInt(day)}日`;
                        })()} 開催</span>
                    </div>
                    <div className="flex items-center">
                        <MapPin size={16} className="mr-2.5 text-primary" />
                        <span>{race.prefecture}{race.city && ` ${race.city}`}</span>
                    </div>
                    <div className="flex items-start">
                        <Footprints size={16} className="mr-2.5 mt-0.5 text-primary" />
                        <div className="flex gap-2 flex-wrap">
                            {race.distance.map(d => (
                                <span key={d} className="bg-muted text-foreground px-2.5 py-1 rounded-md text-xs font-bold">
                                    {d}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-muted/40 flex justify-between items-center mt-auto">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${race.entry_status === '受付中' ? 'text-white bg-primary shadow-sm' :
                    race.entry_status === '受付終了' ? 'text-muted-foreground bg-muted-foreground/10' :
                        'text-orange-700 bg-orange-100/50'
                    }`}>
                    {race.entry_status === '受付中' ? '🎌 受付中' :
                        race.entry_status === '受付終了' ? '🔒 受付終了' :
                            '⏳ エントリー前'}
                </span>
                <a
                    href={race.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-primary-hover hover:text-primary transition-colors flex items-center pr-1"
                >
                    公式サイト
                    <span className="text-[10px] ml-1.5 opacity-80">↗</span>
                </a>
            </div>
        </div>
    );
}
