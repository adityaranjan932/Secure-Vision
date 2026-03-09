import torch
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification

class ViolenceModel:
    def __init__(self, 
                 binary_ckpt="Nikeytas/videomae-crime-detector-production-v1",
                 crime_ckpt="OPear/videomae-large-finetuned-UCF-Crime"):
        """
        Two-stage violence detection:
        1. Binary model (Nikeytas) - decides if violence is present (yes/no)
        2. Crime classifier (OPear) - identifies the type of crime
        """
        print(f"Loading Binary Violence Detector ({binary_ckpt})...")
        self.binary_processor = VideoMAEImageProcessor.from_pretrained(binary_ckpt)
        self.binary_model = VideoMAEForVideoClassification.from_pretrained(binary_ckpt)
        self.binary_model.eval()
        
        print(f"Loading Crime Type Classifier ({crime_ckpt})...")
        self.crime_processor = VideoMAEImageProcessor.from_pretrained(crime_ckpt)
        self.crime_model = VideoMAEForVideoClassification.from_pretrained(crime_ckpt)
        self.crime_model.eval()
        
    def predict(self, frames):
        """
        Stage 1: Binary detection (violence vs normal)
        Stage 2: If violence, classify the crime type
        Returns: (is_violence, violence_score, crime_label)
        """
        frame_list = list(frames)
        
        # Stage 1: Binary violence detection
        inputs = self.binary_processor(frame_list, return_tensors="pt")
        with torch.no_grad():
            logits = self.binary_model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)
        # LABEL_1 = violence
        violence_score = probs[0, 1].item()
        
        # Stage 2: Crime type classification (only meaningful if violence detected)
        inputs = self.crime_processor(frame_list, return_tensors="pt")
        with torch.no_grad():
            logits = self.crime_model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)
        
        # Get top crime class (skip Normal_Videos_event)
        crime_label = "Unknown"
        for idx in probs[0].argsort(descending=True):
            idx = idx.item()
            lbl = self.crime_model.config.id2label.get(idx, "Unknown")
            if "normal" not in lbl.lower():
                crime_label = lbl
                break
        
        return violence_score, crime_label
