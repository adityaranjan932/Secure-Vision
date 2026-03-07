import torch
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification

class ViolenceModel:
    def __init__(self, model_ckpt="OPear/videomae-large-finetuned-UCF-Crime"):
        """
        Loads the UCF-Crime customized VideoMAE model.
        Detects 14 anomalous actions (Fighting, Burglary, Shooting, etc).
        """
        print(f"Loading Violence Detection Model ({model_ckpt})...")
        self.processor = VideoMAEImageProcessor.from_pretrained(model_ckpt)
        self.model = VideoMAEForVideoClassification.from_pretrained(model_ckpt, ignore_mismatched_sizes=True)
        self.model.eval()
        
    def predict(self, frames):
        """
        Classifies the 16 frames.
        Returns: label string and confidence score.
        """
        inputs = self.processor(list(frames), return_tensors="pt")
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        class_idx = probabilities.argmax(-1).item()
        
        confidence = probabilities[0, class_idx].item()
        label = self.model.config.id2label.get(class_idx, "Unknown")
        
        return label, confidence
