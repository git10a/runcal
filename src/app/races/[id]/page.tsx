import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Award, Footprints, Clock, ChevronLeft, ExternalLink, Store, Video, Navigation, Map, Tag } from 'lucide-react';
import racesData from '../../../../data/races.json';
import raceDetailsData from '../../../../data/race_details.json';
import { Race } from '@/types';
import { formatRaceDate, getEntryStatusInfo, normalizeRaceName } from '@/lib/utils';
import CalendarButton from '@/components/CalendarButton';
import FavoriteButton from './FavoriteButton';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
    return (racesData as Race[]).map((race) => ({
        id: race.id,
    }));
}

export default async function RaceDetailPage({ params }: PageProps) {
    const { id } = await params;

    // Find race from JSON
    const race = (racesData as Race[]).find((r) => r.id === id);

    if (!race) {
        notFound();
    }

    const statusInfo = getEntryStatusInfo(race.entry_status);

    // Fetch AI generated content if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let testData: any = null;
    try {
        const normalizedName = normalizeRaceName(race.name);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((raceDetailsData as any)[normalizedName]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            testData = (raceDetailsData as any)[normalizedName];
        }
    } catch (e) { console.error("Could not load race details", e); }

    const overview = testData ? testData.overview : "この大会の詳しい紹介文は現在準備中です。";
    const courseDetails = testData ? testData.course?.details : "コースの特徴は現在準備中です。";
    const timeLimitDetails = testData?.race_details?.time_limit || race.time_limit;

    // Tourism Spots
    const tSpots = testData?.tourism?.spots || [];
    const tGourmet = testData?.tourism?.local_gourmet || [];
    const tOmiyage = testData?.tourism?.omiyage || [];
    return (
        <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ChevronLeft size={16} className="mr-1" />
                    一覧に戻る
                </Link>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">

                    {/* Left Column (Main Content) */}
                    <div className="space-y-8">
                        {/* Header & Image */}
                        <div className="space-y-6">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
                                {race.name}
                            </h1>

                            <div className="w-full relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] overflow-hidden bg-muted/50 rounded-2xl md:rounded-3xl shadow-sm border border-border/50">
                                {race.image_url ? (
                                    <Image
                                        src={race.image_url}
                                        alt={`${race.name}の画像`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                                        <Footprints className="text-primary/20 w-16 h-16 sm:w-20 sm:h-20" />
                                    </div>
                                )}
                                {race.is_jaaf_certified && (
                                    <div className="absolute top-4 left-4 z-10 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md w-10 h-10 shadow-md text-primary-hover" title="陸連公認">
                                        <Award size={20} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border/50 space-y-8">
                            {testData && testData.one_line_summary && (
                                <div className="flex items-center gap-4 sm:gap-6 pt-2 pb-4">
                                    <div className="shrink-0 relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 drop-shadow-sm hover:scale-105 transition-transform duration-300 transform -rotate-12 z-20">
                                        <Image
                                            src="/images/megaphone_3d.png"
                                            alt="📣"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-primary-hover dark:text-primary text-base sm:text-lg lg:text-xl leading-loose">
                                            {testData.one_line_summary}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <section>
                                <h2 className="text-xl font-bold border-b border-border/60 pb-3 mb-4 flex items-center">
                                    大会の概要
                                </h2>
                                <div className="text-foreground/90 text-sm sm:text-base leading-loose whitespace-pre-wrap">
                                    {overview}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold border-b border-border/60 pb-3 mb-4 flex items-center">
                                    コースの特徴
                                </h2>
                                <div className="text-foreground/90 text-sm sm:text-base leading-loose whitespace-pre-wrap">
                                    {courseDetails}
                                </div>
                            </section>

                            {testData && testData.runner_review && (
                                <section>
                                    <h2 className="text-xl font-bold border-b border-border/60 pb-3 mb-4 flex items-center">
                                        ランナーの評判
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-bold text-green-600 mb-2">良い点</h3>
                                            <ul className="list-disc pl-5 text-foreground/90 text-sm sm:text-base space-y-2 leading-loose">
                                                {testData.runner_review.good_points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                        {testData.runner_review.watch_out && testData.runner_review.watch_out.length > 0 && (
                                            <div>
                                                <h3 className="font-bold text-amber-600 mb-2">注意点</h3>
                                                <ul className="list-disc pl-5 text-foreground/90 text-sm sm:text-base space-y-2 leading-loose">
                                                    {testData.runner_review.watch_out.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="mt-2 text-sm text-foreground/90 bg-muted/50 p-3 rounded-lg border border-border/40">
                                            <strong>おすすめランナー像: </strong> {testData.runner_review.recommended_for}
                                        </div>
                                    </div>
                                </section>
                            )}


                            <section>
                                <h2 className="text-xl font-bold border-b border-border/60 pb-3 mb-4 flex items-center">
                                    近くの観光地・おすすめスポット
                                </h2>
                                <div className="text-foreground/90 text-sm sm:text-base leading-loose space-y-4">
                                    {tSpots.length > 0 ? tSpots.map((s: { name: string, description: string }, i: number) => (
                                        <div key={i} className="border-l-2 border-primary/40 pl-3">
                                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                                <p className="font-bold text-foreground">{s.name}</p>
                                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`} target="_blank" rel="noopener noreferrer" title="Google Mapで見る" className="inline-flex items-center opacity-60 hover:opacity-100 transition-opacity">
                                                    <img src="/images/google_maps_pin.png" alt="Google Map" width={16} height={16} />
                                                </a>
                                            </div>
                                            <p className="text-sm mt-1">{s.description}</p>
                                        </div>
                                    )) : <p>観光情報はありません。</p>}
                                </div>
                            </section>

                            {tGourmet.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold border-b border-border/60 pb-3 mb-4 flex items-center">
                                        ご当地グルメ
                                    </h2>
                                    <div className="text-foreground/90 text-sm sm:text-base leading-loose space-y-3">
                                        {tGourmet.map((g: { name: string, description: string, famous_store?: string }, i: number) => (
                                            <div key={i} className="bg-muted/30 p-4 rounded-lg border border-border/30">
                                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                                    <p className="font-bold text-foreground text-lg leading-normal">{g.name}</p>
                                                </div>
                                                <p className="text-sm mb-3">{g.description}</p>
                                                {g.famous_store && (() => {
                                                    const storeName = g.famous_store.split(/[、，]/)[0].replace(/[（(][^）)]*[）)]/g, '').trim();
                                                    return (
                                                        <div className="flex items-center flex-wrap gap-2 text-sm mt-1">
                                                            <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">有名なお店</span>
                                                            <span className="font-medium text-foreground">{storeName}</span>
                                                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName)}`} target="_blank" rel="noopener noreferrer" title="Google Mapで見る" className="inline-flex items-center opacity-60 hover:opacity-100 transition-opacity">
                                                                <img src="/images/google_maps_pin.png" alt="Google Map" width={16} height={16} />
                                                            </a>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {tOmiyage.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold border-b border-border/60 pb-3 mb-4 flex items-center">
                                        おすすめお土産
                                    </h2>
                                    <div className="text-foreground/90 text-sm sm:text-base leading-loose space-y-3">
                                        {tOmiyage.map((o: { name: string, description: string }, i: number) => (
                                            <div key={i} className="bg-muted/30 p-4 rounded-lg border border-border/30">
                                                <p className="font-bold text-foreground leading-normal mb-1">{o.name}</p>
                                                <p className="text-sm mt-1">{o.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Sidebar / Sticky on PC) */}
                    <div className="lg:sticky lg:top-24 flex flex-col gap-4">
                        <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
                            {/* Status Header */}
                            <div className="p-5 bg-muted/10 border-b border-border/40 flex justify-between items-center">
                                <span className="font-bold text-foreground">エントリー状況</span>
                                <span className={`text-[13px] font-bold px-3 py-1.5 rounded-md ${statusInfo.className}`}>
                                    {statusInfo.label}
                                </span>
                            </div>

                            {/* Summary Details */}
                            <div className="p-6 space-y-6">
                                <ul className="space-y-4 text-sm font-medium">
                                    <li className="flex items-center">
                                        <Calendar className="w-5 h-5 mr-3 text-primary/80 shrink-0" />
                                        <div className="flex-1">
                                            <span className="text-foreground text-base">
                                                {formatRaceDate(race.date)}
                                            </span>
                                        </div>
                                    </li>

                                    <li className="flex items-center">
                                        <MapPin className="w-5 h-5 mr-3 text-primary/80 shrink-0" />
                                        <div className="flex-1">
                                            <span className="text-foreground">
                                                {race.prefecture}{race.city && ` ${race.city}`}
                                            </span>
                                        </div>
                                    </li>

                                    {testData?.race_details?.venue && (
                                        <li className="flex items-start">
                                            <Navigation className="w-5 h-5 mr-3 text-primary/80 shrink-0 mt-1" />
                                            <div className="flex-1">
                                                <div className="text-foreground text-sm leading-relaxed mb-2">
                                                    {testData.race_details.venue}
                                                </div>
                                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(testData.race_details.venue)}`} target="_blank" rel="noopener noreferrer" title="Google Mapで見る" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                                                    <img src="/images/google_maps_pin.png" alt="Google Map" width={16} height={16} />
                                                    マップを見る
                                                </a>
                                            </div>
                                        </li>
                                    )}

                                    {testData?.race_details?.course_map_url && (
                                        <li className="flex items-center">
                                            <Map className="w-5 h-5 mr-3 text-primary/80 shrink-0" />
                                            <div className="flex-1">
                                                <a href={testData.race_details.course_map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-hover hover:underline transition-colors group">
                                                    公式コースマップを見る
                                                    <ExternalLink size={14} className="ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            </div>
                                        </li>
                                    )}

                                    <li className="flex items-start">
                                        <Footprints className="w-5 h-5 mr-3 text-primary/80 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {race.distance.map((d) => (
                                                    <span key={d} className="bg-muted text-foreground px-2.5 py-1 rounded text-xs font-bold">
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </li>

                                    {race.tags && race.tags.length > 0 && (
                                        <li className="flex items-start">
                                            <Tag className="w-5 h-5 mr-3 text-primary/80 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {race.tags.map((t) => {
                                                        const textWithoutEmoji = t.replace(/^.*? /, '');
                                                        return (
                                                            <span key={t} className="bg-muted text-foreground px-2.5 py-1 rounded text-xs font-bold">
                                                                {textWithoutEmoji}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </li>
                                    )}

                                    {timeLimitDetails && (
                                        <li className="flex items-center">
                                            <Clock className="w-5 h-5 mr-3 text-primary/80 shrink-0" />
                                            <div className="flex-1">
                                                <span className="text-foreground">
                                                    {timeLimitDetails}
                                                </span>
                                            </div>
                                        </li>
                                    )}
                                </ul>

                                <div className="pt-4 border-t border-border/40 space-y-3">
                                    <a
                                        href={race.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center p-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm gap-2"
                                    >
                                        公式サイトを確認する
                                        <ExternalLink size={16} />
                                    </a>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center justify-center h-12 bg-card rounded-xl hover:bg-muted/80 transition-colors border border-border/60 shadow-sm">
                                            <CalendarButton race={race} />
                                        </div>
                                        <div className="flex items-center justify-center h-12 bg-card rounded-xl hover:bg-muted/80 transition-colors border border-border/60 shadow-sm">
                                            <FavoriteButton raceId={race.id} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
