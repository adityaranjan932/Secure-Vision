import time
import argparse
from streaming.camera import Camera
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
                
                label, confidence = violence_model.predict(frames_to_process)
                
                print(f"Prediction: {label} (Confidence: {confidence:.2f})")
                
                # The model outputs "Normal Videos" or the name of the crime/anomaly
                # Threshold lowered to 0.35 because 14 classes spread probabilities thinner
                if label != "Normal Videos" and confidence > 0.35:
                    print(f"\n!!! ALERT: {label.upper()} Detected !!!")
                    
                    report = report_model.generate_report(confidence, camera_name=f"Camera ({label})")
                    
                    print(f"\nSecurity Incident Report:\n{report}\n")
                    
                    logger.log_incident(report)
                    
                    # Clear buffer immediately to avoid multiple identical reports
                    buffer.buffer.clear()
                    time.sleep(1) # Small pause
                    
    except KeyboardInterrupt:
        print("\nStopping system manually...")
    finally:
        camera.release()
        print("System stopped calmly.")

if __name__ == "__main__":
    main()
