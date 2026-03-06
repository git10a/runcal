import requests
from bs4 import BeautifulSoup
import json
import re
import time
import uuid
from datetime import datetime, timezone, timedelta

def extract_prefecture(location_text):
    """Extract prefecture from location text."""
    prefs_list = [
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
        "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
        "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
        "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
        "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ]

    # Also check without suffix for English names
    pref_map = {
        "Hokkaido": "北海道", "Tokyo": "東京都", "Osaka": "大阪府", "Kyoto": "京都府",
        "Aichi": "愛知県", "Fukuoka": "福岡県", "Kanagawa": "神奈川県", "Saitama": "埼玉県",
        "Chiba": "千葉県", "Hyogo": "兵庫県", "Hiroshima": "広島県", "Shizuoka": "静岡県",
        "Niigata": "新潟県", "Nagano": "長野県", "Gunma": "群馬県", "Tochigi": "栃木県",
        "Ibaraki": "茨城県", "Fukushima": "福島県", "Miyagi": "宮城県", "Iwate": "岩手県",
        "Aomori": "青森県", "Akita": "秋田県", "Yamagata": "山形県", "Yamanashi": "山梨県",
        "Gifu": "岐阜県", "Mie": "三重県", "Shiga": "滋賀県", "Nara": "奈良県",
        "Wakayama": "和歌山県", "Tottori": "鳥取県", "Shimane": "島根県", "Okayama": "岡山県",
        "Yamaguchi": "山口県", "Tokushima": "徳島県", "Kagawa": "香川県", "Ehime": "愛媛県",
        "Kochi": "高知県", "Saga": "佐賀県", "Nagasaki": "長崎県", "Kumamoto": "熊本県",
        "Oita": "大分県", "Miyazaki": "宮崎県", "Kagoshima": "鹿児島県", "Okinawa": "沖縄県",
        "Toyama": "富山県", "Ishikawa": "石川県", "Fukui": "福井県"
    }

    # Check Japanese prefecture names
    for p in prefs_list:
        if p in location_text:
            return p

    # Check English prefecture names
    for eng, jpn in pref_map.items():
        if eng in location_text:
            return jpn

    return "不明"


def extract_distances(name, description=""):
    """Extract distance categories from race name."""
    text = f"{name} {description}".lower()
    distance_set = set()

    # Full marathon
    if "フルマラソン" in text or "full marathon" in text or "marathon" in text.lower():
        if "ハーフ" not in text and "half" not in text.lower():
            distance_set.add("フル")

    # Half marathon
    if "ハーフ" in text or "half" in text.lower():
        distance_set.add("ハーフ")

    # Ultra marathon
    if "ウルトラ" in text or "ultra" in text.lower():
        distance_set.add("ウルトラ")

    # Trail
    if "トレイル" in text or "trail" in text.lower():
        distance_set.add("トレイル")

    # Relay
    if "リレー" in text or "relay" in text.lower() or "駅伝" in text:
        distance_set.add("リレー")

    # Specific km distances
    km_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:km|k|キロ)', text, re.IGNORECASE)
    for km in km_matches:
        km_val = float(km)
        if km_val == 42.195 or km_val == 42:
            distance_set.add("フル")
        elif km_val == 21.0975 or km_val == 21:
            distance_set.add("ハーフ")
        elif km_val > 42.195:
            distance_set.add("ウルトラ")
        else:
            clean_km = int(km_val) if km_val.is_integer() else km_val
            distance_set.add(f"{clean_km}km")

    if not distance_set:
        distance_set.add("その他")

    return list(distance_set)


