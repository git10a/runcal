import requests
from bs4 import BeautifulSoup

url = "https://www.runnersbible.info/DB/Marathon.html"
res = requests.get(url)
res.encoding = res.apparent_encoding
soup = BeautifulSoup(res.text, 'html.parser')

table = soup.find('table')
rows = table.find_all('tr')

for i in range(20):
    if len(rows) > i:
        cells = [td.text.strip().replace('\n', ' ') for td in rows[i].find_all(['td', 'th'])]
        print(f"Row {i} (len {len(cells)}):", cells)
        
        # also print link href if presents in '大 会 名' column (index 2 usually)
        if len(cells) == 7 and i > 0:
            tds = rows[i].find_all('td')
            if len(tds) > 2:
                a_tag = tds[2].find('a')
                if a_tag:
                    print(f"  Link: {a_tag.get('href')}")
