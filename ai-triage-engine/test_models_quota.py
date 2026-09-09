import os
import sys
from google import genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

models_to_test = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
]

for model in models_to_test:
    print(f"Testing model: {model} ...")
    try:
        response = client.models.generate_content(
            model=model,
            contents="Say hello"
        )
        print(f"SUCCESS with {model}: {response.text.strip()}")
    except Exception as e:
        print(f"FAILED with {model}: {str(e)[:200]}")
