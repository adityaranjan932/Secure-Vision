"""
Model Manager - Singleton pattern for loading ML models once
"""
from models.violence_model import ViolenceModel
from models.report_model import ReportModel


class ModelManager:
    """Singleton class to manage model instances"""

    _instance = None
    _violence_model = None
    _report_model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
        return cls._instance

    def get_violence_model(self):
        """Get or create ViolenceModel instance"""
        if self._violence_model is None:
            print("Loading ViolenceModel...")
            self._violence_model = ViolenceModel()
            print("ViolenceModel loaded successfully!")
        return self._violence_model

    def get_report_model(self):
        """Get or create ReportModel instance"""
        if self._report_model is None:
            print("Loading ReportModel...")
            self._report_model = ReportModel()
            print("ReportModel loaded successfully!")
        return self._report_model
