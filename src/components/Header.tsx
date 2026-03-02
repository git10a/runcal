"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function Header() {
    const searchParams = useSearchParams();
    const baseQuery = searchParams.toString() ? `?${searchParams.toString()}` : '';

    return (
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href={`/${baseQuery}`} className="flex items-center gap-2 group mr-2">
                        <Image
                            src="/RunCalefullkatakana.png"
                            alt="RUNCALE Logo"
                            width={220}
                            height={144}
                            className="h-10 sm:h-12 w-auto group-hover:scale-105 transition-transform object-contain"
                            priority
                        />
                    </Link>
                </div>

                <nav className="flex items-center gap-2 sm:gap-4">
                    <Link href="/favorites" className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 px-3 sm:px-4 py-2 rounded-full">
                        <Image src="/thinking_face_3d.png" alt="🤔" width={20} height={20} />
                        <span className="hidden sm:inline-block">出るかもリスト</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
