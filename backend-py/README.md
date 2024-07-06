# Backend

## - Install

replace the .env.copy to .env and replace the values with your own

### Install poetry

```bash
poetry install
```

### Install packages in macOS

```bash
brew install portaudio
brew install ffmpeg
```

## - Run locally

### Run redis in docker
  
```bash
docker run -d -p 6379:6379 redis
```

### Run server (in different terminal)

```bash
poetry run uvicorn app.main:app --ws-ping-interval 600 --ws-ping-timeout 600 --reload
poetry run celery -A app.celery.worker.celery_app worker --loglevel=info
poetry run celery -A app.celery.worker.celery_app flower --port=5555
poetry run celery -A app.celery.worker.celery_app beat --loglevel=info
```

### Run client

```bash
poetry run python test/main.py
```
<!-- 
the local endpoint for text2text is http://127.0.0.1:8000/api/analyze_text
input example:
{
  "text": "I am a software engineer"
} -->