#!/usr/bin/env python3
"""
Parse marathon event HTML files from ランナーズバイブル and extract a master list
of future events (name + URL) to CSV. This serves as the base database for
a scraping pipeline that fetches updated info from official sites.

Uses only Python standard library (no external dependencies).
"""

import csv
import os
import re
from datetime import date
from html.parser import HTMLParser

INPUT_DIR = "/Users/hirachan/Downloads/マラソン大会一覧"
OUTPUT_CSV = os.path.join(INPUT_DIR, "marathon_database.csv")

# Today's date for filtering
TODAY = date(2026, 3, 2)


class MarathonTableParser(HTMLParser):
    """Custom HTML parser to extract marathon event data from table rows."""
    
    def __init__(self):
        super().__init__()
        self.events = []
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.in_link = False
        self.in_header = False
        self.is_month_row = False
        
        self.current_cells = []
        self.current_cell_text = ""
        self.current_link_href = ""
        self.current_link_text = ""
        self.cell_has_link = False
        self.cell_index = 0
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        if tag == 'table' and 'db' in attrs_dict.get('class', ''):
            self.in_table = True
            return
            
        if not self.in_table:
            return
            
        if tag == 'tr':
            self.in_row = True
            self.current_cells = []
            self.cell_index = 0
            css_class = attrs_dict.get('class', '')
            self.is_month_row = 'mtitle' in css_class
            self.in_header = False
            
        elif tag == 'th':
            self.in_header = True
            
        elif tag == 'td' and self.in_row:
            self.in_cell = True
            self.current_cell_text = ""
            self.current_link_href = ""
            self.current_link_text = ""
            self.cell_has_link = False
            
        elif tag == 'a' and self.in_cell:
            self.in_link = True
            self.current_link_href = attrs_dict.get('href', '')
            self.current_link_text = ""
            self.cell_has_link = True
    
    def handle_endtag(self, tag):
        if tag == 'table' and self.in_table:
            self.in_table = False
            return
            
        if not self.in_table:
            return
            
        if tag == 'a' and self.in_link:
            self.in_link = False
            
        elif tag == 'td' and self.in_cell:
            self.in_cell = False
            self.current_cells.append({
                'text': self.current_cell_text.strip(),
                'link_href': self.current_link_href,
                'link_text': self.current_link_text.strip(),
                'has_link': self.cell_has_link,
            })
            self.cell_index += 1
            
        elif tag == 'tr' and self.in_row:
            self.in_row = False
            if not self.in_header and not self.is_month_row and len(self.current_cells) >= 3:
                date_text = self.current_cells[0]['text']
                
                name_cell = self.current_cells[1]
                if name_cell['has_link']:
                    event_name = name_cell['link_text']
                    event_url = name_cell['link_href']
                else:
                    event_name = name_cell['text']
                    event_url = ''
                
                location = self.current_cells[2]['text']
                
                if event_name or date_text:
                    self.events.append({
                        '大会名': event_name,
                        '公式サイトURL': event_url,
                        '開催日': date_text,
                        '開催地': location,
                    })
    
    def handle_data(self, data):
        if self.in_cell:
            self.current_cell_text += data
            if self.in_link:
                self.current_link_text += data


def parse_date(date_str):
    """Parse date string like '2026.3.1(日)' into a date object. Returns None on failure."""
    match = re.match(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_str)
    if match:
        try:
            return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except ValueError:
            return None
    return None


def extract_prefecture(filename):
    """Extract prefecture name from filename."""
    match = re.match(r'^(.+?)マラソン大会一覧', filename)
    if match:
        return match.group(1)
    return ""


def parse_html_file(filepath, prefecture):
    """Parse a single HTML file and return list of event dicts."""
    with open(filepath, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    parser = MarathonTableParser()
    parser.feed(html_content)
    
    for event in parser.events:
        event['都道府県'] = prefecture
    
    return parser.events


def main():
    all_events = []
    past_count = 0
    
    html_files = sorted([
        f for f in os.listdir(INPUT_DIR)
        if f.endswith('.html')
    ])
    
    print(f"Found {len(html_files)} HTML files")
    print(f"Filtering: only events on or after {TODAY}")
    
    for filename in html_files:
        filepath = os.path.join(INPUT_DIR, filename)
        prefecture = extract_prefecture(filename)
        
        events = parse_html_file(filepath, prefecture)
        
        # Filter: keep only future events
        future_events = []
        for e in events:
            event_date = parse_date(e['開催日'])
            if event_date is None or event_date >= TODAY:
                future_events.append(e)
            else:
                past_count += 1
        
        print(f"  {prefecture}: {len(events)}件 → {len(future_events)}件 (過去{len(events) - len(future_events)}件除外)")
        all_events.extend(future_events)
    
    print(f"\n過去の大会を{past_count}件除外")
    print(f"将来の大会: {len(all_events)}件")
    print(f"Writing to: {OUTPUT_CSV}")
    
    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['大会名', '公式サイトURL', '開催日', '開催地', '都道府県'])
        writer.writeheader()
        writer.writerows(all_events)
    
    print("Done!")
    
    # Summary
    from collections import Counter
    pref_counts = Counter(e['都道府県'] for e in all_events)
    print(f"\n=== 都道府県別件数 ({len(pref_counts)}都道府県) ===")
    for pref, count in sorted(pref_counts.items()):
        print(f"  {pref}: {count}件")
    
    # URL coverage
    with_url = sum(1 for e in all_events if e['公式サイトURL'])
    print(f"\n公式サイトURL有: {with_url}/{len(all_events)} ({with_url/len(all_events)*100:.1f}%)")


if __name__ == '__main__':
    main()
