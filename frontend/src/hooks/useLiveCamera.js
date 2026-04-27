import { useEffect, useReducer, useRef } from "react";
import { getWebSocketUrl } from "../services/api";
import { useToast } from "../state/ToastContext";

const FRAME_RATE = 10;
const FRAME_INTERVAL = 1000 / FRAME_RATE;
const JPEG_QUALITY = 0.7;

const initialState = {
  connectionStatus: "disconnected",
  liveStatus: "NO VIOLENCE DETECTED",
  crimeType: "NONE",
  lastUpdate: "--:--:--",
  overlayMessage: "Initializing camera...",
  score: 0,
  isViolence: false,
  sceneDescription: "",
  alertHistory: []
};

function reducer(state, action) {
  switch (action.type) {
    case "status":
      return { ...state, connectionStatus: action.status };
    case "overlay":
      return { ...state, overlayMessage: action.message };
    case "reset":
      return { ...initialState, overlayMessage: "Click START CAMERA to begin live detection" };
    case "result":
      return {
        ...state,
        score: action.data.violence_score,
        isViolence: action.data.is_violence,
        liveStatus: action.data.is_violence
          ? "VIOLENCE DETECTED"
          : action.data.violence_score > 0.3
            ? "SUSPICIOUS"
            : "NO VIOLENCE DETECTED",
        crimeType: action.data.crime_label || "NONE",
        lastUpdate: new Date(action.data.timestamp).toLocaleTimeString(),
        sceneDescription: action.data.scene_description || ""
      };
    case "alert":
      return {
        ...state,
        alertHistory: [action.data, ...state.alertHistory].slice(0, 10)
      };
    default:
      return state;
  }
}

export function useLiveCamera() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { showToast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
    autoStartCamera();

    return () => stopCamera();
  }, []);

  async function autoStartCamera() {
    try {
      const permissions = await navigator.permissions.query({ name: "camera" });

      if (permissions.state === "granted") {
        await startCamera();
        return;
      }

      if (permissions.state === "denied") {
        dispatch({
          type: "overlay",
          message: "Camera access denied. Please enable camera permissions and refresh."
        });
        showToast("Camera access denied. Please enable camera permissions.", "error");
        return;
      }
    } catch (error) {
      // Some browsers do not support the Permissions API.
    }

    dispatch({ type: "overlay", message: "Click START CAMERA to begin live detection" });
    showToast('Click "START CAMERA" to begin live detection', "info");
  }

  async function startCamera() {
    try {
      showToast("Requesting camera access...", "info");
      dispatch({ type: "status", status: "connecting" });

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      connectWebSocket();
      showToast("Camera started successfully! Connecting to AI service...", "success");
    } catch (error) {
      dispatch({
        type: "overlay",
        message: getCameraErrorMessage(error)
      });
      dispatch({ type: "status", status: "disconnected" });
      showToast(getCameraToast(error), "error");
      stopCamera({ resetState: false, silent: true });
    }
  }

  function stopCamera({ resetState = true, silent = false } = {}) {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (resetState) {
      dispatch({ type: "reset" });
    }

    if (!silent) {
      showToast("Camera stopped", "info");
    }
  }

  function connectWebSocket() {
    const socket = new WebSocket(getWebSocketUrl());
    socketRef.current = socket;

    socket.onopen = () => {
      dispatch({ type: "status", status: "connected" });
      dispatch({ type: "overlay", message: "" });
      showToast("Connected! Streaming to server...", "success");
      startFrameCapture();
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "result") {
        dispatch({ type: "result", data });
        return;
      }

      if (data.type === "alert") {
        dispatch({ type: "alert", data });
        showToast(`⚠ ${data.crime_label} DETECTED!`, "error");
        return;
      }

      if (data.type === "error") {
        showToast(data.message, "error");
      }
    };

    socket.onerror = () => {
      showToast("Connection error", "error");
    };

    socket.onclose = () => {
      dispatch({ type: "status", status: "disconnected" });

      if (intervalRef.current) {
        stopCamera({ silent: true });
      }
    };
  }

  function startFrameCapture() {
    intervalRef.current = window.setInterval(() => {
      const socket = socketRef.current;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN || !video || !canvas) {
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (!canvas.width || !canvas.height) {
        return;
      }

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0);

      try {
        const data = canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1];
        socket.send(
          JSON.stringify({
            type: "frame",
            data,
            timestamp: Date.now()
          })
        );
      } catch (error) {
        showToast("Frame capture error", "error");
      }
    }, FRAME_INTERVAL);
  }

  return {
    ...state,
    startCamera,
    stopCamera,
    videoRef
  };
}

function getCameraErrorMessage(error) {
  if (error.name === "NotAllowedError") {
    return 'Camera access denied. Please allow camera permission and click "START CAMERA".';
  }

  if (error.name === "NotFoundError") {
    return "No camera detected. Please connect a camera.";
  }

  if (error.name === "NotReadableError") {
    return "Camera is already in use. Please close other camera apps.";
  }

  return "Unable to access the camera.";
}

function getCameraToast(error) {
  if (error.name === "NotAllowedError") {
    return "Camera access denied. Please allow camera permission and try again.";
  }

  if (error.name === "NotFoundError") {
    return "No camera found on this device.";
  }

  if (error.name === "NotReadableError") {
    return "Camera is already in use by another application.";
  }

  return "Failed to access camera";
}
