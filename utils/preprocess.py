import cv2

def preprocess_frame(frame):
    """
    Convert BGR to RGB. 
    We DO NOT manually resize here anymore! Re-sizing manually warps the aspect ratio.
    The HuggingFace VideoMAE processor automatically correctly sizes and crops it.
    """
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    return rgb_frame
