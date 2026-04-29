import time
import argparse
from dotenv import load_dotenv
from streaming.camera import Camera

load_dotenv()
from streaming.frame_buffer import FrameBuffer
from utils.preprocess import preprocess_frame
from models.violence_model import ViolenceModel
from models.report_model import ReportModel
from alerts.logger import Logger

def main():
    parser = argparse.ArgumentParser(description="Real-Time Violence Detection System")
    parser.add_argument("--source", type=str, default="0", 
                        help="Video source: 0 for webcam, or path to video file (e.g. videos/fight.mp4)")
    args = parser.parse_args()

    # If source is a digit, it's a webcam source
    if args.source.isdigit():
        video_source = int(args.source)
    else:
        video_source = args.source

    print("--- Initializing System Components ---")
    camera = Camera(source=video_source)
    buffer = FrameBuffer(max_size=16)
    logger = Logger("alerts.log")
    
    violence_model = ViolenceModel()
    report_model = ReportModel()
    
    print("\n--- Starting Real-Time Violence Detection ---")
    print("Press Ctrl+C to stop.\n")
    frame_count = 0
    frame_skip = 2  # Standard UCF-Crime tempo-stride (every 2nd frame gives 1-second 16-frame window)
    
    # Temporal smoothing: track recent anomaly detections
    VIOLENCE_THRESHOLD = 0.45        # Binary model score to consider as violence
    CONSECUTIVE_REQUIRED = 2         # Consecutive violence detections needed before alert
    COOLDOWN_SECONDS = 10            # Minimum seconds between alerts
    
    consecutive_violence_count = 0
    last_crime_label = None
    last_alert_time = 0
    
    try:
        while True:
            frame = camera.get_frame()
            if frame is None:
                print("\nEnd of video stream or cannot read frame.")
                break
                
            frame_count += 1
            if frame_count % frame_skip != 0:
                continue
                
            processed_frame = preprocess_frame(frame)
            buffer.add(processed_frame)
            
            # Action only when we collected 16 frames
            if buffer.is_full():
                frames_to_process = buffer.get_frames()
                
                violence_score, crime_label = violence_model.predict(frames_to_process)
                
                # Clear buffer after each prediction to avoid overlapping frame reuse
                buffer.buffer.clear()
                
                is_violence = violence_score >= VIOLENCE_THRESHOLD
                
                if is_violence:
                    print(f"⚠ Detected: {crime_label} (Violence Score: {violence_score:.2f})")
                else:
                    print(f"✅ Normal - Nothing suspicious happening (Score: {violence_score:.2f})")
                
                if is_violence:
                    consecutive_violence_count += 1
                    last_crime_label = crime_label
                else:
                    consecutive_violence_count = 0
                    last_crime_label = None
                
                # Only alert after consecutive confirmations and cooldown
                current_time = time.time()
                if consecutive_violence_count >= CONSECUTIVE_REQUIRED and (current_time - last_alert_time) >= COOLDOWN_SECONDS:
                    print(f"\n!!! ALERT: {last_crime_label.upper()} Detected (confirmed {consecutive_violence_count}x) !!!")
                    
                    report = report_model.generate_report(violence_score, camera_name=f"Camera ({last_crime_label})")
                    
                    print(f"\nSecurity Incident Report:\n{report}\n")
                    
                    logger.log_incident(report)
                    
                    consecutive_violence_count = 0
                    last_alert_time = current_time
                    time.sleep(1) # Small pause
                    
    except KeyboardInterrupt:
        print("\nStopping system manually...")
    finally:
        camera.release()
        print("System stopped calmly.")

if __name__ == "__main__":
    main()
