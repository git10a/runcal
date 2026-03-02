#!/usr/bin/env python3
"""
Scrape official marathon websites to update missing entry dates, status, and precise distances.
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

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
RACES_JSON_PATH = os.path.join(DATA_DIR, 'races.json')

def extract_distances_from_text(text, current_distances):
    """
    Search for distance keywords in the page text to refine the distance list.
    Only adds standard distances if they are likely main events.
    """
    new_distances = set(current_distances) if current_distances else set()
    text_lower = text.lower()
    
    # Simple keyword checking on the whole page text.
    # Be careful of false positives, so we only add if we are relatively sure.
    # Often, official pages list events clearly.
    
    if 'ハーフ' in text_lower or '21.0975' in text_lower:
        new_distances.add('ハーフ')
    if 'フル' in text_lower or '42.195' in text_lower:
        new_distances.add('フル')
        
    # Look for patterns like "10km", "5km" but ensure it's a standalone term
    # to avoid things like "10k" matching inside a longer word, though less likely in Japanese.
    for km in [5, 10, 30]:
        if f"{km}km" in text_lower or f"{km}キロ" in text_lower:
            new_distances.add(f"{km}km")
            
    if 'ウルトラ' in text_lower or '100km' in text_lower or '100キロ' in text_lower:
        new_distances.add('ウルトラ')
        
    # Remove 'その他' if we found specific distances
    if len(new_distances) > 1 and 'その他' in new_distances:
        new_distances.remove('その他')
        
    return list(new_distances)

def process_race(race, today_str):
    """
    Attempt to scrape and update a single race's info.
    Returns True if updated, False otherwise.
    """
    url = race.get('url')
    if not url or not url.startswith('http'):
        return False
        
    updated = False
    
    # Try to extract dates if they are missing or if it's currently 'エントリー前'
    # We might want to re-check 'エントリー前' events to see if they've opened.
    if race.get('entry_status') == 'エントリー前' or not race.get('entry_end_date'):
        print(f"Scraping dates for: {race['name']} ({url})")
        start, end = extract_entry_period_from_url(url)
        
        if start or end:
            if start and race.get('entry_start_date') != start:
                race['entry_start_date'] = start
                updated = True
            if end and race.get('entry_end_date') != end:
                race['entry_end_date'] = end
                updated = True
                
            new_status = determine_entry_status(
                race.get('entry_start_date'), 
                race.get('entry_end_date'), 
                race.get('date'), 
                today_str
            )
            if new_status and race.get('entry_status') != new_status:
                race['entry_status'] = new_status
                updated = True
                
            if updated:
                print(f"  -> Updated dates: {start} ~ {end} (Status: {race['entry_status']})")
    
    # Try to extract better distances if we only have 'その他' or are missing common ones
    # We'll do a quick fetch if we haven't already
    if not updated and (not race.get('distance') or race.get('distance') == ['その他']):
        try:
            print(f"Scraping distance info for: {race['name']} ({url})")
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
    print("Starting update script for existing races...")
    
    if not os.path.exists(RACES_JSON_PATH):
        print(f"Error: {RACES_JSON_PATH} not found.")
        return
        
    with open(RACES_JSON_PATH, 'r', encoding='utf-8') as f:
        races = json.load(f)
        
    jst_now = datetime.now(timezone(timedelta(hours=9)))
    today_str = jst_now.strftime("%Y-%m-%d")
    
    updated_count = 0
    
    # To avoid getting blocked, we shouldn't hammer 800 sites at once.
    # In a real environment, you might only check events that are 'エントリー前'
    # For this script run, let's limit it to a few to test, or process all if needed.
    # We will process up to 20 'エントリー前' events for testing.
    
    target_races = [r for r in races if r.get('entry_status') == 'エントリー前' or not r.get('distance') or r.get('distance') == ['その他']]
    print(f"Found {len(target_races)} races that might need updates.")
    print(f"Processing all matches for the pipeline...")
    
    for race in target_races:
        if process_race(race, today_str):
            updated_count += 1
        time.sleep(2) # Politeness delay
        
    if updated_count > 0:
        with open(RACES_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(races, f, ensure_ascii=False, indent=2)
        print(f"\nSuccessfully updated {updated_count} races and saved to {RACES_JSON_PATH}")
    else:
        print("\nNo updates were found/needed.")

if __name__ == '__main__':
    main()
