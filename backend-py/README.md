# Backend

## - Install

replace the .env.copy to .env and replace the values with your own

### Install poetry

```bash
poetry install
```

### Install STT in macOS

```bash
brew install portaudio or conda install portaudio.
```

## - Run locally

### Run redis in docker
  
```bash
docker run -d -p 6379:6379 redis
```

### Run server (in different terminal)

```bash
uvicorn app.main:app --reload
celery -A app.celery.worker.celery_app worker --loglevel=info
celery -A app.celery.worker.celery_app flower --port=5555
```

### Run client

```bash
poetry run python test/client.py
```
<!-- 
the local endpoint for text2text is http://127.0.0.1:8000/api/analyze_text
input example:
{
  "text": "I am a software engineer"
} -->