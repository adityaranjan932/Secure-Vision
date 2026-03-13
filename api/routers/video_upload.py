"""
Video Upload Router - Handle video file uploads and SSE streaming
"""
import os
import uuid
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from api.services.video_processor import process_uploaded_video

router = APIRouter()

# In-memory session storage
sessions = {}

# Maximum file size: 500MB
MAX_FILE_SIZE = 500 * 1024 * 1024


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for violence detection processing
    """

    # Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")

    # Generate session ID
    session_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1] or ".mp4"
    file_path = f"uploads/{session_id}{file_extension}"

    try:
        # Save uploaded file
        with open(file_path, "wb") as f:
            content = await file.read()

            # Check file size
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
                )

            f.write(content)

        # Store session info
        sessions[session_id] = {
            "status": "uploaded",
            "file_path": file_path,
            "filename": file.filename,
            "results": []
        }

        return {
            "session_id": session_id,
            "status": "uploaded",
            "message": "Video uploaded successfully. Processing will begin shortly."
        }

    except Exception as e:
        # Clean up file if error occurs
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/process/{session_id}")
async def process_video(session_id: str):
    """
    Server-Sent Events endpoint for streaming video processing results
    """

    # Check if session exists
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]
    file_path = session["file_path"]

    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    async def event_generator():
        """Generate SSE events for video processing"""
        try:
            # Update session status
            sessions[session_id]["status"] = "processing"

            # Process video and stream results
            async for event_type, data in process_uploaded_video(file_path, session_id):
                # Format as SSE
                yield f"event: {event_type}\n"
                yield f"data: {json.dumps(data)}\n\n"

            # Mark session as complete
            sessions[session_id]["status"] = "completed"

            # Send completion event
            yield f"event: complete\n"
            yield f"data: {json.dumps({'status': 'completed', 'message': 'Processing finished'})}\n\n"

        except Exception as e:
            # Send error event
            error_data = {"error": str(e)}
            yield f"event: error\n"
            yield f"data: {json.dumps(error_data)}\n\n"

            sessions[session_id]["status"] = "error"

        finally:
            # Clean up file after processing
            # Note: In production, you might want to keep files for some time
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"Cleaned up file: {file_path}")
                except Exception as e:
                    print(f"Failed to delete file {file_path}: {e}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/status/{session_id}")
async def get_session_status(session_id: str):
    """Get the current status of a processing session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    return sessions[session_id]
