from typing import Union

from fastapi import FastAPI
from app.api.endpoints import analyze_text
from dotenv import load_dotenv
import os

app = FastAPI()

app.include_router(analyze_text.router, prefix="/api", tags=["LLM response"])


# Define the path to the .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
# Load the .env file
load_dotenv(dotenv_path=env_path)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
