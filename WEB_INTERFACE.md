# 🛡️ Secure Vision - Web Interface

AI-powered violence detection system with cyberpunk/neon themed web interface.

## 🎨 Features

- **Split-Screen Interface**:
  - Left: Video upload with drag & drop
  - Right: Live camera streaming

- **Cyberpunk Theme**:
  - Neon cyan/magenta/green colors
  - Glowing effects and animations
  - Scanline effects on video feeds

- **Real-Time Analysis**:
  - Violence detection scores
  - Crime type classification
  - Alert notifications and history

## 🚀 Quick Start

### Step 1: Install System Dependencies

```bash
sudo apt install -y python3.13-venv
```

### Step 2: Run Setup Script

```bash
cd Secure-Vision
./setup.sh
```

This will:
- Create a virtual environment
- Install all Python dependencies
- Prepare the application

### Step 3: Start the Server

```bash
# Activate virtual environment (if not already active)
source venv/bin/activate

# Start the web server
python run_web.py
```

### Step 4: Open Browser

Navigate to: **http://localhost:8000**

## 📋 Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Create virtual environment
python3 -m venv venv

# 2. Activate it
source venv/bin/activate

# 3. Upgrade pip
pip install --upgrade pip

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the server
python run_web.py
```

## 🎯 Usage

### Upload Video Analysis (Left Panel)

1. Drag and drop a video file (or click to browse)
2. Click "UPLOAD VIDEO" button
3. Watch real-time processing results
4. Download detailed report when complete

**Supported formats**: MP4, AVI, MOV, MKV, WebM
**Max file size**: 500MB

### Live Camera Streaming (Right Panel)

1. Click "START CAMERA" button
2. Allow camera permissions in browser
3. Watch real-time violence detection
4. View alerts in the history panel
5. Click "STOP CAMERA" to end session

## 🏗️ Architecture

### Backend (FastAPI)
- **api/app.py** - Main application
- **api/routers/video_upload.py** - Video upload & SSE
- **api/routers/live_stream.py** - WebSocket streaming
- **api/services/video_processor.py** - Video processing
- **api/models/model_manager.py** - AI model management

### Frontend (Vanilla JS)
- **frontend/src/App.jsx** - Main React UI shell
- **frontend/src/components/UploadPanel.jsx** - Upload interface
- **frontend/src/components/LivePanel.jsx** - Live camera interface
- **frontend/src/hooks/useUploadProcessor.js** - Upload processing state
- **frontend/src/hooks/useLiveCamera.js** - Live stream state

## 🔧 Configuration

### Server Settings (run_web.py)
- Host: `0.0.0.0` (accessible from all interfaces)
- Port: `8000`
- Reload: `True` (auto-reload on code changes)

### Detection Thresholds
- Violence threshold: `0.75`
- Consecutive detections required: `2`
- Cooldown between alerts: `10 seconds`
- Frame skip: Process every 2nd frame
- Buffer size: 16 frames per analysis

## 📊 AI Models

The system uses two VideoMAE models:

1. **Binary Violence Detector**
   - Model: `Nikeytas/videomae-crime-detector-production-v1`
   - Purpose: Detect if violence is present

2. **Crime Type Classifier**
   - Model: `OPear/videomae-large-finetuned-UCF-Crime`
   - Purpose: Identify specific crime types

3. **Report Generator**
   - Model: `google/flan-t5-small`
   - Purpose: Generate security incident reports

## 🌐 Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

**Note**: Camera access requires HTTPS in production (or localhost for development)

## 📱 Responsive Design

- Desktop (>1024px): Full split-screen
- Tablet (768-1024px): Optimized split-screen
- Mobile (<768px): Stacked vertical layout

## 🐛 Troubleshooting

### Models not loading
```bash
# Clear cache and restart
rm -rf ~/.cache/huggingface/
python run_web.py
```

### Camera not accessible
- Check browser permissions
- Ensure HTTPS (or localhost for dev)
- Try different browser

### Port already in use
```bash
# Kill process on port 8000
sudo lsof -t -i:8000 | xargs kill -9
```

### Dependencies issues
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 📄 License

This project uses open-source AI models. Check individual model licenses on HuggingFace.

## 🤝 Contributing

The web interface is built with:
- FastAPI for backend API
- Vanilla JavaScript (no framework dependencies)
- Custom CSS with cyberpunk theme

---

**Built with ❤️ for real-time violence detection**
