import { getAllRaces, getUniquePrefectures, getUniqueDistances } from '@/lib/data';
import CalendarView from './CalendarView';

export default function CalendarPage() {
    const races = getAllRaces();
    const prefectures = getUniquePrefectures();
    const distances = getUniqueDistances();

    return (
        <div className="flex flex-col min-h-full">
            <section className="bg-background pt-10 pb-6">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
                        走りたいマラソン大会が<br className="md:hidden" /><span className="text-primary tracking-normal">すぐ</span>に見つかる
                    </h1>
                </div>
            </section>

            <div className="flex-1 pb-20">
                <CalendarView
                    initialRaces={races}
                    prefectures={prefectures}
                    distances={distances}
                />
            </div>
        </div>
    );
}
