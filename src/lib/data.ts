import racesData from '../../data/races.json';
import { Race } from '@/types';

export function getDistanceSortWeight(d: string): number {
  if (d === "フル") return 42.195;
  if (d === "ハーフ") return 21.0975;
  if (d === "ウルトラ") return 100;
  if (d === "リレー") return 1000; // Sort towards the end

  // Check if it has a 'km' number
  const kmMatch = d.match(/([\d.]+)km/);
  if (kmMatch) {
    return parseFloat(kmMatch[1]);
  }

  // Unrecognized values like "その他" drop to the very end
  if (d === "その他") return 9999;
  return 999;
}

export function getAllRaces(): Race[] {
  // Get today's date in JST (Asia/Tokyo)
  const now = new Date();
  const jstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayStr = `${jstDate.getFullYear()}-${String(jstDate.getMonth() + 1).padStart(2, '0')}-${String(jstDate.getDate()).padStart(2, '0')}`;

  // Filter out past events and sort by date ascending (upcoming races first)
  return (racesData as Race[])
    .map(race => ({
      ...race,
      distance: [...race.distance].sort((a, b) => getDistanceSortWeight(a) - getDistanceSortWeight(b))
    }))
    .filter(race => race.date >= todayStr)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getFilteredRaces(filters: {
  prefecture?: string;
  distance?: string;
  is_jaaf_certified?: boolean;
}): Race[] {
  let races = getAllRaces();

  if (filters.prefecture) {
    races = races.filter(r => r.prefecture === filters.prefecture);
  }

  if (filters.distance) {
    races = races.filter(r => r.distance.includes(filters.distance!));
  }

  if (filters.is_jaaf_certified !== undefined) {
    races = races.filter(r => r.is_jaaf_certified === filters.is_jaaf_certified);
  }

  return races;
}

export function getUniquePrefectures(): string[] {
  const prefs = new Set(getAllRaces().map(r => r.prefecture));

  // JIS Prefecture ordering
  const prefectureOrder = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "不明"
  ];

  return Array.from(prefs).sort((a, b) => {
    const aIndex = prefectureOrder.indexOf(a);
    const bIndex = prefectureOrder.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b, 'ja');
  });
}

export function getUniqueDistances(): string[] {
  const distances = new Set(getAllRaces().flatMap(r => r.distance));
  return Array.from(distances).sort((a, b) => getDistanceSortWeight(a) - getDistanceSortWeight(b));
}
