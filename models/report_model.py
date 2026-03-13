import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration

class ReportModel:
    def __init__(self, model_name="google/flan-t5-small"):
        """
        Loads the Hugging Face Flan-T5 model for report generation.
        """
        print(f"Loading Report Generation Model ({model_name})...")
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        self.model = T5ForConditionalGeneration.from_pretrained(model_name)
        self.model.eval()
        
    def generate_report(self, confidence, camera_name="Entrance Camera"):
        prompt = (f"Violence detected in surveillance footage.\n"
                  f"Camera: {camera_name}\n"
                  f"Confidence: {confidence:.2f}\n"
                  f"Write a short and professional security incident report indicating that violent activity "
                  f"was observed and security personnel should investigate immediately.")

        inputs = self.tokenizer(prompt, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=150,
                temperature=0.7,
                do_sample=True,
                repetition_penalty=1.2
            )

        report = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return report

    def generate_scene_description(self, confidence, crime_label="Unknown"):
        """
        Generate a descriptive reasoning of what's happening in the scene.
        For example: "Two persons appear to be having an intense conversation and may have fought together"
        """
        prompt = (f"Describe what is happening in this video surveillance scene.\n"
                  f"Type of violence detected: {crime_label}\n"
                  f"Confidence level: {confidence:.2f}\n"
                  f"Describe in one sentence what appears to be happening between the people in the scene. "
                  f"For example: 'Two persons appear to be having an intense conversation and may have fought together' "
                  f"or 'Multiple individuals engaged in physical altercation' "
                  f"or 'Person appears to be exhibiting aggressive behavior towards another'.")

        inputs = self.tokenizer(prompt, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=80,
                temperature=0.8,
                do_sample=True,
                repetition_penalty=1.3,
                top_p=0.9
            )

        description = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return description
