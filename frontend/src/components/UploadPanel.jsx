import { useRef, useState } from "react";
import { useUploadProcessor } from "../hooks/useUploadProcessor";
import { useToast } from "../state/ToastContext";
import { validateVideoFile } from "../utils/files";
import { formatFileSize, formatScore, getScoreClass } from "../utils/formatters";

export function UploadPanel() {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const {
    alerts,
    canUpload,
    downloadReport,
    isProcessing,
    progress,
    results,
    selectedFile,
    selectFile,
    summary,
    startUpload
  } = useUploadProcessor();
  const { showToast } = useToast();

  function handleFile(file) {
    const validation = validateVideoFile(file);

    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }

    selectFile(file);
    showToast("Video ready to upload", "success");
  }

  return (
    <section className="panel upload-panel">
      <h2 className="panel-title">VIDEO UPLOAD</h2>

      <div
        className={`upload-zone ${isDragging ? "drag-over" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
      >
        <div className="upload-icon">▼</div>
        <p className="upload-text">
          {selectedFile ? selectedFile.name : "Drag & Drop Video File"}
        </p>
        <p className="upload-subtext">
          {selectedFile ? formatFileSize(selectedFile.size) : "or click to browse"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <button className="btn btn-primary" onClick={startUpload} disabled={!canUpload}>
        {isProcessing ? "PROCESSING..." : "UPLOAD VIDEO"}
      </button>

      {isProcessing ? (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-text">{progress}%</p>
        </div>
      ) : null}

      <div className="results-container">
        <h3 className="results-title">PROCESSING RESULTS</h3>
        <div className="results-list">
          {!results.length && !summary ? (
            <p className="placeholder-text">
              {isProcessing ? "Processing video..." : "No results yet. Upload a video to begin."}
            </p>
          ) : (
            <>
              {summary ? (
                <div className="result-item result-summary">
                  <h4 className="summary-title">PROCESSING COMPLETE</h4>
                  <p>Total Frames: {summary.total_frames}</p>
                  <p>Windows Processed: {summary.processed_windows}</p>
                  <p className="summary-alerts">Alerts: {summary.alerts}</p>
                </div>
              ) : null}
              {results.map((result, index) => (
                <div
                  key={`${result.frame}-${index}`}
                  className={`result-item ${getScoreClass(result.violence_score)}`}
                >
                  <p className="result-frame">
                    Frame {result.frame} / {result.total_frames}
                  </p>
                  <p className="result-score">Score: {formatScore(result.violence_score)}</p>
                  {result.is_violence && result.crime_label ? (
                    <p className="result-label">⚠ {result.crime_label}</p>
                  ) : null}
                  {result.scene_description ? (
                    <p className="result-description">{result.scene_description}</p>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {alerts.length ? (
        <button className="btn btn-secondary" onClick={downloadReport}>
          DOWNLOAD REPORT
        </button>
      ) : null}
    </section>
  );
}
