import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=api_key)

test_models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-flash-latest"
]

print("Testing models:")
for model_name in test_models:
    try:
        m = genai.get_model(model_name)
        print(f"SUCCESS: {model_name} exists")
    except Exception as e:
        print(f"FAILED: {model_name} - {e}")
