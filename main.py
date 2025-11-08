from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
def main():
    print("Hello from intelproj!")


if __name__ == "__main__":
    main()
