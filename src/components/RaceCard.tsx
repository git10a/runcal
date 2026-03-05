import { Race } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Award, Footprints } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import CalendarButton from './CalendarButton';
import { formatRaceDate, getEntryStatusInfo } from '@/lib/utils';

interface RaceCardProps {
    race: Race;
}

export default function RaceCard({ race }: RaceCardProps) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(race.id);
    const statusInfo = getEntryStatusInfo(race.entry_status);

    return (
        <div className="bg-card text-card-foreground rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group flex flex-col justify-between h-full ring-1 ring-border/50 overflow-hidden relative">
            <Link href={`/races/${race.id}`} className="flex p-4 gap-4 sm:gap-5 flex-1">
                {/* Image & Buttons Section */}
                <div className="w-24 sm:w-28 shrink-0 flex flex-col gap-2 relative">
                    <div className="w-full h-24 sm:h-28 relative overflow-hidden bg-muted/50 rounded-2xl">
                        {race.image_url ? (
                            <>
                                <Image
                                    src={race.image_url}
                                    alt={`${race.name}の画像`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="112px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                                <Footprints className="text-primary/20 w-10 h-10" />
                            </div>
                        )}

                        {race.is_jaaf_certified && (
                            <div className="absolute top-2 left-2 z-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm w-6 h-6 shadow-[0_2px_8px_rgb(0,0,0,0.12)] text-primary-hover pointer-events-none" title="陸連公認">
                                <Award size={14} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-extrabold text-base sm:text-lg leading-tight line-clamp-3">
                            {race.name}
                        </h3>
                    </div>

                    <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground font-medium mt-auto">
                        <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-primary/80 shrink-0" />
                            <span>{formatRaceDate(race.date)}</span>
                        </div>
                        <div className="flex items-center">
                            <MapPin size={14} className="mr-2 text-primary/80 shrink-0" />
                            <span className="truncate">{race.prefecture}{race.city && ` ${race.city}`}</span>
                        </div>
                        <div className="flex items-start">
                            <Footprints size={14} className="mr-2 mt-0.5 text-primary/80 shrink-0" />
                            <div className="flex gap-1.5 flex-wrap">
                                {race.distance.map(d => (
                                    <span key={d} className="bg-muted text-foreground px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold leading-none">
                                        {d}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="px-5 py-3 bg-muted/20 flex justify-between items-center mt-auto border-t border-border/40">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 ${statusInfo.className}`}>
                    {statusInfo.label}
                </span>

                <div className="flex gap-1 justify-center items-center flex-1 mx-2">
                    <CalendarButton race={race} />
                    <button
                        onClick={() => toggleFavorite(race.id)}
                        className={`transition-all p-2 rounded-full shrink-0 cursor-pointer flex items-center justify-center ${isFav ? 'bg-orange-50 hover:bg-orange-100 ring-1 ring-orange-200' : 'hover:bg-muted'}`}
                        aria-label="出るかもリスト"
                        title="出るかもリスト"
                    >
                        <Image
                            src="/thinking_face_3d.png"
                            alt="🤔"
                            width={20}
                            height={20}
                            className={`transition-all duration-300 ${isFav ? 'grayscale-0 opacity-100 scale-110' : 'grayscale opacity-40 group-hover:opacity-70 group-hover:grayscale-[0.5]'}`}
                        />
                    </button>
                </div>
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
