import fs from 'fs';
import path from 'path';
import { generateTweet } from './claude';
import { postTweet } from './x';
import dotenv from 'dotenv';

dotenv.config();

const RACES_PATH = path.join(process.cwd(), 'data/races.json');
const RACE_DETAILS_PATH = path.join(process.cwd(), 'data/race_details.json');
const HISTORY_PATH = path.join(process.cwd(), 'data/x_posts_history.json');
const JST_TIME_ZONE = 'Asia/Tokyo';
const AUTO_POSTS_PER_DAY = 3;
const AUTO_POST_START_HOUR = 8;
const AUTO_POST_END_HOUR = 21;
const MAX_TWEET_LENGTH = 200;

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

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

function findRaceByName(races: Race[], raceName: string) {
    const normalized = normalizeText(raceName);
    return races.find(r => normalizeText(r.name) === normalized);
}

function findRaceDetails(race: Race | undefined, raceDetails: Record<string, any>) {
    if (!race) return undefined;

    if (raceDetails[race.name]) {
        return raceDetails[race.name];
    }

    const normalizedRaceName = normalizeText(race.name);

    for (const [detailName, detail] of Object.entries(raceDetails)) {
        const normalizedDetailName = normalizeText(detailName);
        if (
            normalizedRaceName.startsWith(normalizedDetailName) ||
            normalizedDetailName.startsWith(normalizedRaceName) ||
            normalizedRaceName.includes(normalizedDetailName) ||
            normalizedDetailName.includes(normalizedRaceName)
        ) {
            return detail;
        }
    }

    return undefined;
}

function getNamedItems(value: any): Array<{ name?: string; description?: string }> {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === 'object') {
        if (Array.isArray(value.spots)) {
            return value.spots;
        }
        if (Array.isArray(value.items)) {
            return value.items;
        }
        if (Array.isArray(value.entries)) {
            return value.entries;
        }
    }

    return [];
}

function getTourismItems(detail: any): Array<{ name?: string; description?: string }> {
    return getNamedItems(detail?.tourism);
}

function getGourmetItems(detail: any): Array<{ name?: string; description?: string }> {
    return [
        ...getNamedItems(detail?.local_gourmet),
        ...getNamedItems(detail?.tourism?.local_gourmet),
    ];
}

function hasRaceDetailsForCategory(race: Race, raceDetails: Record<string, any>, category: string) {
    const detail = findRaceDetails(race, raceDetails);
    if (!detail) {
        return false;
    }

    if (category === 'race_gourmet') {
        return getGourmetItems(detail).length > 0 || getTourismItems(detail).length > 0;
    }

    if (category === 'race_feature') {
        return Boolean(
            detail.overview ||
            detail.course?.details ||
            detail.runner_review?.good_points?.length
        );
    }

    return true;
}

function categoryNeedsDetailedRace(category: string) {
    return category === 'race_feature' || category === 'race_gourmet';
}

function getUpcomingRaces(races: Race[], days: number = 30): Race[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return races.filter(r => {
        const raceDate = new Date(r.date);
        return raceDate >= now && raceDate <= cutoff;
    });
}

function getJstDateTimeParts(date: Date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: JST_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    });

    const parts = Object.fromEntries(
        formatter
            .formatToParts(date)
            .filter(part => part.type !== 'literal')
            .map(part => [part.type, part.value])
    ) as Record<string, string>;

    return {
        dateKey: `${parts.year}-${parts.month}-${parts.day}`,
        hour: Number(parts.hour),
    };
}

function countTodayPosts(history: PostHistory[], dateKey: string) {
    return history.filter(entry => getJstDateTimeParts(new Date(entry.date)).dateKey === dateKey).length;
}

function shouldPostInThisScheduledRun(history: PostHistory[]) {
    const nowJst = getJstDateTimeParts();

    if (nowJst.hour < AUTO_POST_START_HOUR || nowJst.hour > AUTO_POST_END_HOUR) {
        return false;
    }

    const postedToday = countTodayPosts(history, nowJst.dateKey);
    if (postedToday >= AUTO_POSTS_PER_DAY) {
        return false;
    }

    const remainingPosts = AUTO_POSTS_PER_DAY - postedToday;
    const remainingSlots = AUTO_POST_END_HOUR - nowJst.hour + 1;
    const probability = remainingPosts / remainingSlots;
    const roll = Math.random();

    console.log(
        `Schedule decision (JST ${nowJst.dateKey} ${String(nowJst.hour).padStart(2, '0')}:00): ` +
        `postedToday=${postedToday}, remainingPosts=${remainingPosts}, remainingSlots=${remainingSlots}, ` +
        `probability=${probability.toFixed(4)}, roll=${roll.toFixed(4)}`
    );

    return roll < probability;
}

async function generateTweetWithinLimit(prompt: string, model: string, maxLength: number) {
    let tweetText = (await generateTweet(prompt, model)).trim();
    let attempt = 1;

    while (tweetText && tweetText.length > maxLength && attempt < 3) {
        console.warn(
            `Generated tweet is too long (${tweetText.length} chars). Retrying with stricter instruction...`
        );

        tweetText = (await generateTweet(
            `${prompt}

以下は長すぎた下書きです。意味をなるべく保ったまま、改行やURLを含めて${maxLength}文字以内に短く書き直してください。
説明や前置きは不要で、完成した本文だけを返してください。

下書き:
${tweetText}`,
            model
        )).trim();

        attempt += 1;
    }

    return tweetText;
}

