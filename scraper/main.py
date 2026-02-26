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
    if not date_text:
        return None
        
    date_text = date_text.strip()
    
    # "2026.1.4（日）" or "2026.1.4"
    match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_text)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
        
    # "2026年1月4日" or "2026年01月04日（日）"
    match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', date_text)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
        
    # "2026/1/4" or "2026/01/04"
    match = re.search(r'(\d{4})/(\d{1,2})/(\d{1,2})', date_text)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
        
    return None

# Known external entry sites that we can scrape
ENTRY_SITE_DOMAINS = [
    'moshicom.com',
    'sportsentry.ne.jp',
    'runnet.jp',
    'e-moshicom.com',
]


def extract_entry_period_from_external_site(url):
    """Extract entry period from known external entry sites (moshicom, sportsentry, etc.)."""
    try:
        time.sleep(1)
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10, allow_redirects=True)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')
        text = soup.get_text(separator=' ')

        # Pattern: 2025/11/14(金)20:05 ～ 2026/2/27(金)17:00
        date_range_pattern = r'(\d{4}/\d{1,2}/\d{1,2})\s*(?:[(（][月火水木金土日][)）])?\s*\d{1,2}:\d{2}\s*[～~－ー-]\s*(\d{4}/\d{1,2}/\d{1,2})'
        matches = list(re.finditer(date_range_pattern, text))
        if matches:
            return parse_date(matches[0].group(1)), parse_date(matches[0].group(2))

        # Pattern without time: 2025/11/14 ～ 2026/2/27
        simple_pattern = r'(\d{4}/\d{1,2}/\d{1,2})\s*(?:[(（][月火水木金土日][)）])?\s*[～~－ー-]\s*(\d{4}/\d{1,2}/\d{1,2})'
        matches = list(re.finditer(simple_pattern, text))
        if matches:
            return parse_date(matches[0].group(1)), parse_date(matches[0].group(2))

        # Pattern: 2025年11月14日 ～ 2026年2月27日
        jp_pattern = r'(\d{4}年\d{1,2}月\d{1,2}日)\s*(?:[(（][月火水木金土日][)）])?\s*[～~－ー-]\s*(\d{4}年\d{1,2}月\d{1,2}日)'
        matches = list(re.finditer(jp_pattern, text))
        if matches:
            return parse_date(matches[0].group(1)), parse_date(matches[0].group(2))

    except Exception as e:
        print(f"    Error scraping external site {url}: {e}")

    return None, None


def find_external_entry_links(soup):
    """Find links to external entry sites (moshicom, sportsentry, etc.) from any page."""
    entry_links = []

    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        for domain in ENTRY_SITE_DOMAINS:
            if domain in href:
                entry_links.append(href)
                break

    return entry_links


def extract_dates_from_page_text(text):
    """Try to extract entry period directly from page text."""
    # 1. Look for range patterns: 2025年9月1日（月）～2025年12月15日（月）
    date_range_pattern = r'((?:20\d{2}[年/.-])?\d{1,2}[月/.-]\d{1,2}[日]?)\s*[(（]?[月火水木金土日]?[)）]?\s*[～~-]\s*((?:20\d{2}[年/.-])?\d{1,2}[月/.-]\d{1,2}[日]?)'
    matches = list(re.finditer(date_range_pattern, text))
    for match in matches:
        start_pos = max(0, match.start() - 50)
        end_pos = min(len(text), match.end() + 50)
        context = text[start_pos:end_pos]
        if any(k in context for k in ['申込', '募集', 'エントリー', '受付', '期間']):
            return parse_date(match.group(1)), parse_date(match.group(2))

    # 2. Look for just deadline patterns
    deadline_pattern = r'(?:締切|まで|終了)\s*((?:20\d{2}[年/.-])?\d{1,2}[月/.-]\d{1,2}[日]?)|((?:20\d{2}[年/.-])?\d{1,2}[月/.-]\d{1,2}[日]?)\s*[(（]?[月火水木金土日]?[)）]?\s*(?:締切|まで|終了)'
    matches = list(re.finditer(deadline_pattern, text))
    for match in matches:
        date_str = match.group(1) or match.group(2)
        if not date_str:
            continue
        start_pos = max(0, match.start() - 50)
        end_pos = min(len(text), match.end() + 50)
        context = text[start_pos:end_pos]
        if any(k in context for k in ['申込', '募集', 'エントリー', '受付']):
            return None, parse_date(date_str)

    return None, None


