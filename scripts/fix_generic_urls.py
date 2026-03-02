import csv
import os
import time
from duckduckgo_search import DDGS

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
CSV_PATH = os.path.join(DATA_DIR, 'marathon_master.csv')

def load_csv():
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

def save_csv(data, fieldnames):
    with open(CSV_PATH, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

def normalize_name(name):
    import re
    name = re.sub(r'第\d+(\.\d+)?回\s*', '', name)
    name = name.split('in')[0].strip()
    return name

def perform_search(event_name, original_url):
    search_name = normalize_name(event_name)
    query = f'{search_name} 大会'
    print(f"Searching for: {query}")
    try:
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=10, region='jp-jp')
            for result in results:
                url = result.get('href', '')
                title = result.get('title', '')
                
                # Exclude broad aggregators if there's no specific path, or basic search engine pages
                if 'wikipedia.org' in url or 'search.yahoo.co.jp' in url or 'google.com' in url or 'youtube.com' in url:
                    continue
                # Also exclude marathon general calendar aggregators that just point to their own calendar
                if url.endswith('-marathon.jp/') or 'marathon-calendar' in url:
                    pass

                # Skip if it's strictly the generic URL
                if url.rstrip('/') == original_url.rstrip('/') and url.count('/') <= 3:
                    continue
                
                # Good domains
                good_domains = ['runnet.jp', 'sportsentry.ne.jp', 'e-marathon.jp', 'sportsone.jp', 'moshicom.com', 'facebook.com', 'instagram.com', 'smartsports.jp', 'sportsaid-japan.org', 'triathlonclub.jp']
                
                if any(d in url for d in good_domains) or (search_name[:3] in title) or (search_name[:3] in url):
                    return url
    except Exception as e:
        print(f"Error searching {event_name}: {e}")
    
    return None

def main():
    races = load_csv()
    if not races:
        return

    fieldnames = list(races[0].keys())

    url_to_names = {}
    for r in races:
        url = r.get('公式サイトURL', '').strip()
        if url:
            if url not in url_to_names:
                url_to_names[url] = []
            url_to_names[url].append(r['大会名'])

    generic_urls = {
        url for url, names in url_to_names.items()
        if len(set(names)) > 1
    }

    print(f"Found {len(generic_urls)} generic URLs to fix.")
    
    updates = 0
    for idx, race in enumerate(races):
        url = race.get('公式サイトURL', '').strip()
        name = race.get('大会名', '').strip()
        
        if url in generic_urls:
            print(f"Fixing [{idx+1}/{len(races)}]: {name} (Current: {url})")
            new_url = perform_search(name, url)
            
            if new_url:
                print(f"  -> Found new URL: {new_url}")
                races[idx]['公式サイトURL'] = new_url
                updates += 1
            else:
                print(f"  -> Could not find a specific URL. Keeping original.")
            
            time.sleep(1) # Be nice to DDG
            
    if updates > 0:
        save_csv(races, fieldnames)
        print(f"Saved {updates} updated URLs to CSV.")
        print("Run scripts/merge_marathons.py to apply to JSON.")
    else:
        print("No URLs were updated.")

if __name__ == '__main__':
    main()
