import os
import time
from dotenv import load_dotenv

# Load .env.local from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

from google import genai
from PIL import Image

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
An isometric 3D miniature render of a floating island map, designed to represent the geographic shape and iconic course route of the {event_name}. The style is a sophisticated, highly detailed miniature diorama with rich PBR textures, prioritizing realism within a stylized form.

Lighting is SOFT, DIFFUSED daylight, evoking a crisp, clear race-day morning. Shadows are present but gentle and soft, creating a natural and inviting atmosphere.

The marathon course loop is the most prominent feature, tracing the route of the {event_name} like a 3D topographic map. It is rendered as a clearly defined, slightly elevated ribbon of realistic asphalt material integrated into the landscape, showing realistic grain and subtle signs of wear. 

To emphasize the event, the course features subtle, scaled-down race infrastructure: a realistic start/finish gantry, tiny water stations, and distance markers. The route is populated with a moderate number of miniature runners wearing race bibs, maintaining a sense of a focused race without feeling overly cluttered. 

The surrounding environment is populated with scaled-down, realistic recognizable landmarks, terrains, and street elements specific to the location of the {event_name}. Miniature trees, tiny bridges, and buildings are rendered with architectural precision to evoke the actual atmosphere of running that specific race. A few scattered miniature spectators are cheering near key landmarks.

The background is a clean, soft daylight sky gradient. The composition is square (1:1 aspect ratio). The floating island is centered with comfortable empty margins, ensuring the entire shape is visible. NO text, NO typography.
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
