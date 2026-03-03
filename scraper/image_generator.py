import os
from dotenv import load_dotenv

# Load .env.local from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

from google import genai

# Initialize the Gemini client. 
# It expects GEMINI_API_KEY environment variable to be set.
try:
    client = genai.Client()
except Exception as e:
    client = None
    print(f"Warning: Could not initialize Gemini client. Images will not be generated. Error: {e}")

def generate_and_save_race_image(event_name, output_path):
    """
    Generate an image for a marathon event using Gemini API (gemini-3-pro-image-preview)
    and save it to output_path.
    
    Returns True if successful, False otherwise.
    """
    if not client:
        print("Gemini client not initialized. Skipping image generation.")
        return False

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

    print(f"  Generating image for '{event_name}'...")
    
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[prompt],
        )

        for part in response.parts:
            if part.inline_data is not None:
                image = part.as_image()
                image.save(output_path)
                print(f"  -> Successfully generated and saved to {output_path}")
                return True
                
        print(f"  -> Failed to generate image (no inline_data in response).")
        return False
        
    except Exception as e:
        print(f"  -> Error generating image: {e}")
        return False
