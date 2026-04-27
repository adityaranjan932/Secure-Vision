export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function formatScore(score) {
  return Number(score || 0).toFixed(2);
}

export function formatFileSize(bytes) {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / 1024 ** index;
  return `${Math.round(size * 100) / 100} ${units[index]}`;
}

export function getScoreClass(score) {
  if (score < 0.3) {
    return "safe";
  }

  if (score < 0.75) {
    return "warning";
  }

  return "danger";
}