async function main() {
    if (process.env.ENABLE_AI_GENERATION !== 'true') {
        console.log('--- AI生成・自動投稿が無効化されています (ENABLE_AI_GENERATION != true) ---');
        console.log('APIコスト削減のため、処理を中断します。');
        return;
    }

    const dryRunEnv = process.env.DRY_RUN;
    const dryRun = dryRunEnv === 'true' || dryRunEnv === 'yes';
    const forcedRaceName = process.env.FORCE_RACE_NAME?.trim();
    const forcedCategory = process.env.FORCE_CATEGORY?.trim();
    const eventName = process.env.GITHUB_EVENT_NAME;
    console.log(`Starting X autopost... (Dry Run: ${dryRun})`);

    // Load data
    const races: Race[] = JSON.parse(fs.readFileSync(RACES_PATH, 'utf-8'));
    const raceDetails: Record<string, any> = JSON.parse(fs.readFileSync(RACE_DETAILS_PATH, 'utf-8'));
    const history: PostHistory[] = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));

    const isScheduledRun = eventName === 'schedule';
    if (isScheduledRun && !shouldPostInThisScheduledRun(history)) {
        console.log('Skip posting in this scheduled run.');
        return;
    }

    const validCategory = forcedCategory && CATEGORIES.some(c => c.name === forcedCategory);
    const category = validCategory ? forcedCategory! : selectCategory();
    console.log(`Selected category: ${category}`);
    if (forcedCategory && !validCategory) {
        console.warn(`Unknown FORCE_CATEGORY: ${forcedCategory}. Falling back to random category.`);
    }

    // Always select a race — prioritize upcoming races
    let selectedRace: Race | undefined;
    if (forcedRaceName) {
        selectedRace = findRaceByName(races, forcedRaceName);
        if (!selectedRace) {
            console.error(`FORCE_RACE_NAME not found: ${forcedRaceName}`);
            process.exit(1);
        }
        if (categoryNeedsDetailedRace(category) && !hasRaceDetailsForCategory(selectedRace, raceDetails, category)) {
            console.error(`Forced race does not have enough details for category "${category}": ${selectedRace.name}`);
            process.exit(1);
        }
        console.log(`Forced race: ${selectedRace.name}`);
    } else {
        const recentRaceIds = history.slice(-30).map(h => h.race_id);
        const availableRaces = races.filter(r => !recentRaceIds.includes(r.id));
        const eligibleRaces = categoryNeedsDetailedRace(category)
            ? availableRaces.filter(r => hasRaceDetailsForCategory(r, raceDetails, category))
            : availableRaces;

        // Try upcoming races first (within 30 days)
        const upcomingRaces = getUpcomingRaces(eligibleRaces, 30);
        if (upcomingRaces.length > 0) {
            selectedRace = upcomingRaces[Math.floor(Math.random() * upcomingRaces.length)];
        } else {
            // Fallback: any eligible race not recently posted
            if (eligibleRaces.length === 0) {
                console.error(`No eligible races found for category "${category}".`);
                process.exit(1);
            }
            selectedRace = eligibleRaces[Math.floor(Math.random() * eligibleRaces.length)];
        }
    }

    // Get detailed info if available
    let detailsContext = '';
    if (selectedRace) {
        const detail = findRaceDetails(selectedRace, raceDetails);
        if (detail) {
            const parts: string[] = [];
            if (detail.overview) parts.push(`概要: ${detail.overview}`);
            if (detail.course?.details) parts.push(`コース: ${detail.course.details}`);
            if (detail.runner_review?.good_points) parts.push(`良い点: ${detail.runner_review.good_points.join(' / ')}`);
            const gourmetItems = getGourmetItems(detail);
            if (gourmetItems.length > 0) {
                const gourmets = gourmetItems
                    .map((g: any) => `${g.name}: ${g.description}`)
                    .join(' / ');
                if (gourmets) {
                    parts.push(`ご当地グルメ: ${gourmets}`);
                }
            }
            const tourismItems = getTourismItems(detail);
            if (tourismItems.length > 0) {
                const spots = tourismItems
                    .map((t: any) => `${t.name}: ${t.description}`)
                    .join(' / ');
                if (spots) {
                    parts.push(`周辺観光: ${spots}`);
                }
            }
            detailsContext = parts.join('\n');
        }
    }

    const prompt = buildPrompt(category, selectedRace, detailsContext, history.slice(-5));

    const tweetText = await generateTweetWithinLimit(
        prompt,
        process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
        MAX_TWEET_LENGTH
    );
    console.log('--- Generated Tweet ---');
    console.log(tweetText);
    console.log('-----------------------');

    if (!tweetText) {
        console.error('Failed to generate tweet text.');
        return;
    }

    if (tweetText.length > MAX_TWEET_LENGTH) {
        console.error(`Generated tweet is still too long: ${tweetText.length} characters.`);
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
- サイトURL: https://run-cal.com/races/${race.id}
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
- 投稿の最後にランカレのURLをそのまま添える。宣伝文句や誘導文を足さない。
- 投稿全体は改行やURLを含めて${MAX_TWEET_LENGTH}文字以内に収める。短めで読みやすくする。
- 人間味を極限まで高めてください。
`;
}

main().catch(console.error);
