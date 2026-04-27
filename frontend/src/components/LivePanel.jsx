import { formatScore, formatTimestamp } from "../utils/formatters";
import { useLiveCamera } from "../hooks/useLiveCamera";

export function LivePanel() {
  const {
    alertHistory,
    connectionStatus,
    crimeType,
    isViolence,
    lastUpdate,
    liveStatus,
    overlayMessage,
    sceneDescription,
    score,
    startCamera,
    stopCamera,
    videoRef
  } = useLiveCamera();

  return (
    <section className="panel camera-panel">
      <h2 className="panel-title">LIVE CAMERA STREAM</h2>

      <div className="camera-container">
        <video ref={videoRef} id="cameraFeed" autoPlay playsInline />
        <div className="scanline" />
        {overlayMessage ? (
          <div className="camera-overlay">
            <p>{overlayMessage}</p>
          </div>
        ) : null}
      </div>

      <div className="camera-controls">
        <button className="btn btn-success" onClick={startCamera} disabled={connectionStatus !== "disconnected"}>
          START CAMERA
        </button>
        <button className="btn btn-danger" onClick={() => stopCamera()} disabled={connectionStatus === "disconnected"}>
          STOP CAMERA
        </button>
        <div className="status-indicator">
          <span className={`status-dot ${connectionStatus}`} />
          <span className="status-text">
            {connectionStatus === "connecting"
              ? "Connecting..."
              : connectionStatus === "connected"
                ? "Connected"
                : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="analysis-card">
        <h3 className="analysis-title">LIVE ANALYSIS</h3>
        <div className="analysis-content">
          <div className="score-display">
            <div className={`score-circle ${isViolence ? "danger" : ""}`}>
              <span className="score-value">{formatScore(score)}</span>
            </div>
            <p className="score-label">Violence Score</p>
          </div>
          <div className="analysis-info">
            <p className="info-item">
              <span className="info-label">Status:</span>
              <span className={`info-value ${isViolence ? "danger" : ""}`}>{liveStatus}</span>
            </p>
            <p className="info-item">
              <span className={`info-label ${crimeType !== "NONE" ? "danger" : ""}`}>Crime Type:</span>
              <span className={`info-value ${crimeType !== "NONE" ? "danger" : ""}`}>{crimeType}</span>
            </p>
            <p className="info-item">
              <span className="info-label">Last Update:</span>
              <span className="info-value">{lastUpdate}</span>
            </p>
          </div>
        </div>

        {sceneDescription ? (
          <div className="scene-description">
            <p className="scene-description-label">Scene Description:</p>
            <p className="scene-description-text">{sceneDescription}</p>
          </div>
        ) : null}
      </div>

      <div className="alert-history">
        <h3 className="alert-title">ALERT HISTORY</h3>
        <div className="alert-list">
          {!alertHistory.length ? (
            <p className="placeholder-text">No alerts yet</p>
          ) : (
            alertHistory.map((alert, index) => (
              <div key={`${alert.timestamp}-${index}`} className="alert-item">
                <span className="alert-time">{formatTimestamp(alert.timestamp * 1000)}</span>
                <span className="alert-type">{alert.crime_label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
