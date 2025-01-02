from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
import uuid


from app.db.supabase import create_supabase_client

router = APIRouter()

@router.post("/rag")
async def process_rag(files: List[UploadFile] = File(...)):  # Changed function name from 'rag' to 'process_rag'
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        supabase = create_supabase_client()

        # Make sure 'documents' matches your actual Supabase bucket name
        BUCKET_NAME = "rag"  # or whatever your bucket is actually named

        for file in files:
            content = await file.read()
            file_id = str(uuid.uuid4())
            file_extension = file.filename.split('.')[-1]
            # unique_filename = f"{file_id}.{file_extension}"
            
            # Use the correct bucket name
            supabase.storage \
                .from_(BUCKET_NAME) \
                .upload(
                    path=file.filename,
                    file=content,
                    file_options={"content-type": file.content_type}
                )

        return JSONResponse(
            status_code=200,
            content={"message": "Files uploaded successfully"}
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading files: {str(e)}"
        )