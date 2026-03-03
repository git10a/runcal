import requests
from bs4 import BeautifulSoup
import uuid
import re
import json
import os
import time
import hashlib
from datetime import datetime, timezone, timedelta

# Import the image generator
try:
    import image_generator
except ImportError:
    image_generator = None

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
        return "不明"

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

    return "不明"

def scrape_runners_bible_page(url, default_distance="フル"):
    """Scrape a single RunnersBible page."""
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
            "source": "runnersbible",
            "updated_at": jst_now.strftime("%Y年%m月%d日")
        })

    print(f"Properly parsed {len(races)} upcoming races.")
    return races


def scrape_runners_bible():
    """Scrape all RunnersBible pages (Marathon + Ultra)."""
    all_races = []

    # Marathon page
    marathon_races = scrape_runners_bible_page(
        "https://www.runnersbible.info/DB/Marathon.html",
        default_distance="フル"
    )
    all_races.extend(marathon_races)

    # Ultra Marathon page
    time.sleep(1)  # Be polite
    ultra_races = scrape_runners_bible_page(
        "https://www.runnersbible.info/DB/UltraMarathon.html",
        default_distance="ウルトラ"
    )
    all_races.extend(ultra_races)

    print(f"Total from RunnersBible: {len(all_races)} races")
    return all_races


def normalize_race_name(name):
    """Normalize race name for deduplication."""
    # Remove common suffixes and variations
    name = re.sub(r'[（(].*?[)）]', '', name)  # Remove parenthetical content
    name = re.sub(r'\d{4}', '', name)  # Remove years
    name = re.sub(r'第\d+回', '', name)  # Remove "第X回"
    name = re.sub(r'\s+', '', name)  # Remove whitespace
    name = name.strip()
    return name.lower()


def deduplicate_races(races):
    """Remove duplicate races based on name + date."""
    seen = {}
    unique_races = []

    for race in races:
        # Create a key from normalized name + date
        norm_name = normalize_race_name(race['name'])
        key = f"{norm_name}_{race['date']}"

        if key not in seen:
            seen[key] = race
            unique_races.append(race)
        else:
            # Prefer RunnersBible data (has more details like entry dates, time limit)
            existing = seen[key]
            if race.get('source') == 'runnersbible' and existing.get('source') != 'runnersbible':
                # Replace with RunnersBible version
                idx = unique_races.index(existing)
                unique_races[idx] = race
                seen[key] = race
            elif existing.get('source') == 'runnersbible':
                # Keep existing RunnersBible version
                pass
            else:
                # Both are from same source or neither is RunnersBible
                # Keep the one with more info
                if race.get('entry_start_date') and not existing.get('entry_start_date'):
                    idx = unique_races.index(existing)
                    unique_races[idx] = race
                    seen[key] = race

    return unique_races


def main():
    print("Starting marathon race scraping...")
    print("=" * 50)

    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    json_path = os.path.join(data_dir, 'races.json')

    public_images_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'images', 'races')
    os.makedirs(public_images_dir, exist_ok=True)

    all_races = []

    # 0. Load existing races to prevent overwriting manual data
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                existing_races = json.load(f)
                all_races.extend(existing_races)
                print(f"Loaded {len(existing_races)} existing races from {json_path}")
        except json.JSONDecodeError:
            print(f"Warning: Could not parse {json_path}. Starting fresh.")

    # 1. Scrape RunnersBible (Marathon + Ultra)
    print("\n[1/1] Scraping RunnersBible (Marathon + Ultra)...")
    runnersbible_races = scrape_runners_bible()
    all_races.extend(runnersbible_races)

    # 3. Deduplicate
    print("\n" + "=" * 50)
    print(f"Total races before deduplication: {len(all_races)}")
    unique_races = deduplicate_races(all_races)
    print(f"Total races after deduplication: {len(unique_races)}")

    if unique_races:
        unique_races.sort(key=lambda x: x['date'])

        # --- Image Generation Step ---
        print("\nProcessing images for races...")
        for race in unique_races:
            # Generate a consistent filename based on an MD5 hash of the race name
            hash_str = hashlib.md5(race['name'].encode('utf-8')).hexdigest()
            filename = f"race_{hash_str}.png"
            image_filepath = os.path.join(public_images_dir, filename)
            generated_url = f"/images/races/{filename}"

            # If it already has an external HTTP url, leave it alone
            if race.get('image_url') and race['image_url'].startswith('http'):
                continue
                
            # Otherwise, clear it first
            race.pop('image_url', None)

            if os.path.exists(image_filepath):
                # Image already exists
                race['image_url'] = generated_url
            else:
                if image_generator:
                    success = image_generator.generate_and_save_race_image(race['name'], image_filepath)
                    if success:
                        race['image_url'] = generated_url
                        # Add a small delay to avoid hitting API rate limits immediately
                        time.sleep(2)

                        # Incrementally save the JSON file so the UI can update while processing
                        with open(json_path, 'w', encoding='utf-8') as f:
                            json.dump(unique_races, f, ensure_ascii=False, indent=2)

        # --- End Image Generation Step ---

        # Remove source field before saving (internal use only)
        for race in unique_races:
            race.pop('source', None)

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(unique_races, f, ensure_ascii=False, indent=2)
        print(f"\nSuccessfully saved {len(unique_races)} races to {json_path}")
    else:
        print("No races generated.")

if __name__ == "__main__":
    main()
