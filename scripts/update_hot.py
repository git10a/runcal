import json
import re

with open('data/race_details.json', 'r', encoding='utf-8') as f:
    details = json.load(f)

with open('data/races.json', 'r', encoding='utf-8') as f:
    races = json.load(f)

hot_race_ids = set()

def extract_capacity(text):
    if not text: return 0
    text = text.replace(',', '')
    numbers = [int(n) for n in re.findall(r'\d+', text)]
    if numbers:
        return max(numbers)
    return 0

for key, race_detail in details.items():
    is_hot = False
    cap_text = race_detail.get('race_details', {}).get('capacity', '')
    cap_num = extract_capacity(cap_text)
    
    if cap_num >= 10000:
        is_hot = True
        
    # More lenient keyword matching for popular races
    overview = race_detail.get('overview', '')
    if '人気' in overview or '最大規模' in overview or 'マンモス' in overview or '抽選' in overview or '世界最大' in overview:
        if cap_num >= 3000 or cap_num == 0: # If capacity is not specified but text says it's big/popular
            is_hot = True
            
    # Always mark Nagoya Women's as HOT explicitly if missed
    # Check both key and overview/name for '名古屋ウィメンズ'
    venue = race_detail.get('race_details', {}).get('venue') or ''
    if '名古屋ウィメンズ' in key or '名古屋ウィメンズ' in venue or '名古屋ウィメンズ' in overview:
        is_hot = True

    # The actual ID used in races.json doesn't always match the "race_id" field in race_details.json sometimes, let's also match by name!
    # Let's collect names of hot races
    if is_hot:
        hot_race_ids.add(race_detail.get('race_id'))
        # Store name without spaces for easier matching
        hot_race_name = key.replace(' ', '').replace('　', '')
        hot_race_ids.add(hot_race_name)

print(f"Found {len(hot_race_ids)} hot races identifiers.")

updated_count = 0
for race in races:
    race_name_clean = race['name'].replace(' ', '').replace('　', '')
    
    is_hot = False
    if race['id'] in hot_race_ids:
        is_hot = True
    
    # Check by name matching if ID didn't match
    for hot_id in hot_race_ids:
        if isinstance(hot_id, str):
             # Try replacing '2026' to normalize for this specific year variation
             normalize_hot = hot_id.replace('2026', '')
             normalize_race = race_name_clean.replace('2026', '')
             if (normalize_hot in normalize_race or normalize_race in normalize_hot) and normalize_hot != '':
                 is_hot = True
                 break

    if '名古屋ウィメンズ' in race['name']:
         is_hot = True
             
    if is_hot:
        race['is_hot'] = True
        updated_count += 1
    elif 'is_hot' in race:
        del race['is_hot']

print(f"Updated {updated_count} races in races.json")

with open('data/races.json', 'w', encoding='utf-8') as f:
    json.dump(races, f, ensure_ascii=False, indent=2)
