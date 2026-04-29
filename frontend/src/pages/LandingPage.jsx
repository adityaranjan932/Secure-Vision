import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Navbar, Reveal, useCountUp, useTimeNow } from "./shared";

function HeroSection() {
  const heroRef = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      const h = el.offsetHeight;
      const p = Math.max(0, Math.min(1, window.scrollY / h));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const contentScale = 1 + progress * 0.06;
  const contentOpacity = 1 - progress * 0.9;

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-bg-new">
        <div className="hero-aurora"></div>
        <div className="hero-grid-new"></div>
        <div className="hero-spotlight"></div>
      </div>
      <div
        className="hero-content"
        style={{ transform: `translate(-50%, -50%) scale(${contentScale})`, opacity: Math.max(0, contentOpacity) }}
      >
        <h1>
          Every camera.<br />
          Every frame.<br />
          <span className="accent">Protected.</span>
        </h1>
        <p className="hero-sub">
          AI-powered violence detection that watches every feed, every second —
          so your team can act in the moments that matter.
        </p>
        <div className="hero-ctas">
          <Link to="/dashboard" className="btn btn-primary">Get started</Link>
          <a href="#how" className="btn btn-ghost">See how it works ›</a>
        </div>
      </div>
      <div className="hero-telem left" style={{ opacity: Math.max(0, 1 - progress * 2) }}>
        SECURE VISION · v2.4
      </div>
      <div className="hero-telem right" style={{ opacity: Math.max(0, 1 - progress * 2) }}>
        EST · 2026
      </div>
    </section>
  );
}

