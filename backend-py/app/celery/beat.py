from app.celery.worker import celery_worker

if __name__ == "__main__":
    celery_worker.start(argv=["celery", "beat", "-l", "info"])
