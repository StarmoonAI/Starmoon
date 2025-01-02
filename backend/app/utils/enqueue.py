import asyncio


def enqueue_bytes(
    bytes_queue: asyncio.Queue,
    device: str,
    type: str | None,
    # base64 or binary
    audio_data: str | bytes | None,
    utterance: str | None,
    boundary: str | None = None,
    task_id: str | None = None,
):
    """Enqueues task_id and audio data"""

    bytes_queue.put_nowait(
        {
            "type": "json",
            "device": device,
            "data": {
                "type": type,
                "audio_data": audio_data,
                "text_data": utterance,
                "boundary": boundary,
                "task_id": task_id,
            },
        }
    )


def enqueue_task(task_id_queue: asyncio.Queue, task_id: str | None = None):
    """Enqueues emotion detection task id for web devices."""
    task_id_queue.put_nowait(task_id)


# async def enqueue_response(
#     response_queue: asyncio.Queue,
#     type: str | None,
#     # base64 or binary
#     audio_data: str | bytes | None,
#     utterance: str | None,
#     boundary: str | None = None,
#     task_id: str | None = None,
# ):
#     """Enqueues response text for web devices."""

#     response_queue.put_nowait(
#         {
#             "data": {
#                 "type": type,
#                 "audio_data": audio_data,
#                 "text_data": utterance,
#                 "boundary": boundary,
#                 "task_id": task_id,
#             },
#         }
#     )
