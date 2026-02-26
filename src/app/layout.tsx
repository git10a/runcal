import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'ランカレ | 日本のマラソン大会・ハーフマラソン日程カレンダー',
    template: '%s | ランカレ',
  },
  description: '日本全国のマラソン大会・ハーフマラソンの日程一覧。地域、距離、陸連公認の有無で簡単検索。フルマラソン、ハーフマラソン、ウルトラマラソンなど、走りたい大会がすぐに見つかるカレンダーサイト。',
  keywords: ['マラソン大会', '日程', 'ハーフマラソン', 'カレンダー', '日本', 'マラソン大会一覧', 'フルマラソン', 'ウルトラマラソン', '陸連公認'],
  openGraph: {
    title: 'ランカレ | 日本のマラソン大会・ハーフマラソン日程カレンダー',
    description: '日本全国のマラソン大会・ハーフマラソンの日程一覧。走りたい大会がすぐに見つかる。',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/runcalfull.png',
        width: 1200,
        height: 630,
        alt: 'ランカレ OGP Image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ランカレ | マラソン大会日程カレンダー',
    description: '日本全国のマラソン大会・ハーフマラソンの日程一覧。走りたい大会がすぐに見つかる。',
    images: ['/runcalfull.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1 bg-muted/20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
