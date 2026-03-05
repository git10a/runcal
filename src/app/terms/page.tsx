import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: '利用規約',
    description: 'ランカレの利用規約。サービスの利用条件について説明します。',
    robots: { index: false, follow: true },
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card p-8 sm:p-12 rounded-3xl shadow-sm border border-border/50">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    トップページへ戻る
                </Link>

                <h1 className="text-3xl font-extrabold text-foreground mb-8">利用規約</h1>

                <div className="space-y-8 text-foreground/80 leading-loose">
                    <section>
                        <p>
                            本利用規約（以下、「本規約」といいます。）は、本サービス「ランカレ」（以下、「本サービス」といいます。）の提供条件及び本サービスの利用者（以下、「ユーザー」といいます。）との間の権利義務関係を定めるものです。本サービスの利用に際しては、本規約の全文をお読みいただいたうえで、本規約に同意いただく必要があります。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">第1条（適用）</h2>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>本規約は、本サービスの提供条件及び本サービスの利用に関するユーザーとの間の権利義務関係を定めることを目的とし、ユーザーと本サービスとの間の本サービスの利用に関わる一切の関係に適用されます。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">第2条（禁止事項）</h2>
                        <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の各号のいずれかに該当する行為をしてはなりません。</p>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>法令に違反する行為または犯罪行為に関連する行為</li>
                            <li>本サービス、他のユーザー、またはその他の第三者に対する詐欺または脅迫行為</li>
                            <li>公序良俗に反する行為</li>
                            <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
                            <li>リバースエンジニアリングその他の解析行為</li>
                            <li>本サービスの運営を妨害するおそれのある行為</li>
                            <li>本サービス上のデータ（大会情報、画像、テキスト等を含みますがこれらに限られません）を、スクレイピング、クローラー、botその他のプログラム等を用いて自動的に収集・取得・複製する行為、およびそれらのデータを無断で転載・二次利用する行為</li>
                            <li>その他、本サービスが不適切と判断する行為</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">第3条（コンテンツの正確性と免責事項）</h2>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>本サービスに掲載されている大会情報、観光・グルメ情報、その他一切のコンテンツの一部は、人工知能（AI）システムによって自動生成された情報を含んでおります。</li>
                            <li>本サービスは、提供する情報（AI生成情報を含みます）の正確性、最新性、有用性、適合性、完全性、安全性、合法性等について、いかなる保証も行いません。</li>
                            <li>大会の開催日、エントリー期間、参加費用、コース内容等の詳細情報については、必ずユーザーご自身で各大会の公式サイトまたは主催者の発表等をご確認ください。</li>
                            <li>本サービスは、本サービスに関連してユーザーが被った損害につき、一切の責任を負わないものとします。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">第4条（本サービスの停止等）</h2>
                        <p className="mb-2">本サービスは、以下のいずれかに該当する場合には、ユーザーに事前に通知することなく、本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>本サービスに係るコンピューター・システムの点検または保守作業を緊急に行う場合</li>
                            <li>コンピューター、通信回線等の障害、誤操作、過度なアクセスの集中、不正アクセス、ハッキング等により本サービスの運営ができなくなった場合</li>
                            <li>地震、落雷、火災、風水害、停電、天災地変などの不可抗力により本サービスの運営ができなくなった場合</li>
                            <li>その他、本サービスが停止または中断を必要と判断した場合</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">第5条（著作権等の権利の帰属）</h2>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>本サービスに関する知的財産権（本サービスを構成するテキスト、画像、プログラムその他一切のデータを含みます）は、本サービスまたは本サービスにライセンスを許諾している者に帰属します。</li>
                            <li>ユーザーは、本サービスの利用を通じて取得した情報を、私的利用の範囲を超えて複製、販売、出版、その他いかなる方法においても第三者に提供してはなりません。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">第6条（本規約等の変更）</h2>
                        <p className="mb-2">本サービスは、必要と判断した場合には、ユーザーに個別の通知をすることなくいつでも本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲示された時点から効力を生じるものとし、ユーザーは変更後も本サービスを引き続き利用することにより、変更後の本規約に同意したものとみなされます。</p>
                    </section>

                    <section className="pt-8 border-t border-border/50 text-sm text-muted-foreground">
                        <p>制定日：2026年3月4日</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
