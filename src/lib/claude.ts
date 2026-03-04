import Anthropic from '@anthropic-ai/sdk';
import { unstable_cache } from 'next/cache';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function _generateRaceContent(raceId: string, raceName: string, prefecture: string, city: string | null) {
    const location = city ? `${prefecture}${city}` : prefecture;

    // Prompt to generate both Features and Sightseeing Spots
    const systemPrompt = `あなたはプロのランニングライター兼観光ガイドです。
与えられたマラソン大会の「大会の特徴」と「近くの観光地・おすすめスポット」を作成してください。

【出力フォーマット（厳守）】
以下のXMLタグを使用して2つの情報を分けて出力してください。

<features>
[ここにランナーが参加したくなるような魅力的な「大会の特徴」を200文字〜300文字程度で作成。見出し不要]
</features>

<spots>
[ここに大会前後に訪れたくなるような観光地やおすすめスポットを3つ、Markdownのリスト形式（- **[スポット名]**: [説明]）で作成]
</spots>`;

    const userPrompt = `大会名: ${raceName}\n開催地: ${location}`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        });

        // Parse XML tags from response
        const textBlocks = response.content.filter(block => block.type === 'text');
        const contentText = textBlocks.length > 0 ? textBlocks[0].text : '';

        const featuresMatch = contentText.match(/<features>([\s\S]*?)<\/features>/);
        const spotsMatch = contentText.match(/<spots>([\s\S]*?)<\/spots>/);

        return {
            features: featuresMatch ? featuresMatch[1].trim() : '特徴情報を取得できませんでした。',
            spots: spotsMatch ? spotsMatch[1].trim() : '観光スポット情報を取得できませんでした。'
        };
    } catch (error) {
        console.error('Claude API Error:', error);
        return {
            features: '現在、特徴情報を取得できません。',
            spots: '現在、観光スポット情報を取得できません。'
        };
    }
}

// Next.js caching layer wrapper
// Revalidate set to false (or a very long time) so we don't spam the API for static content.
export const generateRaceContent = unstable_cache(
    _generateRaceContent,
    ['race-content-generation-claude'], // Note: Changed cache key so it fetches fresh data via Claude
    { revalidate: false } // cache forever until cache is cleared manually
);
