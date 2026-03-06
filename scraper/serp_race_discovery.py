#!/usr/bin/env python3
"""
SERP-based race discovery.

Searches Google via Serper.dev for marathon/running events on entry sites
(RUNNET, moshicom, sportsentry) and broad searches. Uses Gemini to extract
structured race data from search snippets.

Discovers races that RunnersBible doesn't list: half marathons, trail runs,
smaller local events, etc.
"""

import os
import json
import re
import uuid
import time
import hashlib
from datetime import datetime, timezone, timedelta

import requests
from google import genai

from main import generate_race_id
from serp_entry_extractor import (
    _get_serper_api_key,
    _get_gemini_client,
    _search_serper,
)
from main import normalize_race_name, extract_prefecture

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

GEMINI_MODEL = "gemini-2.5-flash"

DISCOVERY_PROMPT = """あなたはマラソン・ランニング大会の情報を抽出するアシスタントです。
Google検索結果のリスト（タイトル、スニペット、URL）が与えられます。
各検索結果から個別の大会を識別し、以下の情報をJSON配列として返してください。

## ルール
1. 大会名と開催日が明確に読み取れる結果のみ抽出してください
2. 検索対象の月に開催される大会のみ抽出してください。別の月の大会は無視してください
3. 以下は無視してください:
   - ニュース記事、ブログ記事、まとめ記事
   - ボランティア募集、スタッフ募集
   - カレンダー一覧ページ、検索結果ページ
   - 雑誌やメディアの紹介
4. 同じ大会が複数の検索結果に出ている場合は1つにまとめてください
5. 日付はYYYY-MM-DD形式で返してください
6. 年が明記されていない場合は、検索対象の年月から推測してください
7. distanceは種目から判断してください（例: "フル", "ハーフ", "10km", "5km", "ウルトラ", "トレイル"）
8. 「中止」「開催中止」と明記されている大会は含めないでください
9. URLは個別の大会ページやエントリーページを優先してください
   - 良い例: moshicom.com/12345, runnet.jp/cgi-bin/?id=12345, 公式サイトURL
   - 悪い例: カレンダーURL, 検索結果URL, 一覧ページURL
   もし良いURLがない場合は、タイトルやスニペットから推測できる公式サイトURLを使ってください

## 出力フォーマット
以下のJSON配列のみを返してください（余計なテキストは不要）：

[
  {
    "name": "大会名（正式名称）",
    "date": "YYYY-MM-DD",
    "prefecture": "都道府県名",
    "city": "市区町村名 (不明ならnull)",
    "url": "大会の個別ページURL",
    "distance": ["フル", "ハーフ"]
  }
]

大会が1つも見つからない場合は空配列 [] を返してください。"""

# URLs matching these patterns are not individual race pages
SKIP_URL_PATTERNS = [
    "/calendar/",
    "/events/",
    "/racematome/",
    "/race-panel/",
    "/search?",
    "/mailmagazine/",
    "page=",
    "month%5B",
    "keyword1=",
    "/book/",
    "/top",
    "AcceptingCompetition",
    "RaceSearch",
]

SKIP_TITLE_KEYWORDS = [
    "ボランティア募集",
    "スタッフ募集",
    "年会員",
    "ランナーズ20",  # magazine: ランナーズ2026年
]


# ---------------------------------------------------------------------------
# Search query generation
# ---------------------------------------------------------------------------

def _generate_queries(year, month):
    """Generate targeted search queries for a given year/month."""
    month_str = f"{year}年{month}月"
    queries = []

    # RUNNET - target individual race pages
    queries.append(f'site:runnet.jp/cgi-bin マラソン {month_str}')
    # moshicom - exclude non-race content
    queries.append(f'site:moshicom.com マラソン {month_str} -ボランティア -スタッフ -年会員')
    # sportsentry - target individual event pages
    queries.append(f'site:sportsentry.ne.jp/event マラソン {month_str}')
    # Broad searches
    queries.append(f'マラソン大会 {month_str} エントリー -結果 -リザルト')
    queries.append(f'ハーフマラソン 大会 {month_str} 開催')
    queries.append(f'トレイルラン 大会 {month_str} エントリー')

    return queries


