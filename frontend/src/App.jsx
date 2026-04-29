import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LivePanel } from "./components/LivePanel";
import { Toast } from "./components/Toast";
import { UploadPanel } from "./components/UploadPanel";
import { ToastProvider } from "./state/ToastContext";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import LiveMonitorPage from "./pages/LiveMonitorPage";
import SetupPage from "./pages/SetupPage";

function Console() {
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

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Console />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/monitor" element={<LiveMonitorPage />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
