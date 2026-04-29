import asyncio
import cv2
import time
from streaming.frame_buffer import FrameBuffer
from utils.preprocess import preprocess_frame
from api.models.model_manager import ModelManager

VIOLENCE_THRESHOLD = 0.45
CONSECUTIVE_REQUIRED = 2
FRAME_SKIP = 1


async def process_uploaded_video(file_path: str, session_id: str):
    model_manager = ModelManager()
    violence_model = model_manager.get_violence_model()
    report_model = model_manager.get_report_model()

    buffer = FrameBuffer(max_size=16)
    cap = cv2.VideoCapture(file_path)

    if not cap.isOpened():
        yield ("error", {"message": "Failed to open video file"})
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    yield ("info", {
        "total_frames": total_frames,
        "fps": fps,
        "session_id": session_id
    })

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
            if frame_count % FRAME_SKIP != 0:
                continue

            processed_frame = preprocess_frame(frame)
            buffer.add(processed_frame)

            if buffer.is_full():
                frames_to_process = buffer.get_frames()

                # Run violence detection in thread (CPU-bound)
                violence_score, crime_label = await asyncio.to_thread(
                    violence_model.predict, frames_to_process
                )

                buffer.buffer.clear()
                processed_count += 1
                is_violence = violence_score >= VIOLENCE_THRESHOLD

                # Calculate exact video timestamp (MM:SS)
                video_time_seconds = frame_count / fps if fps > 0 else 0
                video_time = f"{int(video_time_seconds // 60):02d}:{int(video_time_seconds % 60):02d}"

                # Generate scene description only for meaningful scores
                scene_description = None
                if violence_score > 0.3:
                    scene_description = await asyncio.to_thread(
                        report_model.generate_scene_description,
                        violence_score,
                        crime_label if is_violence else "Suspicious Activity",
                        video_time
                    )

                if is_violence:
                    consecutive_violence_count += 1
                    last_crime_label = crime_label
                else:
                    consecutive_violence_count = 0
                    last_crime_label = None

                yield ("processing", {
                    "frame": frame_count,
                    "total_frames": total_frames,
                    "progress": (frame_count / total_frames) * 100,
                    "violence_score": round(violence_score, 3),
                    "crime_label": crime_label if is_violence else None,
                    "is_violence": is_violence,
                    "consecutive_count": consecutive_violence_count,
                    "scene_description": scene_description,
                    "video_time": video_time,
                    "timestamp": time.time()
                })

                if consecutive_violence_count >= CONSECUTIVE_REQUIRED:
                    report = await asyncio.to_thread(
                        report_model.generate_report,
                        violence_score,
                        f"Uploaded Video - {last_crime_label}",
                        video_time
                    )

                    scene_description_alert = await asyncio.to_thread(
                        report_model.generate_scene_description,
                        violence_score,
                        last_crime_label,
                        video_time
                    )

                    alert_data = {
                        "frame": frame_count,
                        "video_time": video_time,
                        "violence_score": round(violence_score, 3),
                        "crime_label": last_crime_label,
                        "report": report,
                        "scene_description": scene_description_alert,
                        "timestamp": time.time()
                    }

                    alerts.append(alert_data)
                    yield ("alert", alert_data)
                    consecutive_violence_count = 0

    except Exception as e:
        yield ("error", {"message": f"Processing error: {str(e)}"})

    finally:
        cap.release()

    yield ("summary", {
        "total_frames": frame_count,
        "processed_windows": processed_count,
        "alerts": len(alerts),
        "alert_details": alerts
    })
