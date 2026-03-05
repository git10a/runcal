import fs from 'fs';
import path from 'path';
import { generateTweet } from './claude';
import { postTweet } from './x';
import dotenv from 'dotenv';

dotenv.config();

const RACES_PATH = path.join(process.cwd(), 'data/races.json');
const HISTORY_PATH = path.join(process.cwd(), 'data/x_posts_history.json');

interface Race {
    id: string;
    name: string;
    date: string;
    prefecture: string;
    distances: string[];
    entry_status: string;
    entry_url?: string;
    official_url?: string;
    image_url?: string;
    description?: string;
}

interface PostHistory {
    date: string;
    text: string;
    category: string;
    race_id?: string;
}

const CATEGORIES = [
    { name: 'race_info', weight: 30 },
    { name: 'gourmet_tourism', weight: 20 },
    { name: 'empathy_daily', weight: 25 },
    { name: 'site_tips', weight: 10 },
    { name: 'dev_story', weight: 15 },
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

async function main() {
    const dryRun = process.env.DRY_RUN === 'true';
    console.log(`Starting X autopost... (Dry Run: ${dryRun})`);

    // Load data
    const races: Race[] = JSON.parse(fs.readFileSync(RACES_PATH, 'utf-8'));
    const history: PostHistory[] = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));

    const category = selectCategory();
    console.log(`Selected category: ${category}`);

    // Select a race if needed
    let selectedRace: Race | undefined;
    if (['race_info', 'gourmet_tourism'].includes(category)) {
        // Pick a race that hasn't been posted recently
        const recentRaceIds = history.slice(-20).map(h => h.race_id);
        const availableRaces = races.filter(r => !recentRaceIds.includes(r.id));
        selectedRace = availableRaces[Math.floor(Math.random() * availableRaces.length)];
    }

    const prompt = buildPrompt(category, selectedRace, history.slice(-5));

    const tweetText = await generateTweet(prompt, process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022');
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

function buildPrompt(category: string, race?: Race, recentPosts?: PostHistory[]) {
    const strategy = fs.readFileSync(path.join(process.cwd(), 'scripts/x_autopost/identity.md'), 'utf-8');

    let raceContext = '';
    if (race) {
        raceContext = `
対象とする大会情報:
- 大会名: ${race.name}
- 開催日: ${race.date}
- 場所: ${race.prefecture}
- 種目: ${race.distances.join(', ')}
- エントリー状況: ${race.entry_status}
- サイトURL: https://runcal.com/races/${race.id}
`;
    }

    const recentContext = recentPosts?.length
        ? `直近の投稿履歴 (これらと内容が被らないようにしてください): \n${recentPosts.map(p => `- ${p.text}`).join('\n')}`
        : '';

    return `
${strategy}

今回の投稿カテゴリ: ${category}
${raceContext}
${recentContext}

ユーザーに届く「1つのポスト」を作成してください。
ハッシュタグは不要、挨拶も不要です。
絵文字は最大1つまで。
長い場合は2行改行（空白行）を入れて読みやすくしてください。
人間味を極限まで高めてください。
`;
}

main().catch(console.error);
