import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar, FauxFeed, useTimeNow, formatNow } from "./shared";

function Sparkline({ data, color = "var(--blue)" }) {
  const w = 120, h = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg className="metric-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.08" stroke="none" />
    </svg>
  );
}

function Metric({ label, value, unit, tag, tagType, spark, color }) {
  return (
    <div className="metric">
      <div className="metric-head">
        <span className="metric-label">{label}</span>
        {tag && <span className={"metric-tag " + tagType}>{tag}</span>}
      </div>
      <div className="metric-num">{value}{unit && <span className="unit">{unit}</span>}</div>
      <Sparkline data={spark} color={color} />
    </div>
  );
}

export default function DashboardPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, level: "crit", title: "Physical altercation detected", cam: "CAM-04 · LOBBY-N", time: "22:14:08", conf: 0.94 },
    { id: 2, level: "warn", title: "Suspicious loitering", cam: "CAM-07 · GARAGE-B2", time: "22:11:52", conf: 0.78 },
    { id: 3, level: "info", title: "Camera reconnected", cam: "CAM-12 · ROOFTOP", time: "22:09:31", conf: null },
    { id: 4, level: "warn", title: "Unattended package", cam: "CAM-02 · ENTRANCE", time: "22:04:18", conf: 0.81 },
    { id: 5, level: "info", title: "Shift change logged", cam: "OPERATOR · J. Reyes", time: "22:00:00", conf: null }
  ]);
  const [counter, setCounter] = useState(6);

  useEffect(() => {
    const i = setInterval(() => {
      const samples = [
        { level: "info", title: "Motion detected · low priority", cam: "CAM-09 · CORRIDOR-W", conf: 0.42 },
        { level: "warn", title: "Crowd density elevated", cam: "CAM-01 · ATRIUM", conf: 0.71 },
        { level: "crit", title: "Object thrown · vandalism", cam: "CAM-11 · STAIR-3", conf: 0.88 }
      ];
      const s = samples[Math.floor(Math.random() * samples.length)];
      setAlerts(prev => [{ id: counter, ...s, time: formatNow() }, ...prev].slice(0, 12));
      setCounter(c => c + 1);
    }, 12000);
    return () => clearInterval(i);
  }, [counter]);

  const cams = [
    { id: "CAM-01", name: "Atrium · Main", status: "safe", boxes: [{ x: 22, y: 50, w: 8, h: 32, label: "PERSON 0.96" }, { x: 60, y: 52, w: 8, h: 30, label: "PERSON 0.93" }] },
    { id: "CAM-04", name: "Lobby · North", status: "alert", boxes: [{ x: 30, y: 48, w: 14, h: 36, alert: true, label: "ALERT 0.94" }] },
    { id: "CAM-07", name: "Garage · B2", status: "safe", boxes: [{ x: 45, y: 55, w: 8, h: 30, label: "PERSON 0.88" }] },
    { id: "CAM-12", name: "Rooftop · East", status: "off", boxes: [] }
  ];

  return (
    <div className="dash">
      <Navbar active="dash" />
      <div className="dash-shell">
        <div className="dash-main">
          <div className="dash-head">
            <div>
              <h1>Operations Console</h1>
              <div className="dash-head-meta">REGION · NORTH-AMERICA · {useTimeNow()} · {new Date().toDateString().toUpperCase()}</div>
            </div>
            <div className="dash-head-actions">
              <button className="btn btn-ghost btn-sm">Export logs</button>
              <Link to="/setup" className="btn btn-primary btn-sm">+ Add camera</Link>
            </div>
          </div>

          <div className="metrics">
            <Metric label="Cameras online" value="12" unit="/ 14" tag="LIVE" tagType="live"
              spark={[8, 9, 9, 11, 12, 12, 12, 13, 12, 12, 12, 12]} />
            <Metric label="Alerts today" value="47" tag="+12%" tagType="up"
              spark={[3, 5, 4, 8, 6, 9, 12, 11, 14, 10, 15, 18]} color="var(--amber)" />
            <Metric label="Detections (24h)" value="2,841" tag="+8.4%" tagType="up"
              spark={[120, 140, 110, 180, 220, 190, 240, 260, 230, 280, 310, 290]} />
            <Metric label="System health" value="99.98" unit="%" tag="STABLE" tagType="up"
              spark={[99.9, 99.95, 99.98, 99.97, 99.99, 99.98, 99.98, 99.98, 99.97, 99.98, 99.99, 99.98]}
              color="var(--green)" />
          </div>

          <div className="cam-grid-head">
            <h2>Live feeds</h2>
            <div className="filters">
              <button className="cam-filter active">ALL · 14</button>
              <button className="cam-filter">ALERTS · 1</button>
              <button className="cam-filter">OFFLINE · 2</button>
            </div>
          </div>

          <div className="cam-grid">
            {cams.map(c => (
              <Link key={c.id} to="/monitor" className={"cam-card" + (c.status === "alert" ? " alert" : "")}>
                <div className="cam-card-feed">
                  {c.status === "off" ? (
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
                      background: "var(--bg-2)", color: "var(--text-faint)",
                      fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em" }}>
                      ✗ SIGNAL LOST
                    </div>
                  ) : (
                    <FauxFeed alert={c.status === "alert"} boxes={c.boxes} name={c.id} />
                  )}
                </div>
                <div className="cam-card-foot">
                  <div>
                    <div className="cam-card-name">{c.name}</div>
                    <div className="cam-card-meta">[ {c.id} ] · 1080p · 30fps</div>
                  </div>
                  <div className={"cam-status " + c.status}>
                    <span className="dot"></span>
                    {c.status === "safe" ? "Nominal" : c.status === "alert" ? "Threat" : "Offline"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="dash-side">
          <div className="alerts">
            <div className="alerts-head">
              <h3>Live alerts</h3>
              <span className="count">{alerts.length} ACTIVE</span>
            </div>
            <div className="alerts-list">
              {alerts.map(a => (
                <div key={a.id} className={"alert-item " + a.level}>
                  <div className="alert-item-head">
                    <span className="alert-item-tag">{a.level === "crit" ? "Critical" : a.level === "warn" ? "Warning" : "Info"}</span>
                    <span className="alert-item-time">{a.time}</span>
                  </div>
                  <div className="alert-item-title">{a.title}</div>
                  <div className="alert-item-meta">
                    {a.cam}{a.conf != null ? ` · ${a.conf.toFixed(2)}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
