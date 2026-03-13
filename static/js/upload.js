/**
 * Video Upload Panel Logic
 */

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsList = document.getElementById('resultsList');
const downloadBtn = document.getElementById('downloadBtn');

// State
let selectedFile = null;
let currentSessionId = null;
let eventSource = null;
let allAlerts = [];

// Initialize upload panel
function initUploadPanel() {
    // Click to browse
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    });

    // Upload button
    uploadBtn.addEventListener('click', handleUpload);

    // Download button
    downloadBtn.addEventListener('click', downloadReport);
}

/**
 * Handle file selection
 */
function handleFileSelect(file) {
    if (!file) return;

    const validation = validateVideoFile(file);
    if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
    }

    selectedFile = file;
    uploadBtn.disabled = false;
    uploadZone.querySelector('.upload-text').textContent = file.name;
    uploadZone.querySelector('.upload-subtext').textContent = formatFileSize(file.size);
    showToast('Video ready to upload', 'success');
}

/**
 * Handle video upload
 */
async function handleUpload() {
    if (!selectedFile) return;

    try {
        uploadBtn.disabled = true;
        showToast('Uploading video...', 'info');

        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch(`${getApiBaseUrl()}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const data = await response.json();
        currentSessionId = data.session_id;

        showToast('Upload successful! Processing...', 'success');

        // Show progress container
        progressContainer.style.display = 'block';

        // Clear previous results
        resultsList.innerHTML = '<p class="placeholder-text">Processing video...</p>';
        allAlerts = [];
        downloadBtn.style.display = 'none';

        // Start listening to SSE
        startSSE(currentSessionId);

    } catch (error) {
        console.error('Upload error:', error);
        showToast(error.message, 'error');
        uploadBtn.disabled = false;
    }
}

/**
 * Start Server-Sent Events connection
 */
function startSSE(sessionId) {
    eventSource = new EventSource(`${getApiBaseUrl()}/process/${sessionId}`);

    eventSource.addEventListener('info', (e) => {
        const data = JSON.parse(e.data);
        console.log('Video info:', data);
    });

    eventSource.addEventListener('processing', (e) => {
        const data = JSON.parse(e.data);
        updateProgress(data);
        addResult(data);
    });

    eventSource.addEventListener('alert', (e) => {
        const data = JSON.parse(e.data);
        console.log('Alert:', data);
        allAlerts.push(data);
        showToast(`⚠ ${data.crime_label} detected!`, 'error');
    });

    eventSource.addEventListener('summary', (e) => {
        const data = JSON.parse(e.data);
        console.log('Summary:', data);
        showSummary(data);
    });

    eventSource.addEventListener('complete', (e) => {
        console.log('Processing complete');
        eventSource.close();
        showToast('Processing completed!', 'success');
        uploadBtn.disabled = false;
        progressContainer.style.display = 'none';

        if (allAlerts.length > 0) {
            downloadBtn.style.display = 'block';
        }
    });

    eventSource.addEventListener('error', (e) => {
        console.error('SSE error:', e);
        if (eventSource.readyState === EventSource.CLOSED) {
            showToast('Connection closed', 'error');
            eventSource.close();
            uploadBtn.disabled = false;
        }
    });

    eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        if (eventSource.readyState === EventSource.CLOSED) {
            eventSource.close();
            uploadBtn.disabled = false;
        }
    };
}

/**
 * Update progress bar
 */
function updateProgress(data) {
    const progress = Math.round(data.progress || 0);
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
}

/**
 * Add result to the list
 */
function addResult(data) {
    // Remove placeholder if exists
    const placeholder = resultsList.querySelector('.placeholder-text');
    if (placeholder) {
        resultsList.innerHTML = '';
    }

    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${getScoreClass(data.violence_score)}`;

    const frameInfo = document.createElement('p');
    frameInfo.className = 'result-frame';
    frameInfo.textContent = `Frame ${data.frame} / ${data.total_frames}`;

    const scoreInfo = document.createElement('p');
    scoreInfo.className = 'result-score';
    scoreInfo.textContent = `Score: ${formatScore(data.violence_score)}`;

    resultItem.appendChild(frameInfo);
    resultItem.appendChild(scoreInfo);

    if (data.is_violence && data.crime_label) {
        const labelInfo = document.createElement('p');
        labelInfo.className = 'result-label';
        labelInfo.textContent = `⚠ ${data.crime_label}`;
        resultItem.appendChild(labelInfo);
    }

    // Add scene description if available
    if (data.scene_description) {
        const descInfo = document.createElement('p');
        descInfo.className = 'result-description';
        descInfo.style.color = 'var(--text-primary)';
        descInfo.style.fontStyle = 'italic';
        descInfo.style.marginTop = '8px';
        descInfo.textContent = data.scene_description;
        resultItem.appendChild(descInfo);
    }

    // Add to top of list
    resultsList.insertBefore(resultItem, resultsList.firstChild);

    // Limit to 50 items
    while (resultsList.children.length > 50) {
        resultsList.removeChild(resultsList.lastChild);
    }
}

/**
 * Show processing summary
 */
function showSummary(data) {
    const summaryItem = document.createElement('div');
    summaryItem.className = 'result-item';
    summaryItem.style.borderColor = 'var(--neon-cyan)';
    summaryItem.style.marginTop = '20px';

    summaryItem.innerHTML = `
        <h4 style="color: var(--neon-cyan); margin-bottom: 10px;">PROCESSING COMPLETE</h4>
        <p>Total Frames: ${data.total_frames}</p>
        <p>Windows Processed: ${data.processed_windows}</p>
        <p style="color: var(--neon-magenta); font-weight: bold;">Alerts: ${data.alerts}</p>
    `;

    resultsList.insertBefore(summaryItem, resultsList.firstChild);
}

/**
 * Download report
 */
function downloadReport() {
    if (allAlerts.length === 0) {
        showToast('No alerts to download', 'error');
        return;
    }

    let report = '=== SECURE VISION - VIOLENCE DETECTION REPORT ===\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Total Alerts: ${allAlerts.length}\n\n`;
    report += '='.repeat(50) + '\n\n';

    allAlerts.forEach((alert, index) => {
        report += `ALERT #${index + 1}\n`;
        report += `Time: ${formatTimestamp(alert.timestamp * 1000)}\n`;
        report += `Frame: ${alert.frame}\n`;
        report += `Violence Score: ${formatScore(alert.violence_score)}\n`;
        report += `Crime Type: ${alert.crime_label}\n\n`;
        if (alert.scene_description) {
            report += `Scene Description:\n${alert.scene_description}\n\n`;
        }
        report += `Report:\n${alert.report}\n\n`;
        report += '-'.repeat(50) + '\n\n';
    });

    const filename = `violence-report-${Date.now()}.txt`;
    downloadTextFile(report, filename);
    showToast('Report downloaded', 'success');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initUploadPanel);
