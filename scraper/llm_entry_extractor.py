#!/usr/bin/env python3
"""
LLM-based entry date extraction using Gemini Flash.
Fetches race pages and uses Gemini to extract entry period dates
even from free-form text that regex patterns can't handle.
"""

import os
import json
import time
import requests
from bs4 import BeautifulSoup
from google import genai
from urllib.parse import urljoin

# ---------------------------------------------------------------------------
# Gemini client setup
# ---------------------------------------------------------------------------

def _get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Try loading from .env.local
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith('GEMINI_API_KEY='):
                        api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
                        break
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not found")
    return genai.Client(api_key=api_key)


MODEL = "gemini-2.5-flash"
ENTRY_SITE_DOMAINS = ('runnet.jp', 'sportsentry.ne.jp', 'moshicom.com', 'e-moshicom.com')

SYSTEM_PROMPT = """あなたはマラソン大会のウェブページからエントリー（参加申込）情報を抽出するアシスタントです。

以下のルールに従ってください：
1. ページ内容からエントリー受付開始日と受付終了日を探してください
2. 日付は YYYY-MM-DD 形式で返してください
3. 年が省略されている場合は、大会開催日から推測してください
4. 日付が見つからなくても、以下のようなステータス情報があれば entry_status で返してください：
   - 「エントリーは終了しました」「受付終了」「定員に達しました」「募集は締め切りました」→ entry_status: "受付終了"
   - 「受付中」「エントリー受付中」「申込受付中」→ entry_status: "受付中"
   - 「まもなく受付開始」「近日公開」→ entry_status: "エントリー前"
5. エントリー情報がページ内に見つからない場合は、ページ内のリンクからエントリーページ（RUNNET、moshicom、sportsentry等）のURLを特定してください
6. 必ず以下のJSON形式で回答してください（余計なテキストは不要）：

日付が見つかった場合：
{"entry_start": "YYYY-MM-DD", "entry_end": "YYYY-MM-DD", "entry_status": null}

日付はないがステータスがわかる場合：
{"entry_start": null, "entry_end": null, "entry_status": "受付終了"}

エントリー情報がなくリンクを見つけた場合：
{"entry_url": "https://..."}

何も見つからない場合：
{"entry_start": null, "entry_end": null, "entry_status": null}
"""

# ---------------------------------------------------------------------------
# Page fetching
# ---------------------------------------------------------------------------

def _parse_html(html, base_url):
    """Parse HTML and return (text, links_text)."""
    soup = BeautifulSoup(html, 'html.parser')

    # Get readable text (limit to 4000 chars to save tokens)
    text = soup.get_text(separator='\n')
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    text = '\n'.join(lines)
    if len(text) > 4000:
        text = text[:4000]

    # Get links with text
    links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        link_text = a.get_text(separator=" ", strip=True)
        # Try to get alt text from images inside the link
        if not link_text:
            img = a.find('img')
            if img:
                link_text = img.get('alt', '').strip()
                
        if href.startswith('javascript:'):
            continue

        full_url = urljoin(base_url, href)

        # If no visible text (image button, icon link), still keep known entry links.
        if not link_text and any(domain in full_url for domain in ENTRY_SITE_DOMAINS):
            link_text = "entry-link"

        if link_text:
            links.append(f"[{link_text}]({full_url})")
    links_text = '\n'.join(links[:30])

    return text, links_text


def _is_blocked(html):
    """Check if the response is a Cloudflare block page."""
    blocked_signals = [
        'Attention Required! | Cloudflare',
        'you have been blocked',
        'cf-error-details',
        'Enable JavaScript and cookies to continue',
    ]
    return any(s in html for s in blocked_signals)


