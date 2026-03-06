#!/usr/bin/env python3
"""
Merge marathon_master.csv into races.json, preserving UUIDs, distances, and image_urls
for existing races. The output races.json will contain exactly the races from the CSV.
"""
import json
import csv
import os
import uuid
import re
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
RACES_JSON_PATH = os.path.join(DATA_DIR, 'races.json')
CSV_PATH = os.path.join(DATA_DIR, 'marathon_master.csv')

def parse_date(date_str):
    # e.g., '2026.3.15(日)' -> '2026-03-15'
    match = re.match(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_str)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
    return ""

def main():
    # 1. Load existing races to preserve data (image_url, distance, etc.)
    existing_races = []
    if os.path.exists(RACES_JSON_PATH):
        with open(RACES_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_races = json.load(f)
            
    # Create maps for quick lookup (by URL first, then by name)
    races_by_url = {r['url']: r for r in existing_races if r.get('url')}
    races_by_name = {r['name']: r for r in existing_races if r.get('name')}
    
    new_races = []
    preserved_count = 0
    new_count = 0
    today_str = datetime.now().strftime('%Y年%m月%d日')
    
    # 2. Process the master CSV
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('大会名', '').strip()
            url = row.get('公式サイトURL', '').strip()
            date_str = row.get('開催日', '').strip()
            location = row.get('開催地', '').strip()
            prefecture = row.get('都道府県', '').strip()
            
            # Clean up city (remove prefecture name if it repeats at start)
            city = location
            if prefecture and city.startswith(prefecture):
                city = city[len(prefecture):]
            
            parsed_date = parse_date(date_str)
            
            # Try to find existing race
            existing = None
            if url and url in races_by_url:
                existing = races_by_url[url]
            elif name in races_by_name:
                existing = races_by_name[name]
                
            if existing:
                race = existing.copy()
                race['name'] = name
                race['url'] = url
                race['date'] = parsed_date
                race['prefecture'] = prefecture
                race['city'] = city
                race['source'] = 'csv'
                race['updated_at'] = today_str
                preserved_count += 1
            else:
                # Completely new race
                race = {
                    "id": str(uuid.uuid4()),
                    "name": name,
                    "date": parsed_date,
                    "entry_start_date": None,
                    "entry_end_date": None,
                    "entry_status": "不明",
                    "prefecture": prefecture,
                    "city": city,
                    "distance": ["その他"],
                    "is_jaaf_certified": False,
                    "time_limit": None,
                    "features": None,
                    "url": url,
                    "source": "csv",
                    "updated_at": today_str,
                    "image_url": None
                }
                new_count += 1
            
            new_races.append(race)
            
    # 3. Save the updated races array
    with open(RACES_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(new_races, f, ensure_ascii=False, indent=2)
        
    print(f"Operation complete!")
    print(f"Total races saved: {len(new_races)}")
    print(f" - Matches preserved from existing JSON: {preserved_count}")
    print(f" - Newly added to JSON: {new_count}")
    print(f" - Races with images: {len([r for r in new_races if r.get('image_url')])}")
    print(f"Saved to: {RACES_JSON_PATH}")

if __name__ == '__main__':
    main()
