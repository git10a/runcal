import requests
from bs4 import BeautifulSoup

def test_single_event():
    url = "https://www.sportsentry.ne.jp/event/t/103253"
    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, 'html.parser')
    
    # 開催日 / 募集期間
    # sportsentry events usually have a table with class "eventOutline" or similiar
    for df in soup.select('.eventOutline dl') or soup.select('dl'):
        dt = df.find('dt')
        dd = df.find('dd')
        if dt and dd:
            print(dt.text.strip(), "=>", dd.text.strip()[:100])
            
    # Or specifically
    outline = soup.select_one('.outline-table') or soup.find('table', class_='detailTable') or soup.find('table')
    if outline:
        for tr in outline.find_all('tr'):
            th = tr.find('th')
            td = tr.find('td')
            if th and td:
                print(th.text.strip(), "=>", td.text.strip()[:100])

if __name__ == "__main__":
    test_single_event()
