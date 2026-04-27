export function getApiBaseUrl() {
  return `${window.location.protocol}//${window.location.host}/api`;
}

export function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/live`;
}

export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

export function createProcessingEventSource(sessionId) {
  return new EventSource(`${getApiBaseUrl()}/process/${sessionId}`);
}
