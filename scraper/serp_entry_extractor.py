#!/usr/bin/env python3
"""
SERP API-based entry date extraction.

Searches Google via Serper.dev for race entry information on external entry sites
(RUNNET, sportsentry, moshicom etc.) without directly accessing those sites.
Extracts entry dates from search snippets using Gemini Flash.

Two-phase approach with a single Gemini call:
  Phase 1: Domain-specific searches (site:runnet.jp, site:sportsentry.ne.jp, etc.)
  Phase 2: Broad search (no site: restriction) — catches official sites, SNS, blogs
  -> All collected snippets are sent to Gemini in one call.
"""

import os
import json
import re
import requests
from google import genai

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SERPER_API_URL = "https://google.serper.dev/search"

SEARCH_DOMAINS = [
    "runnet.jp",
    "sportsentry.ne.jp",
    "moshicom.com",
    "e-moshicom.com",
]

GEMINI_MODEL = "gemini-2.5-flash"

SERP_EXTRACTION_PROMPT = """あなたはマラソン大会のエントリー（参加申込）期間を抽出するアシスタントです。

複数のソース（エントリーサイト、公式サイト、SNS等）のGoogle検索スニペットが与えられます。
以下のルールに従って、指定された大会の回号・開催日に最も合致するエントリー情報を抽出してください：

1. 大会名と開催日が一致する検索結果のみを使用してください。別の回や別の年の情報は無視してください
2. 複数サイトに情報がある場合は、日付が明記されているものを優先してください
3. 日付は YYYY-MM-DD 形式で返してください
4. 年が省略されている場合は、大会開催年や検索コンテキストから推測してください
5. 「定員に達しました」「受付終了」等があれば is_full: true にしてください
6. 日付が見つからなくても、ステータス情報があれば entry_status で返してください：
   - 「受付終了」「定員」「締め切り」→ entry_status: "受付終了"
   - 「受付中」「申込受付中」→ entry_status: "受付中"
   - 「まもなく受付開始」→ entry_status: "エントリー前"
7. 必ず以下のJSON形式のみで回答してください（余計なテキストは不要）：

{
  "entry_start": "YYYY-MM-DD or null",
  "entry_end": "YYYY-MM-DD or null",
  "entry_status": "受付中 or 受付終了 or エントリー前 or null",
  "is_full": false
}"""


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def _get_serper_api_key():
    api_key = os.environ.get("SERPER_API_KEY")
    if api_key:
        return api_key
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('SERPER_API_KEY='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None


def _get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
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


# ---------------------------------------------------------------------------
# Race name cleaning
# ---------------------------------------------------------------------------

def _clean_race_name(race_name):
    """Remove noise from race names for better search accuracy."""
    name = race_name
    name = re.sub(r'【[^】]*】\s*', '', name)       # 【開催中止】, 【レイトエントリー】
    name = re.sub(r'第\d+回[・\s]*', '', name)       # 第33回, 第33回・
    name = re.sub(r'～[^～]*～', '', name)            # ～こどもの日特別ver～
    name = re.sub(r'[（(][^）)]*[kKｋ][mMｍ][）)]', '', name)  # (45ｋｍ), (10km)
    name = re.sub(r'^\d{4}\s*', '', name)            # leading year: "2026稲毛..."
    name = re.sub(r'\s*\d{4}$', '', name)            # trailing year
    name = re.sub(r'\s+', ' ', name).strip()
    return name


# ---------------------------------------------------------------------------
# SERP search
# ---------------------------------------------------------------------------

def _build_query(clean_name, year, domain):
    """Build a Google search query targeting a specific entry site domain."""
    return f'site:{domain} "{clean_name}" {year} エントリー'


def _build_broad_query(clean_name, year):
    """Build a broad Google search query (no site: restriction)."""
    return f'"{clean_name}" {year} エントリー 申込期間'


def _search_serper(query, api_key, num_results=3):
    """Call Serper.dev API and return organic results."""
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "q": query,
        "gl": "jp",
        "hl": "ja",
        "num": num_results,
    }
    try:
        res = requests.post(SERPER_API_URL, headers=headers, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        return data.get("organic", [])
    except Exception as e:
        print(f"  SERP API error: {e}")
        return []


def _extract_snippets(results):
    """Extract and combine snippet texts from search results."""
    snippets = []
    for r in results:
        snippet = r.get("snippet", "")
        title = r.get("title", "")
        if snippet:
            snippets.append(f"タイトル: {title}\nスニペット: {snippet}")
    return "\n\n".join(snippets)


# ---------------------------------------------------------------------------
# LLM extraction from snippets
# ---------------------------------------------------------------------------

def _extract_dates_from_snippets(client, snippets_text, race_name, race_date):
    """Use Gemini Flash to extract entry dates from search snippets."""
    prompt = f"""大会名: {race_name}
開催日: {race_date}

--- Google検索結果のスニペット ---
{snippets_text}

上記のスニペットからエントリー（参加申込）の受付期間を抽出してください。"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "system_instruction": SERP_EXTRACTION_PROMPT,
                "temperature": 0.0,
            }
        )
        return _parse_response(response.text)
    except Exception as e:
        print(f"  SERP+LLM error: {e}")
        return None


def _parse_response(text):
    """Parse the LLM JSON response, handling markdown code fences."""
    if not text:
        return None
    text = text.strip()
    if text.startswith('```'):
        lines = text.split('\n')
        lines = [l for l in lines if not l.strip().startswith('```')]
        text = '\n'.join(lines).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass
        print(f"  Could not parse SERP+LLM response: {text[:100]}")
        return None


def _normalize_result(result):
    """Normalize LLM result: convert "null" strings to None, apply is_full flag."""
    if not result:
        return None, None, None

    entry_start = result.get("entry_start")
    entry_end = result.get("entry_end")
    entry_status = result.get("entry_status")
    is_full = result.get("is_full", False)

    if is_full and not entry_status:
        entry_status = "受付終了"

    if entry_start == "null":
        entry_start = None
    if entry_end == "null":
        entry_end = None
    if entry_status == "null":
        entry_status = None

    return entry_start, entry_end, entry_status


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_entry_dates_with_serp(race_name, race_date, domains=None):
    """
    Search Google via SERP API for entry information.

    Two-phase approach with one Gemini call:
      Phase 1: Domain-specific searches (entry sites)
      Phase 2: Broad search (all sites) — only if Phase 1 found no snippets
    All collected snippets are sent to Gemini in a single call.

    Args:
        race_name: Race name (e.g. "第20回 湘南国際マラソン")
        race_date: Race date in YYYY-MM-DD format
        domains: List of domains to search (defaults to SEARCH_DOMAINS)

    Returns:
        (entry_start, entry_end, entry_status) tuple.
    """
    api_key = _get_serper_api_key()
    if not api_key:
        print("  SERPER_API_KEY not configured, skipping SERP search")
        return None, None, None

    if domains is None:
        domains = SEARCH_DOMAINS

    year = race_date[:4] if race_date else ""
    clean_name = _clean_race_name(race_name)

    all_snippets = []

    # Phase 1: Domain-specific searches
    for domain in domains:
        query = _build_query(clean_name, year, domain)
        print(f"  SERP query: {query}")

        results = _search_serper(query, api_key, num_results=3)
        if not results:
            continue

        snippets_text = _extract_snippets(results)
        if snippets_text:
            all_snippets.append(f"[{domain}]\n{snippets_text}")
            print(f"  -> {len(results)} results from {domain}")

    # Phase 2: Broad search (if domain searches found nothing)
    if not all_snippets:
        query = _build_broad_query(clean_name, year)
        print(f"  SERP broad query: {query}")

        results = _search_serper(query, api_key, num_results=5)
        if results:
            snippets_text = _extract_snippets(results)
            if snippets_text:
                all_snippets.append(f"[broad]\n{snippets_text}")
                print(f"  -> {len(results)} results from broad search")

    if not all_snippets:
        print("  -> No SERP results found")
        return None, None, None

    # Single Gemini call with all collected snippets
    combined_snippets = "\n\n---\n\n".join(all_snippets)

    try:
        client = _get_gemini_client()
    except RuntimeError as e:
        print(f"  {e}")
        return None, None, None

    result = _extract_dates_from_snippets(client, combined_snippets, race_name, race_date)
    entry_start, entry_end, entry_status = _normalize_result(result)

    has_info = entry_start or entry_end or entry_status
    if has_info:
        src = "SERP"
        print(f"  -> {src} found: {entry_start} ~ {entry_end} (status: {entry_status})")
    else:
        # Phase 1 had snippets but Gemini couldn't extract dates.
        # Try Phase 2 (broad) as additional context.
        has_domain_snippets = any(not s.startswith("[broad]") for s in all_snippets)
        already_has_broad = any(s.startswith("[broad]") for s in all_snippets)

        if has_domain_snippets and not already_has_broad:
            query = _build_broad_query(clean_name, year)
            print(f"  SERP broad query: {query}")

            results = _search_serper(query, api_key, num_results=5)
            if results:
                broad_snippets = _extract_snippets(results)
                if broad_snippets:
                    print(f"  -> {len(results)} results from broad search")
                    combined_all = combined_snippets + "\n\n---\n\n" + f"[broad]\n{broad_snippets}"
                    result = _extract_dates_from_snippets(client, combined_all, race_name, race_date)
                    entry_start, entry_end, entry_status = _normalize_result(result)

                    has_info = entry_start or entry_end or entry_status
                    if has_info:
                        print(f"  -> SERP+broad found: {entry_start} ~ {entry_end} (status: {entry_status})")

    return entry_start, entry_end, entry_status
