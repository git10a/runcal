import requests
from bs4 import BeautifulSoup
import uuid
import re
import json
import os
import time
from datetime import datetime, timezone, timedelta

def extract_prefecture(text):
    prefs_list = [
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
        "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
        "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
        "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
        "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ]
    for p in prefs_list:
        if p in text:
            return p
    return "不明"

def parse_date(date_text):
    # e.g., "2026.1.4（日）" -> "2026-01-04"
    match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_text)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
    return None

def scrape_runners_bible():
    url = "https://www.runnersbible.info/DB/Marathon.html"
    print(f"Fetching data from {url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    res = requests.get(url, headers=headers, timeout=10)
    res.encoding = res.apparent_encoding # Fix garbled text
    soup = BeautifulSoup(res.text, 'html.parser')
    
    table = soup.find('table')
    if not table:
        print("Could not find the target table.")
        return []
        
    rows = table.find_all('tr')
    print(f"Found {len(rows)} rows to process.")
    
    races = []
    jst_now = datetime.now(timezone(timedelta(hours=9)))
    today_str = jst_now.strftime("%Y-%m-%d")
    
    for row in rows:
        cells = row.find_all(['td', 'th'])
        # Actual race rows have 7 columns
        if len(cells) != 7:
            continue
            
        tds = [td.text.strip().replace('\n', ' ') for td in cells]
        
        # Skip header row
        if tds[0] == '開催日':
            continue
            
        date_str = tds[0]
        entry_str = tds[1]
        name_str = tds[2]
        location_str = tds[3]
        time_limit_str = tds[4]
        certified_str = tds[5]
        features_str = tds[6]
        
        # Parse Dates
        parsed_date = parse_date(date_str)
        if not parsed_date or parsed_date < today_str:
            continue # Skip past events or unparseable dates
            
        # Parse Entry Window
        entry_start, entry_end = None, None
        if '～' in entry_str:
            parts = [p.strip() for p in entry_str.split('～')]
            if len(parts) >= 1 and parts[0]:
                entry_start = parse_date(parts[0] + '（月）') # dummy day of week to reuse parse_date
            if len(parts) >= 2 and parts[1]:
                entry_end = parse_date(parts[1] + '（月）')
        
        # Determine Status
        entry_status = "エントリー前"
        if entry_start and entry_end:
            if entry_start <= today_str <= entry_end:
                entry_status = "受付中"
            elif today_str > entry_end:
                entry_status = "受付終了"
        
        # Extract Link
        race_url = url # fallback
        a_tag = cells[2].find('a')
        if a_tag and a_tag.get('href'):
            race_url = a_tag.get('href')
            # Handle relative URLs if any
            if race_url.startswith('/'):
                race_url = "https://www.runnersbible.info" + race_url
                
        # Location Info
        prefecture = extract_prefecture(location_str)
        city = location_str.replace(prefecture, '').strip()
        
        # Discover Distances
        distance_set = set()
        if "フル" in name_str or "マラソン" in name_str and "ハーフ" not in name_str and "リレー" not in name_str and not re.search(r'\d+k', name_str, re.IGNORECASE):
            distance_set.add("フル")
        
        if "ハーフ" in name_str: distance_set.add("ハーフ")
        if "ウルトラ" in name_str: distance_set.add("ウルトラ")
        if "リレー" in name_str: distance_set.add("リレー")
        
        km_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:km|K|k|キロ)', name_str, re.IGNORECASE)
        for km in km_matches:
            distance_set.add(f"{km}km")
            
        distance = list(distance_set)
        if not distance: distance.append("その他")
        
        # Certification
        is_jaaf = "公認" in certified_str
        
        # Clean features length
        if len(features_str) > 50:
            features_str = features_str[:50] + "..."
            
        races.append({
            "id": str(uuid.uuid4()),
            "name": name_str,
            "date": parsed_date,
            "entry_start_date": entry_start,
            "entry_end_date": entry_end,
            "entry_status": entry_status,
            "prefecture": prefecture,
            "city": city,
            "distance": distance,
            "is_jaaf_certified": is_jaaf,
            "time_limit": time_limit_str or None,
            "features": features_str or None,
            "url": race_url,
            "updated_at": jst_now.strftime("%Y年%m月%d日")
        })
        
    print(f"Properly parsed {len(races)} upcoming races.")
    return races

def main():
    print("Starting RunnersBible marathon scraping...")
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    json_path = os.path.join(data_dir, 'races.json')
    
    new_races = scrape_runners_bible()
    
    if new_races:
        new_races.sort(key=lambda x: x['date'])
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(new_races, f, ensure_ascii=False, indent=2)
        print(f"Successfully generated and saved {len(new_races)} real races to {json_path}")
    else:
        print("No races generated.")

if __name__ == "__main__":
    main()
