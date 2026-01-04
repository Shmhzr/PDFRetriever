import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    # Try looking in the current directory just in case
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("Error: GOOGLE_API_KEY not found in .env")
else:
    genai.configure(api_key=api_key)
    try:
        print("Supported models for generateContent:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")