function ProblemSection() {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const lines = [
    "Cameras are everywhere.",
    "But threats happen in seconds.",
    "No human can watch everything.",
    "Secure Vision can."
  ];

  useEffect(() => {
    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const segP = progress * lines.length;
  const visualScale = 0.95 + Math.min(progress * 1.2, 1) * 0.05;
  const visualOpacity = 0.4 + Math.min(0.6, progress * 2);
  const showAlert = progress > 0.6;
  const time = useTimeNow();

  return (
    <section className="problem">
      <div ref={trackRef} className="problem-track">
        <div className="problem-pin">
          <div className="problem-text">
            <div className="problem-counter" style={{ opacity: Math.min(1, progress * 5) }}>
              [ 0{Math.min(lines.length, Math.floor(segP) + 1)} / 0{lines.length} ] &nbsp; THE PROBLEM
            </div>
            <div className="problem-lines">
              {lines.map((line, i) => {
                const center = i + 0.5;
                const dist = segP - center;
                const opacity = Math.max(0, 1 - Math.abs(dist) * 2.2);
                const ty = dist * 20;
                const blur = 0;
                const isActive = Math.abs(dist) < 0.5;
                return (
                  <div
                    key={i}
                    className={"problem-line" + (i === lines.length - 1 ? " last" : "")}
                    style={{
                      opacity,
                      transform: `translateY(${ty}px)`,
                      filter: `blur(${blur}px)`,
                      pointerEvents: isActive ? "auto" : "none"
                    }}
                  >
                    {i === lines.length - 1
                      ? <>Secure Vision <span className="blue">can</span>.</>
                      : line}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="cctv" style={{ transform: `scale(${visualScale})`, opacity: visualOpacity }}>
            <video className="cctv-video" autoPlay muted loop playsInline preload="auto">
              <source src="https://videos.pexels.com/video-files/4488717/4488717-uhd_3840_2160_30fps.mp4" type="video/mp4" />
              <source src="https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4" type="video/mp4" />
            </video>
            <div className={"cctv-box" + (showAlert ? " alert" : "")}
              style={{ left: "20%", top: "48%", width: "12%", height: "36%" }}>
              <span className="cctv-box-label">{showAlert ? "ALERT 0.94" : "PERSON 0.97"}</span>
            </div>
            <div className="cctv-box" style={{ left: "58%", top: "50%", width: "10%", height: "32%" }}>
              <span className="cctv-box-label">PERSON 0.91</span>
            </div>
            <div className="cctv-corner tl"></div>
            <div className="cctv-corner tr"></div>
            <div className="cctv-corner bl"></div>
            <div className="cctv-corner br"></div>
            <div className="cctv-hud">
              <div className="cctv-hud-row">
                <div className="cctv-hud-tag"><span className="rec"></span>REC · CAM-04 · LOBBY-NORTH</div>
                <div>{time}</div>
              </div>
              <div className="cctv-hud-row">
                <div>1080p · 30fps · 16f/s analyzed</div>
                <div style={{ color: showAlert ? "var(--red)" : "var(--green)" }}>
                  {showAlert ? "⚠ THREAT DETECTED" : "✓ NOMINAL"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how">
      <Panel num="01" title="Connect any camera"
        body="Webcam, IP camera, or RTSP stream. Setup takes 30 seconds — no proprietary hardware, no SDKs, no rip-and-replace."
        meta="STEP · 01 / 03">
        <CameraDraw />
      </Panel>
      <Panel num="02" title="AI watches every frame"
        body="Our VideoMAE model analyzes 16 frames per second across 13 crime categories — 82.54% accuracy, sub-second inference, on commodity GPUs."
        meta="STEP · 02 / 03" flip>
        <NeuralNet />
      </Panel>
      <Panel num="03" title="Instant alert. Professional report."
        body="Groq-powered LLM generates incident reports in milliseconds. Your team is paged with context, severity, and a one-click jump to the moment in the feed."
        meta="STEP · 03 / 03">
        <AlertStack />
      </Panel>
    </section>
  );
}

function Panel({ num, title, body, meta, flip, children }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="how-panel">
      <div className="how-grid" style={{ direction: flip ? "rtl" : "ltr" }}>
        <div style={{ direction: "ltr" }}>
          <div className="section-eyebrow">{meta}</div>
          <div className="how-num">{num}</div>
          <h2 className="how-title">{title}</h2>
          <p className="how-body">{body}</p>
        </div>
        <div style={{ direction: "ltr", display: "flex", justifyContent: flip ? "flex-start" : "flex-end" }}>
          <div className={"how-vis " + (inView ? "in-view" : "")}>
            {React.cloneElement(children, { active: inView })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraDraw({ active }) {
  return (
    <div className={"how-cam" + (active ? " in" : "")}>
      <svg viewBox="0 0 200 200">
        <path className="draw" d="M 40 80 L 130 80 L 130 140 L 40 140 Z" />
        <path className="draw draw-2" d="M 130 95 L 165 75 L 165 145 L 130 125 Z" />
        <path className="draw draw-3" d="M 85 80 L 85 50 L 85 50 M 75 50 L 95 50" />
        <circle className="lens" cx="148" cy="110" r="8" />
        <circle className="lens" cx="50" cy="92" r="3" style={{ animationDelay: "1.8s" }} />
      </svg>
    </div>
  );
}

function NeuralNet({ active }) {
  const layers = [3, 5, 5, 4];
  const w = 400, h = 320;
  const xs = layers.map((_, i) => 60 + i * ((w - 120) / (layers.length - 1)));
  const ys = layers.map((n) => Array.from({ length: n }, (_, i) => h / 2 + (i - (n - 1) / 2) * 50));
  return (
    <div className={"how-nn" + (active ? " in" : "")}>
      <svg viewBox={`0 0 ${w} ${h}`}>
        {layers.map((n, i) => i < layers.length - 1 && ys[i].map((y1, a) =>
          ys[i + 1].map((y2, b) => (
            <line key={`${i}-${a}-${b}`} x1={xs[i]} y1={y1} x2={xs[i + 1]} y2={y2} />
          ))
        ))}
        {ys.map((col, i) =>
          col.map((y, j) => (
            <circle key={`${i}-${j}`} cx={xs[i]} cy={y} r="6"
              style={{ animationDelay: `${(i * 0.3 + j * 0.15)}s` }} />
          ))
        )}
      </svg>
    </div>
  );
}

function AlertStack({ active }) {
  return (
    <div className={"how-alert" + (active ? " in" : "")}>
      <div className="how-alert-card">
        <div className="how-alert-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div>
          <div className="how-alert-meta">22:14:08 · CAM-04 · LOBBY-N</div>
          <div className="how-alert-title">Physical altercation detected</div>
          <div className="how-alert-body">Two individuals engaged in escalating contact. Confidence 0.94. Report generated.</div>
        </div>
      </div>
      <div className="how-alert-card">
        <div className="how-alert-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div>
          <div className="how-alert-meta">22:14:09 · DISPATCH</div>
          <div className="how-alert-title">Security paged · 3 responders</div>
          <div className="how-alert-body">Notified via SMS, Slack and PagerDuty. ETA 90s.</div>
        </div>
      </div>
      <div className="how-alert-card">
        <div className="how-alert-icon" style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <div className="how-alert-meta">22:14:10 · GROQ AI</div>
          <div className="how-alert-title">Incident report ready</div>
          <div className="how-alert-body">Full timeline, frame thumbnails, severity score. PDF & JSON exported.</div>
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const acc = useCountUp(82.54, inView, { decimals: 2 });
  const resp = useCountUp(1.7, inView, { decimals: 1 });
  const cats = useCountUp(13, inView);
  const monitor = useCountUp(24, inView);
  return (
    <section className="stats" ref={ref}>
      <div className="container" style={{ marginBottom: "64px" }}>
        <div className="section-eyebrow">PERFORMANCE · LIVE</div>
        <h2 className="section-title">Numbers from production.</h2>
      </div>
      <div className="stats-grid">
        <div className="stat"><div className="stat-num">{acc}<span className="unit">%</span></div><div className="stat-label">Detection accuracy</div></div>
        <div className="stat"><div className="stat-num">&lt;{resp}<span className="unit">s</span></div><div className="stat-label">Response time</div></div>
        <div className="stat"><div className="stat-num">{cats}</div><div className="stat-label">Crime categories</div></div>
        <div className="stat"><div className="stat-num">{monitor}<span className="unit">/7</span></div><div className="stat-label">Active monitoring</div></div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { num: "01", title: "Multi-camera dashboard", body: "Unified view across every feed. Filter, search, hot-swap layouts.", icon: "grid" },
    { num: "02", title: "AI crime classification", body: "13 categories from assault to vandalism. Per-class confidence, frame-accurate timestamps.", icon: "brain" },
    { num: "03", title: "Live video feed", body: "Sub-second latency. WebSocket for browsers. Zoom, pan, recall.", icon: "video" },
    { num: "04", title: "Groq AI reports", body: "Generated in milliseconds. Factual, professional. Always grounded in detected frames.", icon: "doc" },
    { num: "05", title: "Alert history & logs", body: "Every event, indexed and searchable. Audit trail by camera, severity, classification.", icon: "list" },
    { num: "06", title: "Downloadable incidents", body: "TXT report with full timeline. Hand off to law enforcement or internal review.", icon: "down" }
  ];
  return (
    <section className="features">
      <div className="features-head">
        <div>
          <div className="section-eyebrow">CAPABILITIES</div>
          <h2 className="section-title">Everything an operator needs.<br />Nothing they don't.</h2>
        </div>
        <p className="section-sub">
          Designed with security teams. Every feature earns its place by surviving a 3am incident.
        </p>
      </div>
      <div className="features-grid">
        {features.map((f, i) => (
          <Reveal key={i} delay={i * 60}>
            <div className="feature">
              <div className="feature-num">[ F.{f.num} ]</div>
              <div className="feature-icon"><FeatIcon name={f.icon} /></div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-body">{f.body}</div>
              <div className="feature-arrow">LEARN MORE →</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeatIcon({ name }) {
  const props = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "grid") return <svg {...props}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
  if (name === "brain") return <svg {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 1 1-5 0v-1A2.5 2.5 0 0 1 4.5 16M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 5 0v-1a2.5 2.5 0 0 0 2.5-2.5"/></svg>;
  if (name === "video") return <svg {...props}><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>;
  if (name === "doc") return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>;
  if (name === "list") return <svg {...props}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>;
  if (name === "down") return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
  return null;
}

function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="final-cta-inner">
        <Reveal>
          <h2>Start protecting<br />your space.</h2>
          <Link to="/dashboard" className="btn btn-primary btn-lg">Launch dashboard →</Link>
          <div className="final-cta-sub">Free to use · No hardware required · Connect in 30 seconds</div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="nav-logo" style={{ marginBottom: "20px" }}>
            <span className="nav-logo-mark"></span>
            SECURE VISION
          </div>
          <p style={{ maxWidth: "280px", lineHeight: 1.5 }}>
            Real-time threat intelligence for every camera in your stack.
          </p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/setup">Camera setup</Link>
          <Link to="/monitor">Live monitor</Link>
          <a href="#/">API reference</a>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#/">About</a>
          <a href="#/">Customers</a>
          <a href="#/">Security</a>
          <a href="#/">Press</a>
        </div>
        <div className="footer-col">
          <h4>Resources</h4>
          <a href="#/">Documentation</a>
          <a href="#/">Status</a>
          <a href="#/">Changelog</a>
          <a href="#/">Contact</a>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2026 SECURE VISION SYSTEMS · ALL RIGHTS RESERVED</div>
        <div>✓ ALL SYSTEMS OPERATIONAL · v2.4.1</div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <>
      <Navbar active="home" />
      <HeroSection />
      <ProblemSection />
      <HowItWorks />
      <StatsSection />
      <FeaturesSection />
      <FinalCTA />
      <Footer />
    </>
  );
}
