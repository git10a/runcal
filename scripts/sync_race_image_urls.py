import json
import os
import re

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_FILE = os.path.join(BASE_DIR, "data", "races.json")
IMAGES_DIR = os.path.join(BASE_DIR, "public", "images", "races")


def main() -> None:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        races = json.load(f)

    # Map race ID -> extension for existing local images.
    local_images: dict[str, str] = {}
    for filename in os.listdir(IMAGES_DIR):
        match = re.match(r"^([0-9a-fA-F-]+)\.(jpg|jpeg|png|webp)$", filename)
        if not match:
            continue
        race_id, ext = match.group(1), match.group(2)
        local_images[race_id] = ext

    updated = 0
    unchanged = 0
    missing = 0

    for race in races:
        race_id = race.get("id")
        if not race_id:
            continue

        ext = local_images.get(race_id)
        if not ext:
            missing += 1
            continue

        next_url = f"/images/races/{race_id}.{ext}"
        if race.get("image_url") == next_url:
            unchanged += 1
            continue

        race["image_url"] = next_url
        updated += 1

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(races, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"updated={updated}")
    print(f"unchanged={unchanged}")
    print(f"missing_local_file={missing}")


if __name__ == "__main__":
    main()
