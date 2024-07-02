from app.core.config import settings
from celery import Celery

celery_app = Celery(
    "celery_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.celery.tasks"],
)


celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # beat_schedule=settings.CELERY_BEAT_SCHEDULE, # enable beat periodic task
)

# # Auto-discover celery_tasks from the 'app.celery_tasks' module
# celery_worker.autodiscover_celery_tasks(["app.celery_tasks"])
