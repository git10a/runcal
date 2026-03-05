import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search, LayoutGrid, Heart, Globe, MapPin, UtensilsCrossed } from 'lucide-react';

export const metadata: Metadata = {
    title: 'ランカレについて',
    description: 'ランカレは日本全国のマラソン大会・ランニングイベントの日程を簡単に検索できるカレンダーサイトです。サイトの特徴や使い方を紹介します。',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card p-8 sm:p-12 rounded-3xl shadow-sm border border-border/50">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    トップページへ戻る
                </Link>

                <h1 className="text-3xl font-extrabold text-foreground mb-3">ランカレについて</h1>
                <p className="text-lg text-primary font-bold mb-8">走りたいマラソン大会がすぐに見つかる。</p>

                <div className="space-y-10 text-foreground/80 leading-loose">
                    <section>
                        <p>
                            <strong className="text-foreground">ランカレ</strong>は、日本全国のマラソン大会・ランニングイベントの日程を簡単に検索・比較できるカレンダーサイトです。
                        </p>
                        <p className="mt-3">
                            ランカレを作っているのは、月間200kmを走る市民ランナーです。自分自身がレースを探すとき、「もっと直感的に、もっと気持ちよく使えるサイトがあったらいいのに」とずっと感じていました。見やすいデザインで、スマホでもサクサク動いて、知りたい情報にすぐたどり着ける——そんな当たり前のことを、当たり前にできるサイトを目指して開発しています。
                        </p>
                        <p className="mt-3">
                            「次のレースを探したい」「自分の地域で開催される大会を知りたい」「エントリーが受付中の大会だけ見たい」。ランナーなら誰もが感じるこうしたニーズに、ストレスなく応えたい。それがランカレの出発点です。
                        </p>
                        <p className="mt-3">
                            レースの情報も、走る人の目線で選んでいます。コースがフラットで記録を狙いやすいか、沿道の応援が温かいか、制限時間に余裕があるか——大会名やスペックだけでは伝わらない、実際に走るランナーにとって本当に大事なポイントを大切にしています。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-5">ランカレの特徴</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                                <Search className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground text-sm mb-1">かんたん検索</p>
                                    <p className="text-sm">都道府県・距離・エントリー状況などで大会をすぐに絞り込み</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                                <LayoutGrid className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground text-sm mb-1">3つの表示モード</p>
                                    <p className="text-sm">カード表示・シート表示・カレンダー表示を自由に切り替え</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                                <Heart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground text-sm mb-1">出るかもリスト</p>
                                    <p className="text-sm">気になる大会を保存して、後から比較・検討</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                                <UtensilsCrossed className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground text-sm mb-1">大会+観光情報</p>
                                    <p className="text-sm">大会の評判はもちろん、ご当地グルメ・観光地・お土産情報も</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/30 sm:col-span-2">
                                <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground text-sm mb-1">全国700+大会を網羅</p>
                                    <p className="text-sm">北海道から沖縄まで、日本全国の大会情報を掲載</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">こだわり</h2>
                        <p>
                            ランカレには、ランナーだからこそのこだわりをいくつも詰め込んでいます。
                        </p>
                        <p className="mt-3">
                            たとえば「<strong className="text-foreground">出るかもリスト</strong>」。最初は「お気に入りリスト」にしようとしていました。でも、ランナーが大会を保存するときの気持ちって「お気に入り」とはちょっと違うんですよね。「出たくないな……でも出たいな……」という葛藤の中で、とりあえず頭に入れておいて、結局エントリーしちゃう。そんなリアルな感覚を表したくて、「出るかも」にしました。
                        </p>
                        <p className="mt-3">
                            各大会の<strong className="text-foreground">イメージ画像</strong>も、AIを活用してひとつひとつ描き起こしています。単なる装飾ではなく、その大会ならではの特徴や開催地域の観光資源、沿道の風景などを盛り込んでいます。マラソン大会は全国に数百以上あり、大会名だけでは自分に合ったレースを見つけるのは簡単ではありません。画像を一目見ただけで「この大会、気になる！」と思えるような体験を大切にしています。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">お問い合わせ</h2>
                        <p>
                            ランカレに関するご意見・ご要望・大会情報の修正依頼などがございましたら、お気軽にXまでご連絡ください。
                        </p>
                        <p className="mt-4">
                            <a
                                href="https://x.com/runcalcom"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-sm hover:opacity-80 transition-opacity"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                @runcalcom
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
