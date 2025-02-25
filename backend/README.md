# Backend

The backend is a Python application that uses FastAPI and Redis. We also use Celery for background tasks and Hugging Face for emotion detection.

## Installation

### Install poetry

create a new virtual environment (Python 3.11)

```bash
pip install poetry
poetry install
```

### Install packages in macOS (for audio)

```bash
brew install portaudio
brew install ffmpeg
```

## Run locally

### Run redis in docker
  
```bash
docker run -p 6379:6379 --name starmoon-redis -d redis
# docker run -d -p 6379:6379 redis
```

### Run server (in different terminals)

```bash
poetry run uvicorn app.main:app --ws-ping-interval 600 --ws-ping-timeout 600 --reload --host 0.0.0.0
poetry run celery -A app.celery.worker.celery_app worker --loglevel=info
poetry run celery -A app.celery.worker.celery_app flower --port=5555
poetry run celery -A app.celery.worker.celery_app beat --loglevel=info
```

### Run the test server

```bash
poetry run python test/main.py
```
<!-- 
the local endpoint for text2text is http://127.0.0.1:8000/api/analyze_text
input example:
{
  "text": "I am a software engineer"
} -->