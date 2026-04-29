import torch
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification

STAGE2_THRESHOLD = 0.35


class ViolenceModel:
    def __init__(self,
                 binary_ckpt="mitegvg/videomae-small-kinetics-binary-finetuned-xd-violence",
                 crime_ckpt="OPear/videomae-large-finetuned-UCF-Crime"):
        print(f"Loading Binary Violence Detector ({binary_ckpt})...")
        self.binary_processor = VideoMAEImageProcessor.from_pretrained(binary_ckpt)
        self.binary_model = VideoMAEForVideoClassification.from_pretrained(binary_ckpt)
        self.binary_model.eval()

        print(f"Loading Crime Type Classifier ({crime_ckpt})...")
        self.crime_processor = VideoMAEImageProcessor.from_pretrained(crime_ckpt)
        self.crime_model = VideoMAEForVideoClassification.from_pretrained(crime_ckpt)
        self.crime_model.eval()

    def predict(self, frames):
        frame_list = list(frames)

        # Stage 1: Binary violence detection
        inputs = self.binary_processor(frame_list, return_tensors="pt")
        with torch.no_grad():
            logits = self.binary_model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)
        violence_score = probs[0, 1].item()

        # Stage 2: Crime classification — only runs if score is meaningful
        # Skipping for clearly safe scenes saves ~40% compute
        crime_label = "Unknown"
        if violence_score >= STAGE2_THRESHOLD:
            inputs = self.crime_processor(frame_list, return_tensors="pt")
            with torch.no_grad():
                logits = self.crime_model(**inputs).logits
            probs = torch.nn.functional.softmax(logits, dim=-1)

            for idx in probs[0].argsort(descending=True):
                idx = idx.item()
                lbl = self.crime_model.config.id2label.get(idx, "Unknown")
                if "normal" not in lbl.lower():
                    crime_label = lbl
                    break

        return violence_score, crime_label
