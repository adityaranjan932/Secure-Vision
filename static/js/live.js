/**
 * Live Camera Stream Panel Logic
 */

// DOM Elements (initialized after DOM loads)
let cameraFeed;
let cameraOverlay;
let startCameraBtn;
let stopCameraBtn;
let statusDot;
let statusText;
let scoreValue;
let scoreCircle;
let liveStatus;
let crimeType;
let lastUpdate;
let alertList;
let sceneDescription;
let sceneDescriptionText;

// State
let mediaStream = null;
let websocket = null;
let frameInterval = null;
let canvas = null;
let ctx = null;
let alertHistory = [];

// Constants
const FRAME_RATE = 10; // Send 10 frames per second
const FRAME_INTERVAL = 1000 / FRAME_RATE;
const JPEG_QUALITY = 0.7;

// Initialize live camera panel
function initLiveCameraPanel() {
    // Initialize DOM element references
    cameraFeed = document.getElementById('cameraFeed');
    cameraOverlay = document.getElementById('cameraOverlay');
    startCameraBtn = document.getElementById('startCameraBtn');
    stopCameraBtn = document.getElementById('stopCameraBtn');
    statusDot = document.getElementById('statusDot');
    statusText = document.getElementById('statusText');
    scoreValue = document.getElementById('scoreValue');
    scoreCircle = document.getElementById('scoreCircle');
    liveStatus = document.getElementById('liveStatus');
    crimeType = document.getElementById('crimeType');
    lastUpdate = document.getElementById('lastUpdate');
    alertList = document.getElementById('alertList');
    sceneDescription = document.getElementById('sceneDescription');
    sceneDescriptionText = document.getElementById('sceneDescriptionText');

    // Create canvas for frame capture
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');

    // Button handlers
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);

    // Attempt to auto-start camera on page load
    autoStartCamera();
}

/**
 * Attempt to automatically start camera on page load
 */
async function autoStartCamera() {
    try {
        // Check if camera permission has been previously granted
        const permissions = await navigator.permissions.query({ name: 'camera' });

        if (permissions.state === 'granted') {
            // Permission already granted, start camera automatically
            console.log('Camera permission already granted, auto-starting...');
            await startCamera();
        } else if (permissions.state === 'prompt') {
            // Permission will be prompted - show a friendly message
            showToast('Click "START CAMERA" to begin live detection', 'info');
            // Update overlay to encourage user interaction
            cameraOverlay.innerHTML = '<p>Click "START CAMERA" to begin live detection</p>';
        } else {
            // Permission denied
            showToast('Camera access denied. Please enable camera permissions.', 'error');
            cameraOverlay.innerHTML = '<p>Camera access denied<br>Please enable camera permissions and refresh</p>';
        }
    } catch (error) {
        // Permissions API not supported or other error
        console.log('Permissions API not supported, attempting auto-start...');

        // Try to start camera anyway (some browsers don't support permissions API)
        try {
            await startCamera();
        } catch (startError) {
            // Auto-start failed, show helpful message
            console.log('Auto-start failed:', startError);
            showToast('Click "START CAMERA" to begin live detection', 'info');
            cameraOverlay.innerHTML = '<p>Click "START CAMERA" to begin live detection</p>';
        }
    }
}

/**
 * Start camera and WebSocket connection
 */
async function startCamera() {
    try {
        // Get camera access
        showToast('Requesting camera access...', 'info');

        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            },
            audio: false
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        // Set video source
        cameraFeed.srcObject = mediaStream;
        await cameraFeed.play();

        // Hide overlay
        cameraOverlay.classList.add('hidden');

        // Update UI
        startCameraBtn.disabled = true;
        stopCameraBtn.disabled = false;
        updateConnectionStatus('connecting');

        showToast('Camera started successfully! Connecting to AI service...', 'success');

        // Connect WebSocket
        connectWebSocket();

    } catch (error) {
        console.error('Camera error:', error);
        let errorMsg = 'Failed to access camera';

        if (error.name === 'NotAllowedError') {
            errorMsg = 'Camera access denied. Please allow camera permission and try again.';
            cameraOverlay.innerHTML = '<p>Camera access denied<br>Please allow camera permission<br>and click "START CAMERA"</p>';
        } else if (error.name === 'NotFoundError') {
            errorMsg = 'No camera found on this device.';
            cameraOverlay.innerHTML = '<p>No camera detected<br>Please connect a camera</p>';
        } else if (error.name === 'NotReadableError') {
            errorMsg = 'Camera is already in use by another application.';
            cameraOverlay.innerHTML = '<p>Camera in use<br>Please close other camera apps</p>';
        }

        // Show overlay with error message
        cameraOverlay.classList.remove('hidden');

        showToast(errorMsg, 'error');
        stopCamera();
    }
}

/**
 * Stop camera and WebSocket connection
 */
function stopCamera() {
    // Stop frame capture
    if (frameInterval) {
        clearInterval(frameInterval);
        frameInterval = null;
    }

    // Close WebSocket
    if (websocket) {
        websocket.close();
        websocket = null;
    }

    // Stop media stream
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        cameraFeed.srcObject = null;
    }

    // Show overlay with default message
    cameraOverlay.innerHTML = '<p>Click "START CAMERA" to begin live detection</p>';
    cameraOverlay.classList.remove('hidden');

    // Update UI
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    updateConnectionStatus('disconnected');
    resetAnalysisDisplay();

    showToast('Camera stopped', 'info');
}

