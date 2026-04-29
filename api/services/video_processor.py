"""
Video Processor Service - Process uploaded videos for violence detection
"""
import cv2
import time
from streaming.frame_buffer import FrameBuffer
from utils.preprocess import preprocess_frame
from api.models.model_manager import ModelManager

# Violence detection thresholds (same as main.py)
VIOLENCE_THRESHOLD = 0.45
CONSECUTIVE_REQUIRED = 2
FRAME_SKIP = 1


async def process_uploaded_video(file_path: str, session_id: str):
    """
    Process an uploaded video file and yield results as async generator

    Args:
        file_path: Path to the uploaded video file
        session_id: Session ID for tracking

    Yields:
        Tuple of (event_type, data) for SSE streaming
    """

    # Initialize components
    model_manager = ModelManager()
    violence_model = model_manager.get_violence_model()
    report_model = model_manager.get_report_model()

    buffer = FrameBuffer(max_size=16)
    cap = cv2.VideoCapture(file_path)

    if not cap.isOpened():
        yield ("error", {"message": "Failed to open video file"})
        return

    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    # Send initial info
    yield ("info", {
        "total_frames": total_frames,
        "fps": fps,
        "session_id": session_id
    })

    # Processing state
    frame_count = 0
    processed_count = 0
    consecutive_violence_count = 0
    last_crime_label = None
    alerts = []

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                break

            frame_count += 1

            # Skip frames (process every 2nd frame)
            if frame_count % FRAME_SKIP != 0:
                continue

            # Preprocess frame
            processed_frame = preprocess_frame(frame)
            buffer.add(processed_frame)

            # Process when buffer is full (16 frames)
            if buffer.is_full():
                frames_to_process = buffer.get_frames()

                # Run violence detection
                violence_score, crime_label = violence_model.predict(frames_to_process)

                # Clear buffer after prediction
                buffer.buffer.clear()

                processed_count += 1
                is_violence = violence_score >= VIOLENCE_THRESHOLD

                # Generate scene description for meaningful scores
                scene_description = None
                if violence_score > 0.3:
                    scene_description = report_model.generate_scene_description(
                        violence_score,
                        crime_label=crime_label if is_violence else "Suspicious Activity"
                    )

                # Update consecutive violence count
                if is_violence:
                    consecutive_violence_count += 1
                    last_crime_label = crime_label
                else:
                    consecutive_violence_count = 0
                    last_crime_label = None

                # Send processing update
                yield ("processing", {
                    "frame": frame_count,
                    "total_frames": total_frames,
                    "progress": (frame_count / total_frames) * 100,
                    "violence_score": round(violence_score, 3),
                    "crime_label": crime_label if is_violence else None,
                    "is_violence": is_violence,
                    "consecutive_count": consecutive_violence_count,
                    "scene_description": scene_description,
                    "timestamp": time.time()
                })

                # Generate alert if violence is confirmed
                if consecutive_violence_count >= CONSECUTIVE_REQUIRED:
                    # Generate report and scene description
                    report = report_model.generate_report(
                        violence_score,
                        camera_name=f"Uploaded Video - {last_crime_label}"
                    )

                    scene_description_alert = report_model.generate_scene_description(
                        violence_score,
                        crime_label=last_crime_label
                    )

                    alert_data = {
                        "frame": frame_count,
                        "violence_score": round(violence_score, 3),
                        "crime_label": last_crime_label,
                        "report": report,
                        "scene_description": scene_description_alert,
                        "timestamp": time.time()
                    }

                    alerts.append(alert_data)

                    # Send alert event
                    yield ("alert", alert_data)

                    # Reset consecutive count
                    consecutive_violence_count = 0

    except Exception as e:
        yield ("error", {"message": f"Processing error: {str(e)}"})

    finally:
        cap.release()

    # Send summary
    yield ("summary", {
        "total_frames": frame_count,
        "processed_windows": processed_count,
        "alerts": len(alerts),
        "alert_details": alerts
    })
