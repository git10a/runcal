import os
import json
import time
from dotenv import load_dotenv
from google import genai
from urllib.parse import urlparse

# 環境変数の読み込み
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'races.json')
IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'races')

try:
    client = genai.Client()
except Exception as e:
    print(f"Error initializing Gemini client: {e}")
    exit(1)

def generate_race_image(event_name, output_path):
    prompt = f"""
{event_name}のコース（地理的形状を模したエリア）を、厚みの小さいスクエア型の台座の上に表現した、アイソメトリック3Dミニチュア・ジオラマ。

スタイルは「洗練された、極めて詳細なミニチュア・ジオラマ」とし、リッチなPBRテクスチャを用いて、デフォルメされた造形の中にもリアリズムを追求してください。

ライティングは、柔らかく拡散した自然光とし、穏やかでナチュラルな雰囲気を作り出します。影は存在させつつも、コントラストの強い鋭いものではなく、優しくソフトな質感にします。

ジオラマの側面は、白く丁寧に仕上げられた「展示台」として表現してください。

ランニングコースは、「{event_name}」マラソンが開催される地域の特性に合わせて作ってください。大会コースの正式ルートに準拠はしなくて構いませんが、スタート地点のアーチは配置してください。

コースは、景観に溶け込みつつも境界がはっきりした、「アスファルト素材」で表現します。アスファルトの質感はやわらかめに表現してください。

コース上には、ミニチュアのランナーを20人ほどまばら配置してください。それぞれカラフルなウェアをきています。


周囲の環境には、「{event_name}」マラソンの開催場所特有のリアルな特徴を縮小して配置しますが、それらの縮尺は実際より大きめにしてください。その地域の特徴ある建造物や自然、観光資源を優先的に配置してください。実際のコースにそれらがなくても、配置していいです。ただし、その地域にない資源は配置しないでください。ただ、木々を入れる場合は多くても全体の3割までとします。カラフルにコースを彩ってください。

背景は、清潔感のある柔らかな日中の空のグラデーションにします。構図はスクエア（アスペクト比1:1）です。

ジオラマ全体は中央に配置してください。

テキストやタイポグラフィは一切含めないでください。
"""
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[prompt],
        )
        for part in response.parts:
            if part.inline_data is not None:
                image = part.as_image()
                image.save(output_path)
                return True
        return False
    except Exception as e:
        print(f"API Error: {e}")
        return False

def main():
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        races = json.load(f)

    print(f"Total races loaded: {len(races)}")
    
    updated = False
    for i, race in enumerate(races):
        image_url = race.get('image_url')

        # デフォルト画像であったり、まだ生成された個別画像（/images/races/{id}.jpg系）がなければ生成対象とする
        if not image_url or image_url.endswith('default_race.png') or image_url.endswith('default_race.jpg') or '142691369' in image_url:
            output_filename = f"{race['id']}.jpg"
            output_filepath = os.path.join(IMAGES_DIR, output_filename)

            # 万が一ファイルが既に存在していればスキップ (races.jsonの更新漏れ対策)
            if os.path.exists(output_filepath):
                # JSON側の参照だけ更新しておく
                race['image_url'] = f"/images/races/{output_filename}"
                updated = True
                print(f"[{i+1}/{len(races)}] {race['name']} - 既存画像ファイルを通報: {output_filepath}")
                continue

            # APIコスト・時間節約のため、受付中の大会のみ生成する（※全件生成したい場合は条件をコメントアウト）
            if race.get('entry_status') != '受付中':
                print(f"[{i+1}/{len(races)}] {race['name']} - スキップ (受付中ではないため)")
                continue

            print(f"[{i+1}/{len(races)}] {race['name']} の画像を生成中...")
            success = generate_race_image(race['name'], output_filepath)

            if success:
                print(f"  -> 生成成功！保存先: {output_filepath}")
                race['image_url'] = f"/images/races/{output_filename}"
                updated = True
                
                # 途中経過を保存しておく（途中で落ちても大丈夫なように）
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(races, f, ensure_ascii=False, indent=2)
                
                # レートリミット対策（Gemini APIに合わせて調整）
                time.sleep(12)
            else:
                print(f"  -> 生成失敗...")
        else:
            # すでに固有の画像がある場合はスキップ
            print(f"[{i+1}/{len(races)}] {race['name']} - スキップ (画像生成済み)")

    if updated:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(races, f, ensure_ascii=False, indent=2)
        print("Done. races.json saved successfully.")
    else:
        print("Done. No new images were generated.")

if __name__ == '__main__':
    main()
