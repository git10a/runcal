import requests
from bs4 import BeautifulSoup

url = "https://www.runnersbible.info/DB/Marathon.html"
res = requests.get(url)
res.encoding = res.apparent_encoding
soup = BeautifulSoup(res.text, 'html.parser')
table = soup.find('table')
rows = table.find_all('tr') if table else []
print(f"Total rows on Marathon page: {len(rows)}")

url2 = "https://www.runnersbible.info/DB/UltraMarathon.html"
res2 = requests.get(url2)
res2.encoding = res2.apparent_encoding
soup2 = BeautifulSoup(res2.text, 'html.parser')
table2 = soup2.find('table')
rows2 = table2.find_all('tr') if table2 else []
print(f"Total rows on Ultra page: {len(rows2)}")

# Check dates
import re
def parse_date(date_text):
    if not date_text: return None
    date_text = date_text.strip()
    match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', date_text)
    if match: return f"{match.group(1)}-{int(match.group(2)):02d}-{int(match.group(3)):02d}"
    match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', date_text)
    if match: return f"{match.group(1)}-{int(match.group(2)):02d}-{int(match.group(3)):02d}"
    match = re.search(r'(\d{4})/(\d{1,2})/(\d{1,2})', date_text)
    if match: return f"{match.group(1)}-{int(match.group(2)):02d}-{int(match.group(3)):02d}"
    return None

all_dates = []
for row in rows[1:]:
    cells = row.find_all(['td', 'th'])
    if len(cells) == 7:
        d = parse_date(cells[0].text)
        if d: all_dates.append(d)

print(f"Parsed {len(all_dates)} dates from Marathon page.")
future = [d for d in all_dates if d >= '2026-03-02']
past = [d for d in all_dates if d < '2026-03-02']
print(f"Future dates: {len(future)}")
print(f"Past dates: {len(past)}")

