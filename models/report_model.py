import os
import datetime
from groq import Groq

SCENE_TEMPLATES = {
    "Fighting":       "Multiple individuals appear to be engaged in a physical altercation.",
    "Assault":        "A person appears to be physically attacking another individual.",
    "Abuse":          "Aggressive or threatening behavior is observed between individuals.",
    "Robbery":        "An individual appears to be forcibly taking property from another person.",
    "Burglary":       "Suspicious unauthorized entry or property access is detected.",
    "Shooting":       "Individuals appear to be involved in a dangerous armed confrontation.",
    "Arson":          "Fire or smoke is detected, possibly indicating deliberate ignition.",
    "Arrest":         "Law enforcement activity involving physical restraint is detected.",
    "Explosion":      "A sudden violent event or explosion is detected in the scene.",
    "Stealing":       "An individual appears to be taking property without authorization.",
    "Shoplifting":    "Suspicious concealment or removal of items without payment is detected.",
    "Vandalism":      "Deliberate destruction or defacement of property is observed.",
    "Road Accidents": "A vehicle collision or road accident appears to have occurred.",
}

DEFAULT_SCENE = "Suspicious aggressive activity is detected in the scene."


class ReportModel:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if api_key and api_key != "your_groq_api_key_here":
            self.client = Groq(api_key=api_key)
            self.use_groq = True
            print("Report model ready (Groq API connected).")
        else:
            self.client = None
            self.use_groq = False
            print("Report model ready (template mode — add GROQ_API_KEY to .env for AI reports).")

    def generate_report(self, confidence, camera_name="Entrance Camera", video_time=None):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        time_info = f"Video Timestamp: {video_time}\n" if video_time else ""

        if self.use_groq:
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a professional security incident report writer. "
                                "Write concise, formal security reports in 3-4 sentences. "
                                "Always include: what was detected, confidence level, camera location, "
                                "the exact time it occurred in the video, and recommended action. "
                                "Be direct and professional."
                            )
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Generate a security incident report for the following:\n"
                                f"Camera: {camera_name}\n"
                                f"Wall Clock Time: {timestamp}\n"
                                f"{time_info}"
                                f"Confidence: {confidence:.0%}\n"
                                f"Status: Violent activity detected\n"
                            )
                        }
                    ],
                    max_tokens=180,
                    temperature=0.3
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Groq API error: {e} — falling back to template")

        time_line = f"Video Time: {video_time}\n" if video_time else ""
        return (
            f"SECURITY INCIDENT REPORT\n"
            f"Wall Clock Time: {timestamp}\n"
            f"{time_line}"
            f"Camera: {camera_name}\n"
            f"Confidence: {confidence:.0%}\n"
            f"Status: VIOLENT ACTIVITY DETECTED\n"
            f"Action Required: Security personnel must investigate immediately."
        )

    def generate_scene_description(self, confidence, crime_label="Unknown", video_time=None):
        if self.use_groq and crime_label and crime_label != "Unknown":
            try:
                time_context = f" at {video_time} in the video" if video_time else ""
                response = self.client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a surveillance analyst. Describe what is happening in one "
                                "short sentence based on the detected crime type and time. Be factual and concise. "
                                "Do NOT mention weapons or specific details not provided. "
                                "Include the time of occurrence if provided."
                            )
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Crime type detected: {crime_label}{time_context}\n"
                                f"Confidence: {confidence:.0%}\n"
                                f"Describe in one sentence what appears to be happening."
                            )
                        }
                    ],
                    max_tokens=60,
                    temperature=0.3
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Groq API error: {e} — falling back to template")

        return SCENE_TEMPLATES.get(crime_label, DEFAULT_SCENE)
