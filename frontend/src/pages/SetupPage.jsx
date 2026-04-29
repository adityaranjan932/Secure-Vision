import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "./shared";

function TypeIcon({ name }) {
  const p = { width: 36, height: 36, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "webcam") return <svg {...p}><circle cx="12" cy="10" r="6" /><circle cx="12" cy="10" r="2.5" /><path d="M5 22h14M9 22v-3M15 22v-3" /></svg>;
  if (name === "ipcam") return <svg {...p}><rect x="2" y="6" width="14" height="10" rx="1.5" /><path d="m16 10 6-3v10l-6-3" /><circle cx="9" cy="11" r="2" /></svg>;
  if (name === "rtsp") return <svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /><circle cx="18" cy="17" r="2" /></svg>;
  return null;
}

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("ip");
  const [details, setDetails] = useState({ name: "Loading dock · West", ip: "192.168.1.42", port: "554", user: "admin", pass: "" });
  const [testProgress, setTestProgress] = useState(0);

  useEffect(() => {
    if (step !== 3) { setTestProgress(0); return; }
    const i = setInterval(() => {
      setTestProgress(p => {
        if (p >= 4) { clearInterval(i); return 4; }
        return p + 1;
      });
    }, 700);
    return () => clearInterval(i);
  }, [step]);

  const types = [
    { id: "webcam", title: "Webcam", sub: "USB · BUILT-IN", icon: "webcam" },
    { id: "ip", title: "IP Camera", sub: "ONVIF · HTTP", icon: "ipcam" },
    { id: "rtsp", title: "RTSP Stream", sub: "RTSP:// · TCP/UDP", icon: "rtsp" }
  ];

  const testRows = [
    { label: "Resolving address", val: "192.168.1.42" },
    { label: "TCP handshake", val: "PORT 554 · ESTABLISHED" },
    { label: "Authentication", val: "ADMIN · OK" },
    { label: "Stream negotiation", val: "H.264 · 1920×1080 · 30fps" }
  ];

  const existing = [
    { id: "CAM-01", name: "Atrium · Main", type: "RTSP", status: "online" },
    { id: "CAM-02", name: "Entrance · Front", type: "IP", status: "online" },
    { id: "CAM-04", name: "Lobby · North", type: "IP", status: "alert" },
    { id: "CAM-12", name: "Rooftop · East", type: "RTSP", status: "offline" }
  ];

  return (
    <div className="setup-page">
      <Navbar active="setup" />
      <div className="setup-card">
        <div className="setup-head">
          <h1>Add a camera</h1>
          <p>Three steps. Thirty seconds. No proprietary hardware required.</p>
        </div>

        <div className="steps">
          <div className={"step " + (step === 1 ? "active" : step > 1 ? "done" : "")}>
            <span className="step-num">{step > 1 ? "✓" : "1"}</span> SOURCE
          </div>
          <div className="step-bar"></div>
          <div className={"step " + (step === 2 ? "active" : step > 2 ? "done" : "")}>
            <span className="step-num">{step > 2 ? "✓" : "2"}</span> DETAILS
          </div>
          <div className="step-bar"></div>
          <div className={"step " + (step === 3 ? "active" : "")}>
            <span className="step-num">3</span> CONNECT
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="type-grid">
              {types.map(t => (
                <div key={t.id} className={"type-card" + (type === t.id ? " selected" : "")}
                  onClick={() => setType(t.id)}>
                  <div className="type-card-icon"><TypeIcon name={t.icon} /></div>
                  <div className="type-card-title">{t.title}</div>
                  <div className="type-card-sub">{t.sub}</div>
                </div>
              ))}
            </div>
            <div className="setup-actions">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em" }}>STEP 1 / 3</span>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Continue →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-row">
              <label>Camera name</label>
              <input value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} />
            </div>
            <div className="form-row split">
              <div>
                <label>IP address</label>
                <input value={details.ip} onChange={e => setDetails({ ...details, ip: e.target.value })} />
              </div>
              <div>
                <label>Port</label>
                <input value={details.port} onChange={e => setDetails({ ...details, port: e.target.value })} />
              </div>
            </div>
            <div className="form-row split">
              <div>
                <label>Username</label>
                <input value={details.user} onChange={e => setDetails({ ...details, user: e.target.value })} />
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={details.pass} onChange={e => setDetails({ ...details, pass: e.target.value })} />
              </div>
            </div>
            <div className="setup-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Test connection →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="test-vis">
              {testRows.map((r, i) => (
                <div key={i} className={"test-row" + (testProgress === i ? " active" : testProgress > i ? " done" : "")}>
                  <span className="ping"></span>
                  <span className="label">[ {String(i + 1).padStart(2, "0")} ] {r.label}</span>
                  <span className={testProgress > i ? "ok" : "val"}>
                    {testProgress > i ? r.val : testProgress === i ? "..." : "—"}
                  </span>
                </div>
              ))}
            </div>
            {testProgress >= 4 && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 13, color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                ✓ STREAM ACQUIRED · AI ANALYSIS ENABLED · CAMERA REGISTERED AS CAM-15
              </div>
            )}
            <div className="setup-actions">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <Link to="/dashboard" className="btn btn-primary"
                style={{ pointerEvents: testProgress < 4 ? "none" : "auto", opacity: testProgress < 4 ? 0.5 : 1 }}>
                Finish & view dashboard →
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="cams-table">
        <div className="cams-table-head">
          <h3>Connected cameras</h3>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>14 ACTIVE · 2 OFFLINE</span>
        </div>
        {existing.map(c => (
          <div key={c.id} className="cams-row">
            <div className="id">{c.id.replace("CAM-", "")}</div>
            <div>
              <div>{c.name}</div>
              <div className="meta">[ {c.id} ]</div>
            </div>
            <div className="meta">{c.type}</div>
            <div className={"cam-status " + (c.status === "online" ? "safe" : c.status === "alert" ? "alert" : "off")}>
              <span className="dot"></span>{c.status.toUpperCase()}
            </div>
            <button className="btn btn-ghost btn-sm">Configure</button>
          </div>
        ))}
      </div>
    </div>
  );
}
