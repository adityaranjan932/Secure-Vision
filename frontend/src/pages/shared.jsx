import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export function Navbar({ active }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "")}>
      <Link to="/landing" className="nav-logo">
        <span className="nav-logo-mark"></span>
        SECURE VISION
      </Link>
      <div className="nav-links">
        <Link to="/landing" className={active === "home" ? "active" : ""}>Product</Link>
        <Link to="/dashboard" className={active === "dash" ? "active" : ""}>Dashboard</Link>
        <Link to="/setup" className={active === "setup" ? "active" : ""}>Cameras</Link>
        <Link to="/monitor" className={active === "live" ? "active" : ""}>Live Monitor</Link>
        <a href="#docs">Docs</a>
      </div>
      <Link to="/dashboard" className="nav-cta">Launch console →</Link>
    </nav>
  );
}

export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={"reveal " + (visible ? "in " : "") + className}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function useCountUp(target, isInView, opts = {}) {
  const { duration = 1600, decimals = 0 } = opts;
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, duration]);
  return decimals ? val.toFixed(decimals) : Math.round(val).toString();
}

export function FauxFeed({ alert, boxes = [], showHud = true, name = "CAM-01" }) {
  const time = useTimeNow();
  return (
    <div className="faux-feed-wrap" style={{ position: "absolute", inset: 0 }}>
      <div className="faux-feed"></div>
      <div className="cctv-figure f1" style={{ position: "absolute" }}></div>
      <div className="cctv-figure f2" style={{ position: "absolute" }}></div>
      {boxes.map((b, i) => (
        <div
          key={i}
          className={"det-box" + (b.alert ? " alert" : "")}
          style={{ left: b.x + "%", top: b.y + "%", width: b.w + "%", height: b.h + "%" }}
        >
          <span className="det-box-label">{b.label || "PERSON " + (i + 1)}</span>
        </div>
      ))}
      {showHud && (
        <>
          <div className="cctv-corner tl"></div>
          <div className="cctv-corner tr"></div>
          <div className="cctv-corner bl"></div>
          <div className="cctv-corner br"></div>
          <div className="cctv-hud">
            <div className="cctv-hud-row">
              <div className="cctv-hud-tag"><span className="rec"></span>REC · {name}</div>
              <div>{time}</div>
            </div>
            <div className="cctv-hud-row">
              <div>1080p · 30fps</div>
              <div style={{ color: alert ? "var(--red)" : "var(--green)" }}>
                {alert ? "⚠ THREAT DETECTED" : "✓ NOMINAL"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function useTimeNow() {
  const [t, setT] = useState(() => formatNow());
  useEffect(() => {
    const i = setInterval(() => setT(formatNow()), 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

export function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
