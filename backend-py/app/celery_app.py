# app/celery_app.py

import os

from app.core.config import settings
from celery import Celery

celery_app = Celery(
    "tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# # Auto-discover tasks from the 'app.tasks' module
# celery_app.autodiscover_tasks(["app.tasks"])