def _should_skip_result(title, url):
    """Pre-filter obviously non-race results."""
    url_lower = url.lower()
    for pattern in SKIP_URL_PATTERNS:
        if pattern.lower() in url_lower:
            return True
    for keyword in SKIP_TITLE_KEYWORDS:
        if keyword in title:
            return True
    return False


# ---------------------------------------------------------------------------
# Gemini extraction
# ---------------------------------------------------------------------------

def _format_results_for_gemini(results, year, month):
    """Format search results into text for Gemini."""
    lines = [f"検索対象: {year}年{month}月のマラソン・ランニング大会\n"]
    for i, r in enumerate(results, 1):
        lines.append(f"[{i}]")
        lines.append(f"タイトル: {r['title']}")
        lines.append(f"スニペット: {r['snippet']}")
        lines.append(f"URL: {r['url']}")
        lines.append("")
    return "\n".join(lines)


def _parse_gemini_response(text):
    """Parse Gemini response, handling markdown code fences."""
    if not text:
        return []
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()
    try:
        result = json.loads(text)
        return result if isinstance(result, list) else []
    except json.JSONDecodeError:
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1:
            try:
                result = json.loads(text[start : end + 1])
                return result if isinstance(result, list) else []
            except json.JSONDecodeError:
                pass
        print(f"  Could not parse Gemini response: {text[:200]}")
        return []


def _extract_races_with_gemini(results, year, month, client):
    """Use Gemini to extract structured race data from search results."""
    prompt = _format_results_for_gemini(results, year, month)

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "system_instruction": DISCOVERY_PROMPT,
                "temperature": 0.0,
            },
        )
        return _parse_gemini_response(response.text)
    except Exception as e:
        print(f"  Gemini error: {e}")
        return []


# ---------------------------------------------------------------------------
# Discovery pipeline
# ---------------------------------------------------------------------------

