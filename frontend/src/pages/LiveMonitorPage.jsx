import { useState, useEffect } from "react";
import { Navbar, FauxFeed, useTimeNow } from "./shared";

export default function LiveMonitorPage() {
  const [score, setScore] = useState(0.18);
  const [alert, setAlert] = useState(false);
  const [crime, setCrime] = useState("None");
  const [desc, setDesc] = useState("Scene is nominal. Two individuals visible in upper quadrant, conversational posture, no aggressive motion vectors detected.");
  const [history] = useState([
    { time: "22:14:08", level: "crit", text: "Physical altercation · 0.94" },
    { time: "22:11:52", level: "warn", text: "Loitering · 0.78" },
    { time: "22:09:31", level: "info", text: "Camera reconnected" },
    { time: "22:04:18", level: "warn", text: "Unattended package · 0.81" }
  ]);

  useEffect(() => {
    const i = setInterval(() => {
      setScore(s => {
        const drift = (Math.random() - 0.5) * 0.08;
        let next = Math.max(0.05, Math.min(0.99, s + drift));
        if (Math.random() < 0.07) next = 0.85 + Math.random() * 0.14;
        return next;
      });
    }, 800);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const isAlert = score > 0.75;
    setAlert(isAlert);
    if (isAlert) {
      setCrime("Physical altercation");
      setDesc("Two individuals engaged in escalating physical contact. Aggressive motion vectors detected in central frame region. Confidence rising. Recommend immediate response.");
    } else if (score > 0.4) {
      setCrime("Elevated activity");
      setDesc("Increased motion energy in central frame. Subjects in close proximity, posture neutral. Continuing to monitor for escalation.");
    } else {
      setCrime("None");
      setDesc("Scene is nominal. Two individuals visible in upper quadrant, conversational posture, no aggressive motion vectors detected.");
    }
  }, [score]);

  const level = score > 0.75 ? "alert" : score > 0.4 ? "warn" : "safe";
  const levelLabel = level === "alert" ? "THREAT" : level === "warn" ? "ELEVATED" : "NOMINAL";
  const time = useTimeNow();

  return (
    <div className="live-page">
      <Navbar active="live" />
      <div className="live-shell">
        <div className="live-feed-wrap">
          <div className={"live-feed" + (alert ? " alert" : "")}>
            <FauxFeed
              alert={alert}
              showHud={false}
              boxes={[
                { x: 22, y: 48, w: 14, h: 36, alert, label: alert ? "ALERT " + score.toFixed(2) : "PERSON 0.96" },
                { x: 58, y: 50, w: 12, h: 32, label: "PERSON 0.93" }
              ]}
            />
            <div className="live-corner tl"></div>
            <div className="live-corner tr"></div>
            <div className="live-corner bl"></div>
            <div className="live-corner br"></div>
            <div className="live-hud">
              <div className="live-hud-top">
                <div className="live-hud-grp">
                  <span className="live-badge"><span className="dot"></span>LIVE</span>
                  <span className="live-pill">CAM-04 · LOBBY · NORTH</span>
                </div>
                <div className="live-hud-grp">
                  <span className="live-pill">1080p · 30fps</span>
                  <span className="live-pill">{time}</span>
                </div>
              </div>
              <div className="live-hud-bot">
                <div className="live-hud-grp">
                  <div className="live-score">
                    <span style={{ color: "var(--text-dim)" }}>VIOLENCE</span>
                    <div className={"live-score-bar " + level}>
                      <div className="fill" style={{ width: (score * 100) + "%" }}></div>
                    </div>
                    <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 36 }}>{score.toFixed(2)}</span>
                  </div>
                </div>
                <div className="live-hud-grp">
                  <span className="live-pill" style={{ color: level === "alert" ? "var(--red)" : level === "warn" ? "var(--amber)" : "var(--green)" }}>
                    {level === "alert" ? "⚠" : "✓"} {levelLabel}
                  </span>
                  <span className="live-pill">CLASS · {crime.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="live-side">
          <div className="live-side-section">
            <h4>Violence score</h4>
            <div className={"score-big " + level}>{score.toFixed(2)}</div>
            <div className="score-meta">{levelLabel} · {crime} · {alert ? "ALERTING" : "MONITORING"}</div>
            <div className="score-bar-big">
              <div className={"fill " + level} style={{ width: (score * 100) + "%" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", marginTop: 8, letterSpacing: "0.05em" }}>
              <span>0.00</span><span>THRESHOLD 0.75</span><span>1.00</span>
            </div>
          </div>

          <div className="live-side-section">
            <h4>AI description</h4>
            <p className="ai-desc">{desc}</p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", marginTop: 12, letterSpacing: "0.1em" }}>
              GROQ · LLAMA 3.1 8B · INSTANT
            </div>
          </div>

          <div className="live-side-section" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <h4>Recent · this camera</h4>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((h, i) => (
                <div key={i} className={"alert-item " + h.level} style={{ padding: "10px 12px" }}>
                  <div className="alert-item-head">
                    <span className="alert-item-tag">{h.level}</span>
                    <span className="alert-item-time">{h.time}</span>
                  </div>
                  <div className="alert-item-meta" style={{ fontSize: 12, color: "var(--text)" }}>{h.text}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>
              View full history →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
