import asyncio
import base64
import datetime
import json
import time

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from streaming.frame_buffer import FrameBuffer
from api.models.model_manager import ModelManager

router = APIRouter()

VIOLENCE_THRESHOLD = 0.45
CONSECUTIVE_REQUIRED = 2


def decode_base64_frame(base64_string: str):
    try:
        img_bytes = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return None
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    except Exception as e:
        print(f"Error decoding frame: {e}")
        return None


@router.websocket("/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection accepted")

    buffer = FrameBuffer(max_size=16)
    model_manager = ModelManager()
    violence_model = model_manager.get_violence_model()
    report_model = model_manager.get_report_model()

    consecutive_violence_count = 0
    last_crime_label = None
    last_alert_time = 0
    COOLDOWN_SECONDS = 10

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "frame":
                frame_data = message.get("data")
                timestamp = message.get("timestamp", time.time())

                if not frame_data:
                    continue

                frame = decode_base64_frame(frame_data)
                if frame is None:
                    await websocket.send_json({"type": "error", "message": "Failed to decode frame"})
                    continue

                buffer.add(frame)

                if buffer.is_full():
                    frames_to_process = buffer.get_frames()

                    # Run model in thread (CPU-bound, avoids blocking event loop)
                    violence_score, crime_label = await asyncio.to_thread(
                        violence_model.predict, frames_to_process
                    )

                    buffer.buffer.clear()
                    is_violence = violence_score >= VIOLENCE_THRESHOLD

                    live_time = datetime.datetime.now().strftime("%H:%M:%S")

                    scene_description = None
                    if violence_score > 0.3:
                        scene_description = await asyncio.to_thread(
                            report_model.generate_scene_description,
                            violence_score,
                            crime_label if is_violence else "Suspicious Activity",
                            live_time
                        )

                    if is_violence:
                        consecutive_violence_count += 1
                        last_crime_label = crime_label
                    else:
                        consecutive_violence_count = 0
                        last_crime_label = None

                    await websocket.send_json({
                        "type": "result",
                        "violence_score": round(violence_score, 3),
                        "crime_label": crime_label if is_violence else None,
                        "is_violence": is_violence,
                        "consecutive_count": consecutive_violence_count,
                        "scene_description": scene_description,
                        "live_time": live_time,
                        "timestamp": timestamp
                    })

                    current_time = time.time()
                    if (consecutive_violence_count >= CONSECUTIVE_REQUIRED and
                            (current_time - last_alert_time) >= COOLDOWN_SECONDS):

                        report = await asyncio.to_thread(
                            report_model.generate_report,
                            violence_score,
                            f"Live Camera - {last_crime_label}",
                            live_time
                        )

                        scene_description = await asyncio.to_thread(
                            report_model.generate_scene_description,
                            violence_score,
                            last_crime_label,
                            live_time
                        )

                        await websocket.send_json({
                            "type": "alert",
                            "crime_label": last_crime_label,
                            "violence_score": round(violence_score, 3),
                            "report": report,
                            "scene_description": scene_description,
                            "live_time": live_time,
                            "timestamp": current_time
                        })

                        consecutive_violence_count = 0
                        last_alert_time = current_time

            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        print("WebSocket connection closed by client")

    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

    finally:
        print("WebSocket connection terminated")
