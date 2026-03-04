import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card p-8 sm:p-12 rounded-3xl shadow-sm border border-border/50">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    トップページへ戻る
                </Link>

                <h1 className="text-3xl font-extrabold text-foreground mb-8">プライバシーポリシー</h1>

                <div className="space-y-8 text-foreground/80 leading-loose">
                    <section>
                        <p>
                            本サイト「ランカレ」（以下、「本サービス」といいます。）は、ユーザーの皆様のプライバシーならびに個人情報の保護を重要視しております。本プライバシーポリシーでは、本サービスにおける個人情報の取り扱いおよびデータ収集について説明いたします。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">1. 収集する情報とその利用目的</h2>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>
                                <span className="font-bold text-foreground">「出るかもリスト」等の保存データ</span>
                                <p className="mt-1">
                                    本サービスでは、お気に入り機能「出るかもリスト」のデータを管理するために、ユーザーのブラウザのローカルストレージ（Local Storage）機能を利用しています。これらのデータはお客様の端末内にのみ保存され、当サービスのサーバーには送信・保存されません。会員登録やログインを要求しないため、氏名、メールアドレスなどの個人を特定できる情報を取得することはありません。
                                </p>
                            </li>
                            <li>
                                <span className="font-bold text-foreground">アクセス解析ツール等について</span>
                                <p className="mt-1">
                                    本サービスでは、今後の利用状況の把握やサービス改善を目的として、Googleアナリティクス等のアクセス解析ツールを利用する可能性があります。これらのツールはトラフィックデータの収集のためにCookie等の技術を使用していますが、これらは匿名で収集されており、個人を特定するものではありません。
                                </p>
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">2. 第三者への情報の提供</h2>
                        <p className="mb-2">
                            本サービスでは、法令に基づく開示請求があった場合を除き、取得した情報をユーザー本人の同意を得ることなく第三者に提供することはありません。（ただし前述のとおり、当サービスのサーバーにおいては個人を特定する基本情報を収集・保有しておりません。）
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">3. 免責事項</h2>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>本サービスからリンクやバナーなどによって他の外部サイトに移動された場合、移動先サイトで提供される情報やサービスに関するプライバシーの取り扱いや損害について、本サービスは一切の責任を負いません。</li>
                            <li>本サービス内で生成される一部のコンテンツはAIを利用して自動生成されており、最新の正確性を保証するものではありません。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-4">4. プライバシーポリシーの変更</h2>
                        <p className="mb-2">
                            本ポリシーの内容は、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーは、本サービス上に掲載したときから効力を生じるものとします。
                        </p>
                    </section>

                    <section className="pt-8 border-t border-border/50 text-sm text-muted-foreground">
                        <p>制定日：2026年3月4日</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
