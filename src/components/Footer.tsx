import { getAllRaces } from '@/lib/data';

export default function Footer() {
    const races = getAllRaces();
    const lastUpdate = races.length > 0 ? races[0].updated_at : "";

    return (
        <footer className="py-12 mt-12 bg-muted/50 rounded-t-[3rem]">
            <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm font-bold text-muted-foreground md:text-left">
                        走りたいマラソン大会が3秒で見つかる。
                    </p>
                </div>
                {lastUpdate && (
                    <p className="text-xs font-bold text-muted-foreground">
                        最終更新: {lastUpdate}
                    </p>
                )}
            </div>
        </footer>
    );
}