def extract_entry_period_from_url(url):
    """
    Extract entry period from a race detail page.

    Strategy:
    1. First try to find entry dates directly on the page
    2. If not found, look for links to external entry sites (moshicom, sportsentry, etc.)
    3. Follow those links and extract entry dates from there
    """
    try:
        time.sleep(1)
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')
        text = soup.get_text(separator=' ')

        # Step 1: Check meta description first
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            meta_text = meta_desc.get('content')
            start, end = extract_dates_from_page_text(meta_text)
            if start or end:
                return start, end

        # Step 2: Try to find dates directly on the page
        start, end = extract_dates_from_page_text(text)
        if start or end:
            return start, end

        # Step 3: Look for external entry site links and follow them
        entry_links = find_external_entry_links(soup)
        if entry_links:
            # Try moshicom first (most reliable), then others
            moshicom_links = [l for l in entry_links if 'moshicom' in l]
            other_links = [l for l in entry_links if 'moshicom' not in l]

            for link in moshicom_links + other_links:
                print(f"  -> Following entry link: {link}")
                start, end = extract_entry_period_from_external_site(link)
                if start or end:
                    return start, end

    except Exception as e:
        print(f"  Error scraping detail page {url}: {e}")

    return None, None

def determine_entry_status(entry_start, entry_end, parsed_date, today_str):
    if not entry_start and not entry_end:
        return "エントリー前"
        
    end_date_for_status = entry_end if entry_end else parsed_date
    
    if entry_start:
        if entry_start <= today_str <= end_date_for_status:
            return "受付中"
        elif today_str > end_date_for_status:
            return "受付終了"
        elif today_str < entry_start:
            return "エントリー前"
    elif end_date_for_status:
        # If we only have an end date (deadline), and we haven't passed it
        if today_str <= end_date_for_status:
            return "受付中"
        else:
            return "受付終了"
            
    return "エントリー前"

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
            
        # Parse Entry Window from list page
        entry_start, entry_end = None, None
        
        if '～' in entry_str:
            parts = [p.strip() for p in entry_str.split('～')]
            if len(parts) >= 1 and parts[0]:
                entry_start = parse_date(parts[0])
            if len(parts) >= 2 and parts[1]:
                entry_end = parse_date(parts[1])
        
        # Extract Link
        race_url = url # fallback
        a_tag = cells[2].find('a')
        if a_tag and a_tag.get('href'):
            race_url = a_tag.get('href')
            # Handle relative URLs if any
            if race_url.startswith('/'):
                race_url = "https://www.runnersbible.info" + race_url
                
        # Scrape detail page if entry date is missing
        if not entry_start and not entry_end and race_url != url:
            print(f"Scraping detail page for missing dates: {name_str} ({race_url})")
            scraped_start, scraped_end = extract_entry_period_from_url(race_url)
            if scraped_start or scraped_end:
                 print(f"  -> Found dates: {scraped_start} ~ {scraped_end}")
                 entry_start = scraped_start
                 entry_end = scraped_end
        
        # Determine Status
        entry_status = determine_entry_status(entry_start, entry_end, parsed_date, today_str)
        
        # Location Info
        prefecture = extract_prefecture(location_str)
        city = location_str.replace(prefecture, '').strip()
        
        # Discover Distances
        distance_set = set()
        
        # Consider it a full marathon if "フル" or "マラソン" is in the name,
        # but avoid false positives from "ハーフ" or "リレー".
        # Also avoid it if the name explicitly contains other km numbers (e.g. 10k).
        if "フル" in name_str or "マラソン" in name_str and "ハーフ" not in name_str and "リレー" not in name_str and not re.search(r'\d+k', name_str, re.IGNORECASE):
            distance_set.add("フル")
        
        if "ハーフ" in name_str: distance_set.add("ハーフ")
        if "ウルトラ" in name_str: distance_set.add("ウルトラ")
        if "リレー" in name_str: distance_set.add("リレー")
        
        km_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:km|K|k|キロ)', name_str, re.IGNORECASE)
        for km in km_matches:
            # Normalize 42.195km to "フル"
            if float(km) == 42.195:
                distance_set.add("フル")
            else:
                # Remove unnecessary decimals (e.g. 10.0 -> 10)
                clean_km = int(float(km)) if float(km).is_integer() else float(km)
                distance_set.add(f"{clean_km}km")
            
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
