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
