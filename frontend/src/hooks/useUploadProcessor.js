import { useEffect, useReducer, useRef } from "react";
import { createProcessingEventSource, uploadVideo } from "../services/api";
import { useToast } from "../state/ToastContext";
import { downloadTextFile } from "../utils/files";
import { formatScore, formatTimestamp } from "../utils/formatters";

const initialState = {
  selectedFile: null,
  sessionId: null,
  isUploading: false,
  isProcessing: false,
  progress: 0,
  results: [],
  alerts: [],
  summary: null
};

function reducer(state, action) {
  switch (action.type) {
    case "set-file":
      return { ...state, selectedFile: action.file };
    case "upload-start":
      return {
        ...state,
        isUploading: true,
        isProcessing: false,
        progress: 0,
        results: [],
        alerts: [],
        summary: null
      };
    case "upload-success":
      return {
        ...state,
        sessionId: action.sessionId,
        isUploading: false,
        isProcessing: true
      };
    case "upload-failure":
      return {
        ...state,
        isUploading: false,
        isProcessing: false
      };
    case "processing-update":
      return {
        ...state,
        progress: Math.round(action.data.progress || 0),
        results: [action.data, ...state.results].slice(0, 50)
      };
    case "alert":
      return {
        ...state,
        alerts: [...state.alerts, action.data]
      };
    case "summary":
      return {
        ...state,
        summary: action.data
      };
    case "complete":
      return {
        ...state,
        isUploading: false,
        isProcessing: false,
        progress: 100
      };
    default:
      return state;
  }
}

export function useUploadProcessor() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { showToast } = useToast();
  const eventSourceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  async function startUpload() {
    if (!state.selectedFile || state.isUploading || state.isProcessing) {
      return;
    }

    dispatch({ type: "upload-start" });
    showToast("Uploading video...", "info");

    try {
      const response = await uploadVideo(state.selectedFile);
      dispatch({ type: "upload-success", sessionId: response.session_id });
      showToast("Upload successful! Processing...", "success");

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const source = createProcessingEventSource(response.session_id);
      eventSourceRef.current = source;

      source.addEventListener("processing", (event) => {
        const data = JSON.parse(event.data);
        dispatch({ type: "processing-update", data });
      });

      source.addEventListener("alert", (event) => {
        const data = JSON.parse(event.data);
        dispatch({ type: "alert", data });
        showToast(`⚠ ${data.crime_label} detected!`, "error");
      });

      source.addEventListener("summary", (event) => {
        const data = JSON.parse(event.data);
        dispatch({ type: "summary", data });
      });

      source.addEventListener("complete", () => {
        source.close();
        eventSourceRef.current = null;
        dispatch({ type: "complete" });
        showToast("Processing completed!", "success");
      });

      source.addEventListener("error", () => {
        if (source.readyState === EventSource.CLOSED) {
          dispatch({ type: "upload-failure" });
          showToast("Connection closed", "error");
          source.close();
          eventSourceRef.current = null;
        }
      });
    } catch (error) {
      dispatch({ type: "upload-failure" });
      showToast(error.message, "error");
    }
  }

  function selectFile(file) {
    dispatch({ type: "set-file", file });
  }

  function downloadReport() {
    if (!state.alerts.length) {
      showToast("No alerts to download", "error");
      return;
    }

    let report = "=== SECURE VISION - VIOLENCE DETECTION REPORT ===\n\n";
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Total Alerts: ${state.alerts.length}\n\n`;
    report += `${"=".repeat(50)}\n\n`;

    state.alerts.forEach((alert, index) => {
      report += `ALERT #${index + 1}\n`;
      report += `Wall Clock Time: ${formatTimestamp(alert.timestamp * 1000)}\n`;
      if (alert.video_time) {
        report += `Video Timestamp: ${alert.video_time}\n`;
      }
      report += `Frame: ${alert.frame ?? "N/A"}\n`;
      report += `Violence Score: ${formatScore(alert.violence_score)}\n`;
      report += `Crime Type: ${alert.crime_label}\n\n`;

      if (alert.scene_description) {
        report += `Scene Description:\n${alert.scene_description}\n\n`;
      }

      report += `Report:\n${alert.report}\n\n`;
      report += `${"-".repeat(50)}\n\n`;
    });

    downloadTextFile(report, `violence-report-${Date.now()}.txt`);
    showToast("Report downloaded", "success");
  }

  return {
    ...state,
    canUpload: Boolean(state.selectedFile) && !state.isUploading && !state.isProcessing,
    downloadReport,
    selectFile,
    startUpload
  };
}
