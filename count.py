import json
with open('data/races.json') as f:
    races = json.load(f)
print(f"Total races: {len(races)}")
import datetime
today = datetime.date.today().strftime("%Y-%m-%d")
future_races = [r for r in races if r['date'] >= today]
print(f"Future races (>= {today}): {len(future_races)}")
past_races = [r for r in races if r['date'] < today]
print(f"Past races (< {today}): {len(past_races)}")

from collections import Counter
years = Counter([r['date'][:4] for r in races])
print(f"Years: {years}")
