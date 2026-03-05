import fs from 'fs';
import path from 'path';
import { generateTweet } from './claude';
import { postTweet } from './x';
import dotenv from 'dotenv';

dotenv.config();

const RACES_PATH = path.join(process.cwd(), 'data/races.json');
const RACE_DETAILS_PATH = path.join(process.cwd(), 'data/race_details.json');
const HISTORY_PATH = path.join(process.cwd(), 'data/x_posts_history.json');

interface Race {
    id: string;
    name: string;
    date: string;
    prefecture: string;
    city?: string;
    distance: string[]; // races.json に合わせる
    entry_status: string;
    entry_url?: string;
    official_url?: string;
    url?: string;
    image_url?: string;
    description?: string;
    tags?: string[];
}

interface PostHistory {
    date: string;
    text: string;
    category: string;
    race_id?: string;
}

// 大会紹介を中心にする（80%が大会関連）
const CATEGORIES = [
    { name: 'race_feature', weight: 50 },      // 大会の特徴・魅力紹介
    { name: 'race_gourmet', weight: 30 },       // 大会×ご当地グルメ・観光
    { name: 'site_tips', weight: 10 },          // サイト紹介・Tips
    { name: 'dev_story', weight: 10 },          // 開発裏話
];

function selectCategory() {
    const totalWeight = CATEGORIES.reduce((sum, cat) => sum + cat.weight, 0);
    let random = Math.random() * totalWeight;
    for (const cat of CATEGORIES) {
        if (random < cat.weight) return cat.name;
        random -= cat.weight;
    }
    return CATEGORIES[0].name;
}

function getUpcomingRaces(races: Race[], days: number = 30): Race[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return races.filter(r => {
        const raceDate = new Date(r.date);
        return raceDate >= now && raceDate <= cutoff;
    });
}

async function main() {
    const dryRunEnv = process.env.DRY_RUN;
    const dryRun = dryRunEnv === 'true' || dryRunEnv === 'yes';
    console.log(`Starting X autopost... (Dry Run: ${dryRun})`);

    // Load data
    const races: Race[] = JSON.parse(fs.readFileSync(RACES_PATH, 'utf-8'));
    const raceDetails: Record<string, any> = JSON.parse(fs.readFileSync(RACE_DETAILS_PATH, 'utf-8'));
    const history: PostHistory[] = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));

    const category = selectCategory();
    console.log(`Selected category: ${category}`);

    // Always select a race — prioritize upcoming races
    let selectedRace: Race | undefined;
    const recentRaceIds = history.slice(-30).map(h => h.race_id);

    // Try upcoming races first (within 30 days)
    const upcomingRaces = getUpcomingRaces(races, 30).filter(r => !recentRaceIds.includes(r.id));
    if (upcomingRaces.length > 0) {
        selectedRace = upcomingRaces[Math.floor(Math.random() * upcomingRaces.length)];
    } else {
        // Fallback: any race not recently posted
        const availableRaces = races.filter(r => !recentRaceIds.includes(r.id));
        selectedRace = availableRaces[Math.floor(Math.random() * availableRaces.length)];
    }

    // Get detailed info if available
    let detailsContext = '';
    if (selectedRace) {
        const detail = raceDetails[selectedRace.name];
        if (detail) {
            const parts: string[] = [];
            if (detail.overview) parts.push(`概要: ${detail.overview}`);
            if (detail.course?.details) parts.push(`コース: ${detail.course.details}`);
            if (detail.runner_review?.good_points) parts.push(`良い点: ${detail.runner_review.good_points.join(' / ')}`);
            if (detail.local_gourmet) {
                const gourmets = detail.local_gourmet.map((g: any) => `${g.name}: ${g.description}`).join(' / ');
                parts.push(`ご当地グルメ: ${gourmets}`);
            }
            if (detail.tourism) {
                const spots = detail.tourism.map((t: any) => `${t.name}: ${t.description}`).join(' / ');
                parts.push(`周辺観光: ${spots}`);
            }
            detailsContext = parts.join('\n');
        }
    }

    const prompt = buildPrompt(category, selectedRace, detailsContext, history.slice(-5));

    const tweetText = await generateTweet(prompt, process.env.CLAUDE_MODEL || 'claude-sonnet-4-6');
    console.log('--- Generated Tweet ---');
    console.log(tweetText);
    console.log('-----------------------');

    if (!tweetText) {
        console.error('Failed to generate tweet text.');
        return;
    }

    if (!dryRun) {
        await postTweet(tweetText);

        // Save history
        const newEntry: PostHistory = {
            date: new Date().toISOString(),
            text: tweetText,
            category: category,
            race_id: selectedRace?.id,
        };
        history.push(newEntry);
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
        console.log('History updated.');
    } else {
        console.log('Dry run: Tweet not posted.');
    }
}

function buildPrompt(category: string, race: Race | undefined, detailsContext: string, recentPosts?: PostHistory[]) {
    const strategy = fs.readFileSync(path.join(process.cwd(), 'scripts/x_autopost/identity.md'), 'utf-8');

    let raceContext = '';
    if (race) {
        raceContext = `
対象とする大会情報:
- 大会名: ${race.name}
- 開催日: ${race.date}
- 場所: ${race.prefecture}${race.city ? ' ' + race.city : ''}
- 種目: ${race.distance.join(', ')}
- エントリー状況: ${race.entry_status}
- サイトURL: https://runcal.com/races/${race.id}
${race.tags ? `- タグ: ${race.tags.join(', ')}` : ''}

${detailsContext ? `大会の詳細情報:\n${detailsContext}` : ''}
`;
    }

    const recentContext = recentPosts?.length
        ? `直近の投稿履歴 (これらと内容が被らないようにしてください): \n${recentPosts.map(p => `- ${p.text}`).join('\n')}`
        : '';

    const categoryLabel: Record<string, string> = {
        'race_feature': '大会の特徴・魅力紹介（コース、応援、制限時間、記録の出やすさなど）',
        'race_gourmet': '大会×ご当地グルメ・周辺観光の紹介',
        'site_tips': 'ランカレの機能や使い方の紹介',
        'dev_story': '開発裏話・個人開発のこだわり',
    };

    return `
${strategy}

今回の投稿カテゴリ: ${categoryLabel[category] || category}
${raceContext}
${recentContext}

ユーザーに届く「1つのポスト」を作成してください。
以下のルールを厳守してください:
- 敬語調（「〜です」「〜ですよね」「〜だと思います」等）で書く。タメ口は禁止。
- 絵文字は一切使わない。0個。
- ハッシュタグは一切使わない。
- 挨拶は不要。
- 段落を区切る場合、必ず空行を1行挟む（改行を2回入れる）。1回だけの改行で次の文を始めない。
- 大会について語る場合、データのスペックを並べるのではなく「走りたくなるポイント」や「この大会ならではの魅力」を自分の言葉で語る。
- 投稿の最後にランカレのURLを自然に添える。
- 人間味を極限まで高めてください。
`;
}

main().catch(console.error);
