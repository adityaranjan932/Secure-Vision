from collections import deque

class FrameBuffer:
    def __init__(self, max_size=16):
        """
        Maintains a rolling buffer of frames.
        """
        self.buffer = deque(maxlen=max_size)
    
    def add(self, frame):
        self.buffer.append(frame)
        
    def is_full(self):
        return len(self.buffer) == self.buffer.maxlen
        
    def get_frames(self):
        return list(self.buffer)