def scrape_ahotu_page(page_num=1):
    """Scrape a single page from Ahotu."""
    url = f"https://www.ahotu.com/ja/calendar/running/japan?page={page_num}"
    print(f"  Fetching page {page_num}: {url}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'ja,en;q=0.9'
    }

    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')

        # Find JSON-LD script
        json_ld_script = soup.find('script', type='application/ld+json')
        if not json_ld_script:
            print(f"    No JSON-LD found on page {page_num}")
            return [], False

        json_data = json.loads(json_ld_script.string)

        # Handle different JSON-LD structures
        events = []
        if isinstance(json_data, list):
            for item in json_data:
                if item.get('@type') == 'ItemList':
                    events = item.get('itemListElement', [])
                    break
        elif json_data.get('@type') == 'ItemList':
            events = json_data.get('itemListElement', [])

        # Check for next page
        has_next = soup.find('link', rel='next') is not None

        return events, has_next

    except Exception as e:
        print(f"    Error fetching page {page_num}: {e}")
        return [], False


def scrape_ahotu():
    """Scrape all races from Ahotu Japan running calendar."""
    print("Starting Ahotu scraping...")

    all_events = []
    page = 1
    max_pages = 20  # Safety limit

    while page <= max_pages:
        events, has_next = scrape_ahotu_page(page)

        if not events:
            break

        all_events.extend(events)
        print(f"    Found {len(events)} events on page {page} (total: {len(all_events)})")

        if not has_next:
            break

        page += 1
        time.sleep(1)  # Be polite

    print(f"Scraped {len(all_events)} events from Ahotu")
    return all_events


def convert_ahotu_to_race(event_item):
    """Convert Ahotu event item to our race format."""
    try:
        event = event_item.get('item', event_item)

        if event.get('@type') != 'Event':
            return None

        name = event.get('name', '')
        if not name:
            return None

        # Parse date
        start_date = event.get('startDate', '')
        if not start_date:
            return None

        # Handle ISO format date
        try:
            if 'T' in start_date:
                date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                date_obj = datetime.strptime(start_date[:10], '%Y-%m-%d')
            parsed_date = date_obj.strftime('%Y-%m-%d')
        except:
            return None

        # Skip past events
        jst_now = datetime.now(timezone(timedelta(hours=9)))
        today_str = jst_now.strftime("%Y-%m-%d")
        if parsed_date < today_str:
            return None

        # Location
        location = event.get('location', {})
        location_name = ""
        prefecture = "不明"
        city = ""

        if isinstance(location, dict):
            location_name = location.get('name', '')
            address = location.get('address', {})
            if isinstance(address, dict):
                locality = address.get('addressLocality', '')
                location_name = f"{location_name} {locality}".strip()
        elif isinstance(location, str):
            location_name = location

        prefecture = extract_prefecture(location_name)
        city = location_name.replace(prefecture, '').strip()

        # URL
        race_url = event.get('url', '')

        # Distances
        distances = extract_distances(name)

        # Image
        image_url = event.get('image', '')
        if isinstance(image_url, list) and image_url:
            image_url = image_url[0]

        from main import generate_race_id
        return {
            "id": generate_race_id(name, parsed_date),
            "name": name,
            "date": parsed_date,
            "entry_start_date": None,
            "entry_end_date": None,
            "entry_status": "エントリー前",  # Default, will be updated
            "prefecture": prefecture,
            "city": city[:50] if city else None,
            "distance": distances,
            "is_jaaf_certified": False,  # Ahotu doesn't have this info
            "time_limit": None,
            "features": None,
            "url": race_url,
            "image_url": image_url if image_url else None,
            "source": "ahotu",
            "updated_at": jst_now.strftime("%Y年%m月%d日")
        }

    except Exception as e:
        print(f"    Error converting event: {e}")
        return None


def get_ahotu_races():
    """Get all races from Ahotu and convert to our format."""
    events = scrape_ahotu()

    races = []
    for event in events:
        race = convert_ahotu_to_race(event)
        if race:
            races.append(race)

    print(f"Converted {len(races)} valid races from Ahotu")
    return races


if __name__ == "__main__":
    races = get_ahotu_races()
    print(f"\nTotal races: {len(races)}")

    # Print sample
    if races:
        print("\nSample race:")
        print(json.dumps(races[0], ensure_ascii=False, indent=2))
