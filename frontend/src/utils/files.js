import { formatFileSize } from "./formatters";

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const VIDEO_NAME_PATTERN = /\.(mp4|avi|mov|mkv|webm)$/i;

export function validateVideoFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  if (!file.type.startsWith("video/") && !VIDEO_NAME_PATTERN.test(file.name)) {
    return { valid: false, error: "Invalid file type. Please upload a video file." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  return { valid: true };
}

export function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
