import cv2
import cv2

class Camera:
    def __init__(self, source=0):
        """
        Captures frames from webcam (source=0) or video file.
        """
        self.cap = cv2.VideoCapture(source)
        if not self.cap.isOpened():
            print(f"Error: Could not open video source {source}")
            
    def get_frame(self):
        ret, frame = self.cap.read()
        if not ret:
            # Reached end of video or camera error
            return None
        return frame
        
    def release(self):
        self.cap.release()
