import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ts-node環境などを考慮した__dirname対応
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数の読み込み (dotenv がない可能性も考慮して最低限の対応、本来はimport 'dotenv/config'など)
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set in .env.local");
  process.exit(1);
}

const DATA_DIR = path.resolve(__dirname, '../data');
const RACES_JSON_PATH = path.join(DATA_DIR, 'races.json');
const MASTER_CSV_PATH = path.join(DATA_DIR, 'marathon_master.csv');
const OUTPUT_JSON_PATH = path.join(DATA_DIR, 'race_details.json');

export function normalizeRaceName(name: string): string {
  return name
    .replace(/第\d+回(記念)?/g, '')
    .replace(/20\d{2}/g, '')
    .replace(/令和\d+年(度)?/g, '')
    .trim();
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SYSTEM_PROMPT = `あなたはマラソン大会の紹介記事を生成する専門ライターです。
ランナー向けの実用情報と、遠征を楽しむための観光・グルメ情報を組み合わせた記事データを生成してください。

## インプット
ユーザーからマラソン大会の基本情報がJSON形式で提供されます。
以下のフィールドが含まれます：
- name: 大会名
- date: 開催日
- prefecture: 都道府県
- city: 市区町村
- distance: 種目（フル、ハーフ、10km など）
- entry_status: エントリー状況
- entry_end_date: エントリー締切日
- url: 大会関連URL（あれば）

## 処理ルール
1. 提供された基本情報はそのまま信頼し、重複して調べ直さないこと
2. Web検索を活用して、基本情報にない詳細（コース特徴、ランナーの評判、周辺観光など）を補完すること
3. 検索しても情報が見つからない項目は null とし、推測で埋めないこと
4. 小規模な大会で情報が少ない場合でも、開催地域の観光・グルメ情報は可能な限り提供すること

## 出力フォーマット
以下のJSON構造のみを返すこと。マークダウンのコードブロック(\`\`\`)や前後の説明テキストは一切含めず、純粋なJSONだけを返すこと。

{
  "race_id": "インプットのidをそのまま返す",
  "overview": "大会の概要を3〜4文で。歴史、規模感、雰囲気、特徴を含める。情報が少ない場合は分かる範囲で。",
  "course": {
    "details": "コースの特徴、高低差、走りやすさや沿道の応援に関する見どころをまとめた1つの自然なテキスト段落（3〜5文程度）。観光地は記載しない。\n\n※高低差についての記述に入る前に必ず1つ改行（\\n）を入れること。不明なら null"
  },
  "race_details": {
    "venue": "会場名・スタート地点。不明なら null",
    "course_map_url": "コースマップが掲載されている公式ページまたはPDFのURL。見つからなければ null",
    "capacity": "定員。不明なら null",
    "time_limit": "制限時間（フルマラソンの場合）。不明なら null",
    "participation_fee": "参加費の目安。不明なら null",
    "official_url": "公式サイトURL。検索で見つかれば"
  },
  "runner_review": {
    "good_points": ["ランナーから評価が高いポイントを3つ程度"],
    "watch_out": ["注意点や改善要望として挙がりやすい点を2〜3つ。不明なら空配列"],
    "recommended_for": "この大会が特に向いているランナー像"
  },
  "access": {
    "nearest_station": "最寄り駅。不明なら null",
    "from_tokyo": "東京からのアクセス概要。不明なら null",
    "parking": "駐車場情報。不明なら null"
  },
  "tourism": {
    "spots": [
      {
        "name": "スポット名",
        "type": "温泉 / 神社 / 景勝地 / グルメスポット / 公園 など",
        "description": "1〜2文の紹介。レース前後に立ち寄れる視点で。",
        "distance_from_venue": "会場からの目安距離・時間。不明なら null",
        "google_map_url": "そのスポットのGoogle MapのURL（できれば https://goo.gl/... または https://maps.app.goo.gl/... 形式）。不明なら null"
      }
    ],
    "local_gourmet": [
      {
        "name": "ご当地グルメや名物料理",
        "description": "そのグルメの1文の紹介",
        "famous_store": "そのグルメを楽しめる有名店やおすすめの具体的な店名",
        "store_google_map_url": "そのお店のGoogle MapのURL。不明なら null"
      }
    ],
    "omiyage": [
      {
        "name": "お土産名",
        "description": "1文の紹介"
      }
    ]
  },
  "one_line_summary": "大会の特徴を端的に言い表すキャッチコピー（40文字以内）。※「〜駆け抜ける」「〜特別な一日」などのポエム調や、「感動」「最高の」などの陳腐な表現は厳禁。客観的かつ具体的な魅力（コースの特徴、特産品、規模など）を短くまとめること"
}

## 件数の目安
- tourism.spots: 3〜5件
- tourism.local_gourmet: 2〜3件
- tourism.omiyage: 2〜3件

## トーンと文体
- ランナーに寄り添った親しみやすい文体
- 「〜がおすすめです」「〜が魅力です」のような丁寧だがカジュアルな表現
- 観光情報は「レース後に立ち寄れる」視点で紹介
- 過度な装飾は不要`;

async function main() {
  console.log('--- 1. データの読み込み ---');
  // races.json の読み込み
  const racesData = JSON.parse(fs.readFileSync(RACES_JSON_PATH, 'utf-8'));

  // marathon_master.csv の読み込み（簡易パース：URLの突き合わせに使用）
  const csvContent = fs.readFileSync(MASTER_CSV_PATH, 'utf-8');
  const csvLines = csvContent.split('\n').filter(line => line.trim() !== '');
  const raceUrlMap = new Map();
  // CSVは: 大会名,公式サイトURL,開催日,開催地,都道府県
  for (let i = 1; i < csvLines.length; i++) {
    const cols = csvLines[i].split(',');
    if (cols.length >= 2) {
      const name = cols[0].trim();
      const url = cols[1].trim();
      raceUrlMap.set(name, url);
    }
  }

  // 過去の生成結果を読み込み（あれば）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let existingDetails: Record<string, any> = {};
  if (fs.existsSync(OUTPUT_JSON_PATH)) {
    try {
      existingDetails = JSON.parse(fs.readFileSync(OUTPUT_JSON_PATH, 'utf-8'));
      console.log(`既存のデータを ${Object.keys(existingDetails).length} 件読み込みました。`);
    } catch {
      console.error("既存データの読み込みに失敗しました。新規で開始します。");
    }
  }

  console.log(`\n全 ${racesData.length} 件の処理を開始します...`);

  for (let i = 0; i < racesData.length; i++) {
    const targetRace = racesData[i];
    const normalizedName = normalizeRaceName(targetRace.name);

    // 既に生成済みの場合はスキップ
    if (existingDetails[normalizedName]) {
      console.log(`[${i + 1}/${racesData.length}] スキップ: ${normalizedName} (生成済み)`);
      continue;
    }

    // コスト削減のため「受付中」の大会のみ生成する
    if (targetRace.entry_status !== '受付中') {
      console.log(`[${i + 1}/${racesData.length}] スキップ: ${normalizedName} (受付中ではないためコスト節約)`);
      continue;
    }

    const raceUrl = raceUrlMap.get(targetRace.name) || null;

    const inputJson = {
      id: targetRace.id, // Only keeping for reference, though not strictly needed anymore
      name: normalizedName, // Give AI the normalized name to avoid tying it to a specific year
      date: targetRace.date,
      entry_end_date: targetRace.entry_end_date,
      entry_status: targetRace.entry_status,
      prefecture: targetRace.prefecture,
      city: targetRace.city,
      distance: targetRace.distance,
      url: raceUrl
    };

    console.log(`\n[${i + 1}/${racesData.length}] 対象大会: ${inputJson.name}`);

    console.log('--- 2. Claude APIへリクエスト送信 ---');
    const requestBody = {
      model: "claude-sonnet-4-6", // Sonnet 4.6 (available model in environment)
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: 8000 // Adaptive thinking require budget. 
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify(inputJson)
        }
      ],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ]
    };

    const startTime = Date.now();

    try {
      // Note: To use extended output formatting / tools, the anthropic client or fetch raw request is needed.
      // However, thinking output requires explicit headers
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY as string,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "web-search-2025-03-05"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`API Error: ${response.status} ${response.statusText}`);
        console.error(errText);
        return;
      }

      const data = await response.json();
      const endTime = Date.now();
      const durationSec = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`\n--- 3. レスポンス結果 ---`);
      console.log(`処理時間: ${durationSec} 秒`);
      console.log(`トークン使用量: Input: ${data.usage?.input_tokens}, Output: ${data.usage?.output_tokens}`);

      // type: "text" のブロックを抽出
      const textContent = data.content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((block: any) => block.type === "text")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((block: any) => block.text)
        .join("");

      // JSONブロックのクリーンアップ
      let cleaned = textContent;
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1].trim();
      } else {
        cleaned = textContent.trim();
      }

      try {
        const parsedJson = JSON.parse(cleaned);
        console.log("\n[生成されたJSONデータ]");
        console.dir(parsedJson, { depth: null, colors: true });

        // 結果をマージして保存
        existingDetails[normalizedName] = parsedJson;
        fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(existingDetails, null, 2));
        console.log(`データを保存しました: ${OUTPUT_JSON_PATH}`);

        // レートリミット対策で15秒待機 (最後の要素以外)
        if (i < racesData.length - 1) {
          console.log("...15秒待機します...");
          await delay(15000);
        }

      } catch {
        console.error("JSONのパースに失敗しました");
        console.error("生成されたテキスト:", textContent);
      }
    } catch (error) {
      console.error("リクエストエラー:", error);
    }
  }
}

main();
