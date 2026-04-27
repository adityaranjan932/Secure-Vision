import { LivePanel } from "./components/LivePanel";
import { Toast } from "./components/Toast";
import { UploadPanel } from "./components/UploadPanel";

export default function App() {
  return (
    <>
      <div className="container">
        <header className="header">
          <h1 className="title">SECURE VISION</h1>
          <p className="subtitle">AI-POWERED VIOLENCE DETECTION SYSTEM</p>
        </header>

        <main className="main-grid">
          <UploadPanel />
          <LivePanel />
        </main>
      </div>

      <Toast />
    </>
  );
}
