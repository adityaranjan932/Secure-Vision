"""
Live Stream Router - WebSocket endpoint for real-time camera streaming
"""
import base64
import json
import numpy as np
import cv2
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from streaming.frame_buffer import FrameBuffer
from api.models.model_manager import ModelManager

router = APIRouter()

# Violence detection thresholds
VIOLENCE_THRESHOLD = 0.75
CONSECUTIVE_REQUIRED = 2


def decode_base64_frame(base64_string: str):
    """
    Decode a base64-encoded JPEG image to numpy array

    Args:
        base64_string: Base64 encoded JPEG image

    Returns:
        RGB numpy array
    """
    try:
        # Decode base64 to bytes
        img_bytes = base64.b64decode(base64_string)

        # Convert to numpy array
        nparr = np.frombuffer(img_bytes, np.uint8)

        # Decode JPEG to BGR image
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return None

        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        return rgb_frame

    except Exception as e:
        print(f"Error decoding frame: {e}")
        return None


@router.websocket("/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time camera streaming and violence detection

    Client sends: {"type": "frame", "data": "base64_jpeg", "timestamp": <ms>}
    Server sends: {"type": "result", "violence_score": <float>, "crime_label": <str>, ...}
    Server sends: {"type": "alert", "crime_label": <str>, "report": <str>, ...}
    """

    await websocket.accept()
    print("WebSocket connection accepted")

    # Initialize components for this connection
    buffer = FrameBuffer(max_size=16)
    model_manager = ModelManager()
    violence_model = model_manager.get_violence_model()
    report_model = model_manager.get_report_model()

    # Connection state
    consecutive_violence_count = 0
    last_crime_label = None
    last_alert_time = 0
    COOLDOWN_SECONDS = 10

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "frame":
                # Decode frame from base64
                frame_data = message.get("data")
                timestamp = message.get("timestamp", time.time())

                if not frame_data:
                    continue

                # Decode frame
                frame = decode_base64_frame(frame_data)

                if frame is None:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to decode frame"
                    })
                    continue

                # Add frame to buffer
                buffer.add(frame)

                # Process when buffer is full
                if buffer.is_full():
                    frames_to_process = buffer.get_frames()

                    # Run violence detection
                    violence_score, crime_label = violence_model.predict(frames_to_process)

                    # Clear buffer after prediction
                    buffer.buffer.clear()

                    is_violence = violence_score >= VIOLENCE_THRESHOLD

                    # Generate scene description for non-zero scores
                    scene_description = None
                    if violence_score > 0.3:  # Only generate for meaningful scores
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

                    # Send result back to client
                    result_message = {
                        "type": "result",
                        "violence_score": round(violence_score, 3),
                        "crime_label": crime_label if is_violence else None,
                        "is_violence": is_violence,
                        "consecutive_count": consecutive_violence_count,
                        "scene_description": scene_description,
                        "timestamp": timestamp
                    }

                    await websocket.send_json(result_message)

                    # Check if alert should be generated
                    current_time = time.time()
                    if (consecutive_violence_count >= CONSECUTIVE_REQUIRED and
                        (current_time - last_alert_time) >= COOLDOWN_SECONDS):

                        # Generate report and scene description
                        report = report_model.generate_report(
                            violence_score,
                            camera_name=f"Live Camera - {last_crime_label}"
                        )

                        scene_description = report_model.generate_scene_description(
                            violence_score,
                            crime_label=last_crime_label
                        )

                        # Send alert
                        alert_message = {
                            "type": "alert",
                            "crime_label": last_crime_label,
                            "violence_score": round(violence_score, 3),
                            "report": report,
                            "scene_description": scene_description,
                            "timestamp": current_time
                        }

                        await websocket.send_json(alert_message)

                        # Reset state
                        consecutive_violence_count = 0
                        last_alert_time = current_time

            elif message.get("type") == "ping":
                # Respond to ping
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        print("WebSocket connection closed by client")

    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass

    finally:
        print("WebSocket connection terminated")
