import asyncio
import json
import time
from fastapi import APIRouter, HTTPException
from app.models.text_input import TextInput
from fastapi.responses import StreamingResponse
from app.models.text_analysis_output import TextAnalysisOutput
from app.services.llm_response import openai_response

router = APIRouter()


async def stream_processor(response):
    async for chunk in response:
        if len(chunk.choices) > 0:
            delta = chunk.choices[0].delta
            print("delta", delta)
            if delta.content:
                yield delta.content


@router.post("/analyze_text")
async def analyze_text(input: TextInput):
    try:
        response = await openai_response(input_text=input.text)

        # metadata = {}
        # response = {"original_text": input.text, "analysis": metadata}
        # return StreamingResponse(stream_processor(response), media_type="text/plain")
        return StreamingResponse(
            stream_processor(response), media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
