#!/usr/bin/env python3
"""
LLM-based tagging for marathon races using Gemini Flash.
Reads data/races.json and data/race_details.json to tag a sample of 10 races that are "受付中".
"""

import os
import json
import time
from google import genai

MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = """あなたはマラソン大会の情報から特徴を表すタグを抽出するアシスタントです。
以下のマラソン大会の情報を元に、該当するタグをすべて選んでください。

【重要ルール】
1. 情報が不足している場合や確証がない場合は、絶対に推測で選んではいけません。該当なし（空配列 `[]`）を返してください。
2. 「皇居」や「東京」などの地名や大会名から一般的なイメージで推測しないでください。必ず提供された「概要」「サマリー」「コース特徴」「良い点・注意点」などの具体的な記述に基づき判断してください。
3. 主観的なクチコミ（例:「記録更新に向いている」）よりも、客観的なコースデータ（例:「高低差30m」「起伏がある」「アップダウンが激しい」）を最優先して判断してください。
4. 【🏆 タイムが狙いやすい】は、明確に「フラット」「高低差が小さい（10m以内など）」「高速コース」と記載されている場合のみ付与してください。起伏や高低差がある場合は付与しないでください。
5. 【🔰 初心者向け】は、明確に「アップダウンが少なく走りやすい」「平坦」「制限時間が長い/緩い」などの記載がある場合のみ付与してください。高低差が30mなど起伏がある場合は付与しないでください。

選べるタグ（これ以外の回答は不可。該当するものがない場合は空配列を返してください）:
[
  "🏆 タイムが狙いやすい",
  "⛰️ タフなコース",
  "🏞️ 景色が良い",
  "🔰 初心者向け",
  "🎉 お祭り・応援が熱い",
  "♨️ 観光・温泉が楽しめる"
]

必ず以下のJSON配列形式のみで回答してください（余計なテキストは一切不要。```json などのマークダウンも不要）。
例: ["🏆 タイムが狙いやすい", "🔰 初心者向け"]
"""

def _get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith('GEMINI_API_KEY='):
                        api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
                        break
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not found")
    return genai.Client(api_key=api_key)

import re

def _normalize_name(name):
    """Normalize race name for matching details (matches utils.ts normalizeRaceName)"""
    # Remove 第X回(記念)
    name = re.sub(r"第\d+回(記念)?", "", name)
    # Remove 20XX
    name = re.sub(r"20\d{2}", "", name)
    # Remove 令和X年(度)
    name = re.sub(r"令和\d+年(度)?", "", name)
    return name.strip()

def _parse_response(text):
    if not text:
        return []
    text = text.strip()
    if text.startswith('```'):
        lines = text.split('\n')
        lines = [l for l in lines if not l.strip().startswith('```')]
        text = '\n'.join(lines).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass
        print(f"  Could not parse LLM response: {text[:100]}")
        return []

def main():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    races_file = os.path.join(base_dir, 'data', 'races.json')
    details_file = os.path.join(base_dir, 'data', 'race_details.json')

    with open(races_file, 'r', encoding='utf-8') as f:
        races = json.load(f)
    
    details = {}
    if os.path.exists(details_file):
        with open(details_file, 'r', encoding='utf-8') as f:
            details = json.load(f)

    client = _get_client()
    
    # Filter races that are "受付中", don't have tags yet, and have detail data
    target_races = [
        r for r in races 
        if r.get('entry_status') == '受付中' 
        and 'tags' not in r
        and _normalize_name(r['name']) in details
    ]
    
    print(f"Found {len(target_races)} races to process.")
    
    updated_count = 0
    for race in target_races:
        print(f"Processing: {race['name']}")
        
        detail_key = _normalize_name(race['name'])
        race_detail = details.get(detail_key, {})
        
        
        # Build prompt content
        prompt = f"""【大会情報】
大会名：{race['name']}
開催地：{race['prefecture']} {race.get('city', '')}
距離：{', '.join(race.get('distance', []))}
"""
        
        if race.get('features'):
            prompt += f"概要：{race['features']}\n"
            
        if race_detail:
            if race_detail.get('one_line_summary'):
                prompt += f"サマリー：{race_detail['one_line_summary']}\n"
            if race_detail.get('course', {}).get('details'):
                prompt += f"コース特徴：{race_detail['course']['details']}\n"
            if race_detail.get('runner_review'):
                good = ", ".join(race_detail['runner_review'].get('good_points', []))
                watch = ", ".join(race_detail['runner_review'].get('watch_out', []))
                prompt += f"良い点：[{good}]\n"
                prompt += f"注意点：[{watch}]\n"
        
        try:
            print(f"  Prompt info: features={bool(race.get('features'))}, details={bool(race_detail)}")
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_PROMPT,
                    "temperature": 0.0,
                }
            )
            tags = _parse_response(response.text)
            
            # Make sure it's a list and items are valid tags
            valid_tags = [
                "🏆 タイムが狙いやすい",
                "⛰️ タフなコース",
                "🏞️ 景色が良い",
                "🔰 初心者向け",
                "🎉 お祭り・応援が熱い",
                "♨️ 観光・温泉が楽しめる"
            ]
            if isinstance(tags, list):
                filtered_tags = [t for t in tags if t in valid_tags]
                race['tags'] = filtered_tags
                print(f"  -> Applied tags: {filtered_tags}")
                updated_count += 1
            else:
                print(f"  -> Unexpected response format: {tags}")
                race['tags'] = []
                
        except Exception as e:
            print(f"  -> Error: {e}")
            race['tags'] = []
            
        # Rate limiting delay
        time.sleep(1)

    # Save to JSON
    if updated_count > 0:
        with open(races_file, 'w', encoding='utf-8') as f:
            json.dump(races, f, ensure_ascii=False, indent=2)
        print(f"Updated {updated_count} races with tags in data/races.json")
    else:
        print("No races updated.")

if __name__ == '__main__':
    main()
