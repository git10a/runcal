#!/usr/bin/env python3
"""
Scrape official marathon websites to update missing entry dates, status, and precise distances.
Uses a 2-tier approach:
  1. Regex-based extraction (fast, free)
  2. LLM-based extraction via Gemini Flash (smart, cheap fallback)
Run this periodically to keep `data/races.json` fresh.
"""

import json
import os
import time
import requests
import re
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta

# Re-use logic from the original scraper where applicable
from main import (
    parse_date,
    determine_entry_status,
    extract_entry_period_from_url
)

# LLM-based extraction (Gemini Flash)
try:
    from llm_entry_extractor import extract_entry_dates_with_llm
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    print("Warning: LLM extractor not available. Install google-genai to enable.")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
RACES_JSON_PATH = os.path.join(DATA_DIR, 'races.json')

def extract_distances_from_text(text, current_distances):
    """
    Search for distance keywords in the page text to refine the distance list.
    Only adds standard distances if they are likely main events.
    """
    new_distances = set(current_distances) if current_distances else set()
    text_lower = text.lower()
    
    if 'ハーフ' in text_lower or '21.0975' in text_lower:
        new_distances.add('ハーフ')
    if 'フル' in text_lower or '42.195' in text_lower:
        new_distances.add('フル')
        
    for km in [5, 10, 30]:
        if f"{km}km" in text_lower or f"{km}キロ" in text_lower:
            new_distances.add(f"{km}km")
            
    if 'ウルトラ' in text_lower or '100km' in text_lower or '100キロ' in text_lower:
        new_distances.add('ウルトラ')
        
    if len(new_distances) > 1 and 'その他' in new_distances:
        new_distances.remove('その他')
        
    return list(new_distances)

def _apply_entry_dates(race, start, end, today_str):
    """Apply extracted entry dates to a race and update status. Returns True if changed."""
    updated = False
    if start and race.get('entry_start_date') != start:
        race['entry_start_date'] = start
        updated = True
    if end and race.get('entry_end_date') != end:
        race['entry_end_date'] = end
        updated = True
        
    if updated or start or end:
        new_status = determine_entry_status(
            race.get('entry_start_date'), 
            race.get('entry_end_date'), 
            race.get('date'), 
            today_str
        )
        if new_status and race.get('entry_status') != new_status:
            race['entry_status'] = new_status
            updated = True
    return updated

def process_race(race, today_str, use_llm=True):
    """
    Attempt to scrape and update a single race's info.
    Uses regex first, then LLM as fallback.
    Returns True if updated, False otherwise.
    """
    url = race.get('url')
    if not url or not url.startswith('http'):
        return False
        
    updated = False
    needs_entry_dates = (
        race.get('entry_status') in ('不明', 'エントリー前') 
        or not race.get('entry_end_date')
    )
    
    if needs_entry_dates:
        # Tier 1: Try regex-based extraction (fast, free)
        print(f"[Regex] {race['name']}")
        start, end = extract_entry_period_from_url(url)
        
        if start or end:
            updated = _apply_entry_dates(race, start, end, today_str)
            if updated:
                print(f"  -> Regex found: {start} ~ {end} (Status: {race['entry_status']})")
        
        # Tier 2: If regex failed, try LLM
        if not updated and use_llm and LLM_AVAILABLE:
            print(f"[LLM] {race['name']}")
            try:
                start, end = extract_entry_dates_with_llm(url, race['name'], race.get('date', ''))
                if start or end:
                    updated = _apply_entry_dates(race, start, end, today_str)
                    if updated:
                        print(f"  -> LLM found: {start} ~ {end} (Status: {race['entry_status']})")
                time.sleep(1)  # LLM rate limiting
            except Exception as e:
                print(f"  -> LLM error: {e}")
    
    # Try to extract better distances if we only have 'その他'
    if not updated and (not race.get('distance') or race.get('distance') == ['その他']):
        try:
            print(f"[Distance] {race['name']}")
            res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            res.encoding = res.apparent_encoding
            soup = BeautifulSoup(res.text, 'html.parser')
            text = soup.get_text(separator=' ')
            
            new_dist = extract_distances_from_text(text, race.get('distance'))
            if new_dist and set(new_dist) != set(race.get('distance', [])):
                race['distance'] = new_dist
                updated = True
                print(f"  -> Updated distances: {new_dist}")
        except Exception as e:
            print(f"  -> Error scraping distances: {e}")
            
    if updated:
        race['updated_at'] = datetime.now().strftime("%Y年%m月%d日")
        
    return updated

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Update race entry dates and info')
    parser.add_argument('--no-llm', action='store_true', help='Disable LLM extraction')
    parser.add_argument('--limit', type=int, default=0, help='Max races to process (0 = all)')
    args = parser.parse_args()

    use_llm = not args.no_llm and LLM_AVAILABLE
    print(f"Starting update script (LLM: {'ON' if use_llm else 'OFF'})...")
    
    if not os.path.exists(RACES_JSON_PATH):
        print(f"Error: {RACES_JSON_PATH} not found.")
        return
        
    with open(RACES_JSON_PATH, 'r', encoding='utf-8') as f:
        races = json.load(f)
        
    jst_now = datetime.now(timezone(timedelta(hours=9)))
    today_str = jst_now.strftime("%Y-%m-%d")
    
    updated_count = 0
    
    # Target: races with unknown/missing entry info, or missing distances
    target_races = [
        r for r in races 
        if r.get('entry_status') in ('不明', 'エントリー前')
        or not r.get('distance') 
        or r.get('distance') == ['その他']
    ]
    
    if args.limit > 0:
        target_races = target_races[:args.limit]
    
    print(f"Found {len(target_races)} races to process.")
    
    for i, race in enumerate(target_races):
        print(f"\n[{i+1}/{len(target_races)}] ", end="")
        if process_race(race, today_str, use_llm=use_llm):
            updated_count += 1
            # Incremental save every 10 updates
            if updated_count % 10 == 0:
                with open(RACES_JSON_PATH, 'w', encoding='utf-8') as f:
                    json.dump(races, f, ensure_ascii=False, indent=2)
                print(f"  (Saved {updated_count} updates so far)")
        time.sleep(1)  # Politeness delay
        
    if updated_count > 0:
        with open(RACES_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(races, f, ensure_ascii=False, indent=2)
        print(f"\nSuccessfully updated {updated_count} races and saved to {RACES_JSON_PATH}")
    else:
        print("\nNo updates were found/needed.")

if __name__ == '__main__':
    main()
