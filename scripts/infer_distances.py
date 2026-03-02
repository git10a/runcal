import json
import os
import re

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
RACES_JSON_PATH = os.path.join(DATA_DIR, 'races.json')

def infer_distance(name):
    distances = set()
    name_lower = name.lower()
    
    if 'フル' in name_lower or '42.195' in name_lower or ('マラソン' in name and 'ハーフ' not in name and '10km' not in name and '5km' not in name and 'ウルトラ' not in name):
        # 'マラソン' often implies full, but let's be conservative. Actually, just check for フル
        # Many marathons just say '〇〇マラソン', which are full marathons.
        distances.add('フル')
    if 'ハーフ' in name_lower or '21.0975' in name_lower:
        distances.add('ハーフ')
    if '10km' in name_lower or '10キロ' in name_lower or '10k' in name_lower:
        distances.add('10km')
    if '5km' in name_lower or '5キロ' in name_lower or '5k' in name_lower:
        distances.add('5km')
    if '30km' in name_lower or '30キロ' in name_lower or '30k' in name_lower:
        distances.add('30km')
    if 'ウルトラ' in name_lower or '100km' in name_lower or '100キロ' in name_lower or '70km' in name_lower:
        distances.add('ウルトラ')
        
    return list(distances)

def main():
    with open(RACES_JSON_PATH, 'r', encoding='utf-8') as f:
        races = json.load(f)
        
    updated = 0
    for race in races:
        if race.get('distance') == ['その他'] or not race.get('distance'):
            inferred = infer_distance(race['name'])
            if inferred:
                race['distance'] = inferred
                updated += 1
                
    with open(RACES_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(races, f, ensure_ascii=False, indent=2)
        
    print(f"Updated {updated} races with inferred distances.")

if __name__ == '__main__':
    main()
