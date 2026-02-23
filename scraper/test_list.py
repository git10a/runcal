from bs4 import BeautifulSoup
import re

with open('search_page.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')
    
links = soup.find_all('a', href=re.compile(r'^/event/t/\d+'))

# Deduplicate
unique_hrefs = set()
for l in links[:20]:
    if l['href'] in unique_hrefs: continue
    unique_hrefs.add(l['href'])
    
    parent = l.find_parent('div', class_='articleBox') or l.find_parent('li') or l.parent
    print("---")
    print(parent.text.strip().replace('\n', ' ')[:300])
