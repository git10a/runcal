import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <Image
                        src="/runcalefull.png"
                        alt="RUNCALE Logo"
                        width={220}
                        height={144}
                        className="h-12 w-auto group-hover:scale-105 transition-transform object-contain"
                        priority
                    />
                </Link>
                <nav className="flex items-center gap-4">
                    <Link href="/favorites" className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 px-4 py-2 rounded-full">
                        <Heart size={18} />
                        <span className="hidden sm:inline-block">お気に入り</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
