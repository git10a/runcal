#!/usr/bin/env python3
"""
PNG画像をWebP形式に一括変換するスクリプト。
元のPNGは削除し、races.json内の画像パスも更新する。
"""

import os
import json
import glob
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow がインストールされていません。以下のコマンドでインストールしてください:")
    print("  pip install Pillow")
    exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
IMAGES_DIR = PROJECT_ROOT / "public" / "images" / "races"
RACES_JSON = PROJECT_ROOT / "data" / "races.json"


def convert_png_to_webp(png_path: Path, quality: int = 80) -> Path:
    """Convert a single PNG to WebP and return the new path."""
    webp_path = png_path.with_suffix(".webp")
    with Image.open(png_path) as img:
        img.save(webp_path, "WEBP", quality=quality, method=6)
    
    original_size = png_path.stat().st_size
    new_size = webp_path.stat().st_size
    reduction = (1 - new_size / original_size) * 100
    print(f"  {png_path.name} → {webp_path.name} ({original_size // 1024}KB → {new_size // 1024}KB, {reduction:.0f}% 削減)")
    
    # Remove the original PNG
    png_path.unlink()
    return webp_path


def update_races_json():
    """Update image_url fields in races.json from .png to .webp."""
    with open(RACES_JSON, "r", encoding="utf-8") as f:
        races = json.load(f)
    
    updated_count = 0
    for race in races:
        if race.get("image_url") and race["image_url"].endswith(".png"):
            race["image_url"] = race["image_url"].rsplit(".", 1)[0] + ".webp"
            updated_count += 1
    
    with open(RACES_JSON, "w", encoding="utf-8") as f:
        json.dump(races, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ races.json: {updated_count} 件の画像パスを .webp に更新しました")


def main():
    print("🖼️  PNG → WebP 一括変換を開始します...\n")
    
    png_files = sorted(IMAGES_DIR.glob("*.png"))
    if not png_files:
        print("変換対象のPNGファイルが見つかりません。")
        return
    
    print(f"📁 {len(png_files)} 件のPNGファイルを変換します:\n")
    
    total_original = 0
    total_new = 0
    
    for png_path in png_files:
        original_size = png_path.stat().st_size
        webp_path = convert_png_to_webp(png_path)
        new_size = webp_path.stat().st_size
        total_original += original_size
        total_new += new_size
    
    total_reduction = (1 - total_new / total_original) * 100
    print(f"\n📊 合計: {total_original // (1024*1024)}MB → {total_new // (1024*1024)}MB ({total_reduction:.0f}% 削減)")
    
    # Update races.json paths
    update_races_json()
    
    print("\n🎉 完了!")


if __name__ == "__main__":
    main()