/**
 * Connect to WebSocket server
 */
function connectWebSocket() {
    const wsUrl = getWebSocketUrl();

    try {
        websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
            console.log('WebSocket connected');
            updateConnectionStatus('connected');
            showToast('Connected! Streaming to server...', 'success');

            // Start sending frames
            startFrameCapture();
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            showToast('Connection error', 'error');
        };

        websocket.onclose = () => {
            console.log('WebSocket closed');
            updateConnectionStatus('disconnected');

            if (frameInterval) {
                stopCamera();
            }
        };

    } catch (error) {
        console.error('WebSocket connection error:', error);
        showToast('Failed to connect to server', 'error');
        stopCamera();
    }
}

/**
 * Start capturing and sending frames
 */
function startFrameCapture() {
    frameInterval = setInterval(() => {
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            return;
        }

        // Capture frame from video
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) {
            return;
        }

        ctx.drawImage(cameraFeed, 0, 0);

        // Convert to JPEG base64
        try {
            const base64Data = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];

            // Send to server
            const message = {
                type: 'frame',
                data: base64Data,
                timestamp: Date.now()
            };

            websocket.send(JSON.stringify(message));

        } catch (error) {
            console.error('Frame capture error:', error);
        }

    }, FRAME_INTERVAL);
}

/**
 * Handle message from server
 */
function handleServerMessage(data) {
    switch (data.type) {
        case 'result':
            updateAnalysisDisplay(data);
            break;

        case 'alert':
            handleAlert(data);
            break;

        case 'error':
            console.error('Server error:', data.message);
            showToast(data.message, 'error');
            break;

        case 'pong':
            // Pong response to ping
            break;

        default:
            console.log('Unknown message type:', data.type);
    }
}

/**
 * Update analysis display with results
 */
function updateAnalysisDisplay(data) {
    // Update score
    scoreValue.textContent = formatScore(data.violence_score);

    // Update score circle color
    if (data.is_violence) {
        scoreCircle.classList.add('danger');
        liveStatus.textContent = 'VIOLENCE DETECTED';
        liveStatus.classList.add('danger');
    } else {
        scoreCircle.classList.remove('danger');
        liveStatus.textContent = data.violence_score > 0.3 ? 'SUSPICIOUS' : 'NO VIOLENCE DETECTED';
        liveStatus.classList.remove('danger');
    }

    // Update crime type
    crimeType.textContent = data.crime_label || 'NONE';
    if (data.crime_label) {
        crimeType.classList.add('danger');
    } else {
        crimeType.classList.remove('danger');
    }

    // Update timestamp
    lastUpdate.textContent = formatTimestamp(data.timestamp);

    // Update scene description
    if (data.scene_description) {
        sceneDescription.style.display = 'block';
        sceneDescriptionText.textContent = data.scene_description;
    } else {
        sceneDescription.style.display = 'none';
        sceneDescriptionText.textContent = '--';
    }
}

/**
 * Handle alert from server
 */
function handleAlert(data) {
    console.log('Alert received:', data);

    // Add to alert history
    alertHistory.unshift(data);

    // Keep only last 10 alerts
    if (alertHistory.length > 10) {
        alertHistory.pop();
    }

    // Update alert list display
    updateAlertList();

    // Show toast notification
    showToast(`⚠ ${data.crime_label} DETECTED!`, 'error');

    // Flash the screen briefly
    scoreCircle.style.animation = 'none';
    setTimeout(() => {
        scoreCircle.style.animation = '';
    }, 10);
}

/**
 * Update alert list display
 */
function updateAlertList() {
    if (alertHistory.length === 0) {
        alertList.innerHTML = '<p class="placeholder-text">No alerts yet</p>';
        return;
    }

    alertList.innerHTML = '';

    alertHistory.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';

        const time = document.createElement('span');
        time.className = 'alert-time';
        time.textContent = formatTimestamp(alert.timestamp * 1000);

        const type = document.createElement('span');
        type.className = 'alert-type';
        type.textContent = alert.crime_label;

        alertItem.appendChild(time);
        alertItem.appendChild(type);

        alertList.appendChild(alertItem);
    });
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(status) {
    statusDot.className = 'status-dot';

    switch (status) {
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            break;

        case 'connecting':
            statusText.textContent = 'Connecting...';
            break;

        case 'disconnected':
        default:
            statusDot.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
            break;
    }
}

/**
 * Reset analysis display to default
 */
function resetAnalysisDisplay() {
    scoreValue.textContent = '0.00';
    scoreCircle.classList.remove('danger');
    liveStatus.textContent = 'NO VIOLENCE DETECTED';
    liveStatus.classList.remove('danger');
    crimeType.textContent = 'NONE';
    crimeType.classList.remove('danger');
    lastUpdate.textContent = '--:--:--';
    sceneDescription.style.display = 'none';
    sceneDescriptionText.textContent = '--';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initLiveCameraPanel);