def discover_races_for_month(year, month, api_key, gemini_client):
    """Search and discover races for a specific month."""
    queries = _generate_queries(year, month)
    all_results = []
    seen_urls = set()
    skipped = 0

    for query in queries:
        print(f"  SERP: {query}")
        results = _search_serper(query, api_key, num_results=10)

        for r in results:
            url = r.get("link", "")
            title = r.get("title", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            if _should_skip_result(title, url):
                skipped += 1
                continue
            all_results.append({
                "title": title,
                "snippet": r.get("snippet", ""),
                "url": url,
            })
        time.sleep(0.5)

    if not all_results:
        print(f"  -> No results for {year}年{month}月")
        return []

    print(f"  -> {len(all_results)} useful results ({skipped} filtered out), extracting with Gemini...")
    races = _extract_races_with_gemini(all_results, year, month, gemini_client)
    print(f"  -> Gemini extracted {len(races)} races")
    return races


def discover_upcoming_races(months_ahead=6):
    """Discover races for the next N months."""
    api_key = _get_serper_api_key()
    if not api_key:
        print("SERPER_API_KEY not configured. Skipping SERP discovery.")
        return []

    try:
        client = _get_gemini_client()
    except RuntimeError as e:
        print(f"Gemini not available: {e}. Skipping SERP discovery.")
        return []

    jst_now = datetime.now(timezone(timedelta(hours=9)))
    today_str = jst_now.strftime("%Y-%m-%d")

    all_discovered = []

    for i in range(months_ahead):
        target_month = jst_now.month + i
        target_year = jst_now.year
        while target_month > 12:
            target_month -= 12
            target_year += 1

        print(f"\n[Discovery] {target_year}年{target_month}月")
        races = discover_races_for_month(target_year, target_month, api_key, client)

        for race_data in races:
            date = race_data.get("date")
            if not date or date < today_str:
                continue

            prefecture = race_data.get("prefecture", "")
            if not prefecture:
                prefecture = extract_prefecture(race_data.get("city", "") or "")
            city = race_data.get("city") or ""
            if prefecture and city.startswith(prefecture):
                city = city[len(prefecture):]

            distance = race_data.get("distance", [])
            if not distance:
                distance = ["その他"]
            distance = ["フル" if d == "マラソン" else d for d in distance]

            race_name = race_data.get("name", "")
            all_discovered.append({
                "id": generate_race_id(race_name, date),
                "name": race_name,
                "date": date,
                "entry_start_date": None,
                "entry_end_date": None,
                "entry_status": "不明",
                "prefecture": prefecture or "不明",
                "city": city,
                "distance": distance,
                "is_jaaf_certified": False,
                "time_limit": None,
                "features": None,
                "url": race_data.get("url", ""),
                "source": "serp_discovery",
                "updated_at": jst_now.strftime("%Y年%m月%d日"),
            })

        time.sleep(1)

    print(f"\n[Discovery] Total: {len(all_discovered)} races discovered")
    return all_discovered


# ---------------------------------------------------------------------------
# Merge with existing data
# ---------------------------------------------------------------------------

def merge_discovered_races(discovered, existing):
    """Merge discovered races into existing list, skipping duplicates."""
    existing_keys = set()
    for race in existing:
        norm = normalize_race_name(race.get("name", ""))
        key = f"{norm}_{race.get('date', '')}"
        existing_keys.add(key)

    new_races = []
    skipped = 0
    for race in discovered:
        norm = normalize_race_name(race.get("name", ""))
        key = f"{norm}_{race.get('date', '')}"
        if key in existing_keys:
            skipped += 1
            continue
        existing_keys.add(key)
        new_races.append(race)

    print(f"[Merge] {len(new_races)} new races, {skipped} duplicates skipped")
    return new_races


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Discover races via SERP API + Gemini")
    parser.add_argument("--months", type=int, default=6, help="Months ahead to search (default: 6)")
    parser.add_argument("--dry-run", action="store_true", help="Print discovered races without saving")
    args = parser.parse_args()

    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    json_path = os.path.join(data_dir, "races.json")

    existing = []
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            existing = json.load(f)
    print(f"Existing races: {len(existing)}")

    discovered = discover_upcoming_races(months_ahead=args.months)

    if not discovered:
        print("No new races discovered.")
        return

    new_races = merge_discovered_races(discovered, existing)

    if not new_races:
        print("All discovered races already exist.")
        return

    if args.dry_run:
        print(f"\n[Dry Run] Would add {len(new_races)} new races:")
        for r in sorted(new_races, key=lambda x: x["date"]):
            print(f"  {r['date']} | {r['name']} | {r['prefecture']} | {r['distance']} | {r['url']}")
        return

    all_races = existing + new_races
    all_races.sort(key=lambda x: x.get("date", ""))

    # Generate images for new races
    public_images_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "images", "races")
    os.makedirs(public_images_dir, exist_ok=True)
    try:
        import image_generator
    except ImportError:
        image_generator = None

    for race in new_races:
        hash_str = hashlib.md5(race["name"].encode("utf-8")).hexdigest()
        filename = f"race_{hash_str}.png"
        image_filepath = os.path.join(public_images_dir, filename)
        generated_url = f"/images/races/{filename}"

        if os.path.exists(image_filepath):
            race["image_url"] = generated_url
        elif image_generator:
            if image_generator.generate_and_save_race_image(race["name"], image_filepath):
                race["image_url"] = generated_url
                time.sleep(2)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_races, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(all_races)} races ({len(new_races)} new) to {json_path}")


if __name__ == "__main__":
    main()