def _fetch_with_playwright(url):
    """Fetch page using Chromium with anti-detection (bypasses Cloudflare)."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=False,
                args=['--disable-blink-features=AutomationControlled']
            )
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1280, 'height': 720}
            )
            page = context.new_page()
            page.goto(url, wait_until='domcontentloaded', timeout=20000)
            page.wait_for_timeout(3000)
            html = page.content()
            browser.close()
            return html
    except Exception as e:
        print(f"  Playwright error: {e}")
        return None


def _fetch_page(url):
    """Fetch a page and return (text_content, links_text).
    Falls back to Playwright if Cloudflare blocks the request."""
    try:
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15, allow_redirects=True)
        res.encoding = res.apparent_encoding

        if _is_blocked(res.text):
            print(f"  Cloudflare blocked, retrying with browser...")
            html = _fetch_with_playwright(url)
            if html:
                return _parse_html(html, url)
            return None, None

        return _parse_html(res.text, url)
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None, None


# ---------------------------------------------------------------------------
# LLM extraction
# ---------------------------------------------------------------------------

def extract_entry_dates_with_llm(url, race_name, race_date):
    """
    Use Gemini Flash to extract entry info from a race page.
    
    Returns (entry_start, entry_end, entry_status).
    - entry_start/entry_end: YYYY-MM-DD strings or None
    - entry_status: "受付中", "受付終了", "エントリー前", or None
    
    Uses a 2-step approach:
    1. Analyze the main race page
    2. If an entry URL is found, follow it and analyze that page too
    """
    client = _get_client()

    # Step 1: Fetch and analyze main page
    text, links_text = _fetch_page(url)
    if not text:
        return None, None, None

    prompt = f"""大会名: {race_name}
開催日: {race_date}
大会ページURL: {url}

--- ページ内容 ---
{text}

--- ページ内のリンク ---
{links_text}

このページからエントリー（参加申込）の受付期間やステータスを抽出してください。"""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config={
                "system_instruction": SYSTEM_PROMPT,
                "temperature": 0.0,
            }
        )

        result = _parse_response(response.text)
        if result is None:
            return None, None, None

        # If we got dates or status, return them
        has_dates = result.get('entry_start') or result.get('entry_end')
        has_status = result.get('entry_status')
        if has_dates or has_status:
            print(f"  -> LLM found: {result.get('entry_start')} ~ {result.get('entry_end')} (status: {result.get('entry_status')})")
            return result.get('entry_start'), result.get('entry_end'), result.get('entry_status')

        # Step 2: If we got an entry URL, follow it
        entry_url = result.get('entry_url')
        if entry_url:
            print(f"  -> LLM found entry URL: {entry_url}")
            time.sleep(1)
            return _extract_from_entry_page(client, entry_url, race_name, race_date)

    except Exception as e:
        print(f"  LLM error: {e}")

    return None, None, None


def _extract_from_entry_page(client, entry_url, race_name, race_date):
    """Step 2: Extract dates/status from the entry page itself."""
    text, _ = _fetch_page(entry_url)
    if not text:
        return None, None, None

    prompt = f"""大会名: {race_name}
開催日: {race_date}
エントリーページURL: {entry_url}

--- エントリーページ内容 ---
{text}

このエントリーページから受付期間（開始日・終了日）やステータスを抽出してください。"""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config={
                "system_instruction": SYSTEM_PROMPT,
                "temperature": 0.0,
            }
        )

        result = _parse_response(response.text)
        if result:
            has_dates = result.get('entry_start') or result.get('entry_end')
            has_status = result.get('entry_status')
            if has_dates or has_status:
                print(f"  -> LLM found from entry page: {result.get('entry_start')} ~ {result.get('entry_end')} (status: {result.get('entry_status')})")
                return result.get('entry_start'), result.get('entry_end'), result.get('entry_status')

    except Exception as e:
        print(f"  LLM error on entry page: {e}")

    return None, None, None


def _parse_response(text):
    """Parse the LLM JSON response, handling markdown code fences."""
    if not text:
        return None
    text = text.strip()
    # Remove markdown code fences if present
    if text.startswith('```'):
        lines = text.split('\n')
        # Remove first and last lines (```json and ```)
        lines = [l for l in lines if not l.strip().startswith('```')]
        text = '\n'.join(lines).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in the text
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass
        print(f"  Could not parse LLM response: {text[:100]}")
        return None
