/**
 * Utility Functions for Secure Vision
 */

/**
 * Format timestamp to HH:MM:SS
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format violence score to 2 decimals
 * @param {number} score - Violence score (0-1)
 * @returns {string} Formatted score
 */
function formatScore(score) {
    return score.toFixed(2);
}

/**
 * Get CSS class for violence score color coding
 * @param {number} score - Violence score (0-1)
 * @returns {string} CSS class name
 */
function getScoreClass(score) {
    if (score < 0.3) return 'safe';
    if (score < 0.75) return 'warning';
    return 'danger';
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'info', 'success', 'error'
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Download text content as a file
 * @param {string} content - Text content to download
 * @param {string} filename - Name of the file
 */
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate video file
 * @param {File} file - File to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validateVideoFile(file) {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
        return { valid: false, error: 'Invalid file type. Please upload a video file.' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: `File too large. Maximum size is ${formatFileSize(maxSize)}` };
    }

    return { valid: true };
}

/**
 * Get current page host for WebSocket connection
 * @returns {string} WebSocket URL
 */
function getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/live`;
}

/**
 * Get API base URL
 * @returns {string} API base URL
 */
function getApiBaseUrl() {
    return `${window.location.protocol}//${window.location.host}/api`;
}
