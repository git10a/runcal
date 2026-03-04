import { getAllRaces } from '@/lib/data';
import Link from 'next/link';

export default function Footer() {
    const races = getAllRaces();
    const lastUpdate = races.length > 0 ? races[0].updated_at : "";

    return (
        <footer className="py-12 mt-12 bg-muted/50 rounded-t-[3rem]">
            <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col items-center gap-2 md:items-start">
                        <span className="font-extrabold text-xl tracking-tight text-foreground">ランカレ</span>
                        <span className="text-sm font-medium text-muted-foreground mt-1 text-center md:text-left">
                            走りたいマラソン大会がすぐに見つかる。
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-4 text-xs font-semibold text-muted-foreground md:items-end">
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-foreground transition-colors">利用規約</Link>
                        <Link href="/privacy" className="hover:text-foreground transition-colors">プライバシーポリシー</Link>
                    </div>
                    {lastUpdate && (
                        <p>最終更新: {lastUpdate}</p>
                    )}
                </div>
            </div>
        </footer>
    );
}
