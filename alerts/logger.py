import datetime

class Logger:
    def __init__(self, log_file="alerts.log"):
        self.log_file = log_file
        
    def log_incident(self, report):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"{timestamp}\n{report}\n{'-'*50}\n"
        
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(log_entry)
            
        print("\n=== ALERT SAVED TO LOG ===")
