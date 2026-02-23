import requests
from bs4 import BeautifulSoup

url = "https://www.sportsentry.ne.jp/event/t/102010"
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.content, 'html.parser')

print("--- Tables & DLs ---")
for table in soup.find_all(['table', 'dl']):
    for row in table.find_all(['tr', 'dt']):
        th_text = row.text.strip()
        td = row.find_next_sibling('td') or row.find_next_sibling('dd')
        if not td:
            if row.name == 'tr':
                td = row.find('td')
                th_text = row.find('th').text.strip() if row.find('th') else ""
            if not td:
                continue
        td_text = td.text.strip()
        print(f"[{th_text}] => {td_text[:100]}")

print("\n--- Meta Description ---")
meta_desc = soup.find('meta', attrs={'name': 'description'})
if meta_desc:
    print(meta_desc.get('content'))

print("\n--- PR/Catchphrase ---")
pr_box = soup.select_one('.evCatchphrase') or soup.select_one('.prBox') or soup.find('div', class_='catchphrase')
if pr_box:
    print(pr_box.text.strip())
