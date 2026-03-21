import { useState, useEffect, useRef } from "react";

const BRAIN_STATES = {
  focused: { label: "Flow State Active", color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", icon: "🧠", desc: "Deep concentration detected" },
  unfocused: { label: "Attention Drift", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "⚡", desc: "Attention drifting — refocus" },
  fatigued: { label: "Neural Fatigue", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "💤", desc: "Cognitive load peaking" },
};

const DIFFICULTY = { easy: "Easy", medium: "Medium", hard: "Hard" };

const QUESTIONS = {
  easy: [
    { q: "If f(x) = 2x + 3, what is f(5)?", options: ["10", "13", "15", "8"], correct: 1, hint: "Substitute x = 5 into the equation." },
    { q: "What is the slope of the line y = 4x − 7?", options: ["4", "-7", "7", "-4"], correct: 0, hint: "In y = mx + b, the slope is m." },
    { q: "Simplify: 3x + 2x − x", options: ["4x", "5x", "6x", "3x"], correct: 0, hint: "Combine like terms by adding the coefficients." },
    { q: "What is 25% of 80?", options: ["15", "20", "25", "40"], correct: 1, hint: "Multiply 80 by 0.25." },
  ],
  medium: [
    { q: "If f(x) = (x² − 4)/(x − 2), what is lim x→2 f(x)?", options: ["0", "4", "2", "Undefined"], correct: 1, hint: "Factor the numerator: x² − 4 = (x+2)(x−2)." },
    { q: "Find the derivative of f(x) = 3x² − 2x + 1", options: ["6x − 2", "3x − 2", "6x + 1", "6x² − 2"], correct: 0, hint: "Apply the power rule: d/dx(xⁿ) = nxⁿ⁻¹." },
    { q: "What is the area under y = 2x from x = 0 to x = 3?", options: ["6", "9", "12", "3"], correct: 1, hint: "Integrate 2x: ∫2x dx = x². Evaluate from 0 to 3." },
    { q: "Solve: log₂(x) = 5", options: ["10", "25", "32", "64"], correct: 2, hint: "If log₂(x) = 5, then x = 2⁵." },
  ],
  hard: [
    { q: "Evaluate: ∫₀^π sin(x) dx", options: ["0", "1", "2", "π"], correct: 2, hint: "The antiderivative of sin(x) is −cos(x)." },
    // Fixed: corrupted options array reconstructed
    { q: "Find the second derivative of f(x) = e²ˣ", options: ["2e²ˣ", "4e²ˣ", "e²ˣ", "2xe²ˣ"], correct: 1, hint: "First derivative: 2e²ˣ. Apply chain rule again." },
    { q: "What is the sum of the series Σ(1/2ⁿ) from n=0 to ∞?", options: ["1", "2", "∞", "1/2"], correct: 1, hint: "Geometric series with a=1 and r=1/2. Sum = a/(1−r)." },
    { q: "If det(A) = 3 and det(B) = −2, what is det(AB)?", options: ["-6", "1", "5", "-1"], correct: 0, hint: "det(AB) = det(A) × det(B)." },
  ],
};

/* ─── Responsive breakpoint hook ─── */
function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

/* ─── 5-Band EEG Brainwave Visualization ─── */
const EEG_BANDS = [
  { name: "Delta", freq: 0.4, amp: 1.0, color: "#8B6347", width: 2.2, opacity: 0.35 },
  { name: "Theta", freq: 0.9, amp: 0.75, color: "#D97706", width: 2.0, opacity: 0.55 },
  { name: "Alpha", freq: 1.6, amp: 0.6, color: "#EA580C", width: 2.2, opacity: 0.85 },
  { name: "Beta",  freq: 2.8, amp: 0.45, color: "#F59E0B", width: 2.0, opacity: 0.75 },
  { name: "Gamma", freq: 4.5, amp: 0.3, color: "#C2410C", width: 1.6, opacity: 0.6 },
];

function BrainwaveEEG({ state }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const stateMultipliers = {
    focused:   { Delta: 0.3, Theta: 0.4, Alpha: 1.0, Beta: 0.9, Gamma: 0.7 },
    unfocused: { Delta: 0.6, Theta: 0.9, Alpha: 0.5, Beta: 0.4, Gamma: 0.3 },
    fatigued:  { Delta: 1.0, Theta: 0.8, Alpha: 0.3, Beta: 0.2, Gamma: 0.15 },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.parentElement ? canvas.parentElement.offsetWidth || 300 : 300;
    const H = 120;
    canvas.width = W * 2; canvas.height = H * 2;
    ctx.scale(2, 2);

    let running = true;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      const t = Date.now() / 1000;
      const mults = stateMultipliers[state] || stateMultipliers.focused;

      EEG_BANDS.forEach((band) => {
        const mult = mults[band.name] || 0.5;
        ctx.beginPath();
        ctx.strokeStyle = band.color;
        ctx.lineWidth = band.width;
        ctx.globalAlpha = band.opacity * (0.7 + mult * 0.3);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        for (let x = 0; x <= W; x++) {
          const xNorm = x / W;
          const envelope = Math.sin(xNorm * Math.PI) * 0.85 + 0.15;
          const phase = t * band.freq * 2.5 + xNorm * Math.PI * 2 * (band.freq * 2.2);
          const noise = Math.sin(phase * 3.7 + t * 0.3) * 0.08;
          const y = H / 2 + Math.sin(phase) * band.amp * mult * 32 * envelope
            + Math.sin(phase * 0.5 + 1.2) * band.amp * mult * 8 * envelope
            + noise * 12;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [state]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: 120, display: "block" }} />;
}

/* ─── Session Timer ─── */
// Fixed: was "function SessionTds })" — broken component signature
function SessionTimer({ seconds }) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#7A6050", display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", animation: "blinker 1.5s infinite" }} />
      {m}:{s}
    </div>
  );
}

/* ─── Main App ─── */
export default function FocusIQ() {
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth < 1024;

  const [brainState, setBrainState] = useState("focused");
  const [focusScore, setFocusScore] = useState(85);
  const [difficulty, setDifficulty] = useState("medium");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  // Fixed: was "ueDuration, setFatigueDuration]" — missing "const [fatigu" prefix
  const [fatigueDuration, setFatigueDuration] = useState(0);
  const [breakSnoozed, setBreakSnoozed] = useState(false);
  const [alertPlaying, setAlertPlaying] = useState(false);
  const [stateHistory, setStateHistory] = useState([]);
  const [breakActive, setBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(300);
  const breakTimerRef = useRef(null);

  useEffect(() => { const iv = setInterval(() => setSessionTime((t) => t + 1), 1000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    const cycle = () => {
      const states = ["focused", "focused", "focused", "unfocused", "fatigued"];
      const next = states[Math.floor(Math.random() * states.length)];
      setBrainState(next);
      setStateHistory(prev => [...prev.slice(-29), { state: next, time: Date.now() }]);
      if (next === "focused") { setFocusScore((s) => Math.min(98, s + Math.floor(Math.random() * 8 + 2))); setFatigueDuration(0); setBreakSnoozed(false); }
      else if (next === "unfocused") { setFocusScore((s) => Math.max(30, s - Math.floor(Math.random() * 10 + 3))); setFatigueDuration(0); }
      else { setFocusScore((s) => Math.max(15, s - Math.floor(Math.random() * 12 + 5))); }
    };
    const iv = setInterval(cycle, 6000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (brainState === "focused") setDifficulty((d) => d === "easy" ? "medium" : "hard");
    else if (brainState === "fatigued") setDifficulty("easy");
    else setDifficulty("medium");
  }, [brainState]);

  useEffect(() => {
    if (brainState === "fatigued") { const t = setTimeout(() => setShowHint(true), 1500); return () => clearTimeout(t); }
    else setShowHint(false);
  }, [brainState, qIndex]);

  useEffect(() => {
    if (brainState === "fatigued") { breakTimerRef.current = setInterval(() => setFatigueDuration((d) => d + 1), 1000); }
    else { setFatigueDuration(0); if (breakTimerRef.current) clearInterval(breakTimerRef.current); }
    return () => { if (breakTimerRef.current) clearInterval(breakTimerRef.current); };
  }, [brainState]);

  useEffect(() => { if (fatigueDuration >= 8 && !breakSnoozed && !showBreakModal && !breakActive) setShowBreakModal(true); }, [fatigueDuration, breakSnoozed, showBreakModal, breakActive]);

  useEffect(() => {
    if (!breakActive) return;
    if (breakTimeLeft <= 0) {
      setBreakActive(false);
      setBreakTimeLeft(300);
      setBrainState("focused");
      setFocusScore((s) => Math.min(98, s + 20));
      setFatigueDuration(0);
      setBreakSnoozed(false);
      return;
    }
    const t = setTimeout(() => setBreakTimeLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [breakActive, breakTimeLeft]);

  useEffect(() => {
    if (brainState === "unfocused") {
      setAlertPlaying(true);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.4);
        setTimeout(() => {
          const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
          o2.type = "sine"; o2.frequency.value = 1100;
          g2.gain.setValueAtTime(0.12, ctx.currentTime);
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o2.connect(g2).connect(ctx.destination); o2.start(); o2.stop(ctx.currentTime + 0.3);
        }, 200);
      } catch (e) {}
      const t = setTimeout(() => setAlertPlaying(false), 1500); return () => clearTimeout(t);
    }
  }, [brainState]);

  const currentQ = QUESTIONS[difficulty][qIndex % QUESTIONS[difficulty].length];
  const handleAnswer = (i) => setSelected(i);
  const confirmAnswer = () => {
    if (selected === null) return;
    setAnswered((a) => a + 1);
    if (selected === currentQ.correct) setCorrect((c) => c + 1);
    setTimeout(() => { setSelected(null); setShowHint(false); setQIndex((q) => q + 1); }, 800);
  };

  const st = BRAIN_STATES[brainState];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6F0", fontFamily: "'Nunito', 'Segoe UI', sans-serif", color: "#3D2B1F", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes blinker { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeScale { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px } ::-webkit-scrollbar-thumb { background: #C4A882; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <header style={{ padding: isMobile ? "10px 16px" : "12px 32px", borderBottom: "1px solid #E8D5BE", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFDF8", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #C2500A, #EA6C1A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 800 }}>F</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1C120A", letterSpacing: -0.3, lineHeight: 1 }}>Focus<span style={{ color: "#C2500A" }}>IQ</span></div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: "#A08870", textTransform: "uppercase" }}>Cognitive Excellence</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <SessionTimer seconds={sessionTime} />
          <span style={{ fontSize: 18, cursor: "pointer" }}>🔔</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #C2500A, #B45309)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>S</div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", padding: isMobile ? 12 : 16, gap: isMobile ? 12 : 16, overflow: "auto" }}>
        {/* Left: Question area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#C2500A", fontWeight: 700, textTransform: "uppercase" }}>Current Session: Advanced Calculus &amp; SAT Prep</span>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#1C120A", marginBottom: 12, marginTop: 4, lineHeight: 1.2 }}>
            Mastering <em style={{ color: "#C2500A", fontStyle: "italic" }}>Cognitive</em> Flow.
          </h1>

          {/* Question Card */}
          <div style={{ background: "#FFFDF8", borderRadius: 16, padding: isMobile ? 14 : 20, border: "1px solid #E8D5BE", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)", animation: "slideIn 0.35s ease" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: "#FFF7ED", color: "#C2500A", padding: "5px 14px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", border: "1px solid #FED7AA" }}>Mathematics Section</span>
              <span style={{ fontSize: 12, color: "#A08870" }}>
                Difficulty: <span style={{ color: difficulty === "hard" ? "#EF4444" : difficulty === "medium" ? "#F59E0B" : "#22C55E", fontWeight: 700 }}>{DIFFICULTY[difficulty]}</span>
                <span style={{ marginLeft: 8, fontSize: 9, padding: "3px 8px", background: st.bg, color: st.color, borderRadius: 4, border: `1px solid ${st.border}`, fontWeight: 600 }}>AI-Adapted</span>
              </span>
            </div>

            <p style={{ fontSize: isMobile ? 15 : 18, lineHeight: 1.65, color: "#1C120A", marginBottom: 6, fontWeight: 600 }}>{currentQ.q}</p>
            <p style={{ fontSize: 13, color: "#A08870", marginBottom: 14, fontWeight: 500 }}>
              {brainState === "focused" ? "You're in the zone. Challenge yourself." : brainState === "unfocused" ? "⚡ Attention drift detected — focus on this." : "Take it slow. A hint is available below."}
            </p>

            {showHint && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 18, animation: "fadeScale 0.3s ease", fontSize: 13, color: "#92400E", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                {/* Fixed: was "<div              <div style=" — missing closing > on outer div */}
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 3, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#B45309" }}>Hint — Fatigue Detected</div>
                  {currentQ.hint}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentQ.options.map((opt, i) => {
                const isSel = selected === i;
                const isCorr = selected !== null && i === currentQ.correct;
                const isWrong = selected === i && i !== currentQ.correct;
                return (
                  <button key={i} onClick={() => handleAnswer(i)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "9px 12px" : "10px 14px", borderRadius: 10, cursor: "pointer",
                    background: isCorr && selected !== null ? "#F0FDF4" : isWrong ? "#FEF2F2" : isSel ? "#FFF7ED" : "#FBF6EF",
                    // Fixed: was "1.5px solid #86EC" — incomplete hex, restored to green-300
                    border: isCorr && selected !== null ? "1.5px solid #86EFAC" : isWrong ? "1.5px solid #FECACA" : isSel ? "1.5px solid #FDBA74" : "1.5px solid #E8D5BE",
                    color: "#3D2B1F", fontSize: 14, fontFamily: "inherit", fontWeight: 500, transition: "all 0.2s", textAlign: "left",
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isSel ? "#C2500A" : "#D4B896"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: isSel ? "#C2500A" : "transparent" }}>
                      {isSel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <span>Option {String.fromCharCode(65 + i)}: {opt}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <button style={{ background: "none", border: "none", color: "#A08870", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Save for Review</button>
              <button onClick={confirmAnswer} disabled={selected === null} style={{
                padding: "11px 28px", borderRadius: 10, border: "none",
                background: selected !== null ? "linear-gradient(135deg, #C2500A, #9A3D07)" : "#E8D5BE",
                color: selected !== null ? "#fff" : "#A08870", fontSize: 14, fontWeight: 700,
                cursor: selected !== null ? "pointer" : "default", fontFamily: "inherit",
                boxShadow: selected !== null ? "0 4px 12px rgba(194,80,10,0.25)" : "none", transition: "all 0.25s",
              }}>Confirm Answer</button>
            </div>
          </div>

          {alertPlaying && (
            <div style={{ marginTop: 14, padding: "12px 18px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A", animation: "shake 0.3s ease 2", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <div>
                <div style={{ fontWeight: 700, color: "#B45309", fontSize: 13 }}>Attention Alert!</div>
                <div style={{ fontSize: 12, color: "#92400E" }}>Brain signals indicate drifting focus. Lock back in!</div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Panel ─── */}
        <div style={{ width: isMobile ? "100%" : isTablet ? 260 : 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* EEG Brain State Card */}
          <div style={{
            background: "#F5EDD8", borderRadius: 18, padding: 18,
            position: "relative", overflow: "hidden",
            boxShadow: "0 4px 24px rgba(30,14,4,0.1)", border: "1px solid #E8D5BE",
          }}>
            {/* Fixed: was "pointerEvent>" — incomplete style prop and missing closing */}
            <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${st.color}10, transparent)`, pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, position: "relative" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1C120A", lineHeight: 1.15, marginBottom: 2 }}>Mental<br/>Strength</h3>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#7A6050", textTransform: "uppercase", fontWeight: 600 }}>EEG Sensor Active</div>
              </div>
              <span style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: `${st.color}20`, color: st.color,
                border: `1px solid ${st.color}40`, lineHeight: 1.3,
                textAlign: "center",
              }}>
                {st.label}
              </span>
            </div>

            {/* 5-Band EEG Canvas Waveform */}
            <div style={{ margin: "10px -8px 10px", position: "relative" }}>
              <BrainwaveEEG state={brainState} />
            </div>

            {/* Focus Score */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative" }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#1C120A", lineHeight: 1, fontFamily: "'Nunito', sans-serif", opacity: 0.35 }}>{focusScore}%</div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#7A6050", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>Focus Score</div>
              </div>
              <svg width="36" height="28" viewBox="0 0 36 28" fill="none" style={{ opacity: 0.7 }}>
                {[0,5,10,15,20].map((y) => (
                  <path key={y} d={`M2 ${6+y*0.4} Q9 ${2+y*0.4} 18 ${6+y*0.4} T34 ${6+y*0.4}`} stroke={st.color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                ))}
              </svg>
            </div>

            {/* Band legend */}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {EEG_BANDS.map((b) => (
                <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: b.color }} />
                  <span style={{ fontSize: 9, color: "#A08870", fontWeight: 500 }}>{b.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* State indicator */}
          <div style={{ background: "#FFFDF8", borderRadius: 12, padding: 12, border: `1px solid ${st.border}`, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `1px solid ${st.border}` }}>{st.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{st.label}</div>
              <div style={{ fontSize: 11.5, color: "#A08870", marginTop: 1, fontWeight: 500 }}>{st.desc}</div>
            </div>
          </div>

          {/* Break recommendation */}
          {brainState === "fatigued" && (
            <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 12, border: "1px solid #FECACA", animation: "fadeScale 0.3s ease", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "1px solid #FECACA", flexShrink: 0 }}>⚠️</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>Break Recommended</div>
                <div style={{ fontSize: 11, color: "#7F1D1D", marginTop: 2, lineHeight: 1.5 }}>Cognitive load peaking. Rest window in <strong>15m</strong>.</div>
                {/* Fixed: was "setBreoozed" — typo, should be setBreakSnoozed */}
                <button onClick={() => setBreakSnoozed(true)} style={{ marginTop: 6, background: "none", border: "none", color: "#C2500A", fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase" }}>Snooze Alert</button>
              </div>
            </div>
          )}

          {/* Progress */}
          <div style={{ background: "#FFFDF8", borderRadius: 12, padding: 12, border: "1px solid #E8D5BE", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: 1.5, color: "#A08870", textTransform: "uppercase", fontWeight: 700 }}>Daily Goal Progress</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1C120A", fontFamily: "'DM Mono', monospace" }}>{Math.min(100, Math.round((answered / 25) * 100))}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#EDE0D0", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(100, (answered / 25) * 100)}%`, background: "linear-gradient(90deg, #F59E0B, #C2500A)", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 11.5, color: "#A08870", fontWeight: 500 }}>Completed <strong style={{ color: "#3D2B1F" }}>{answered}</strong> of 25 problems today.</div>
            {answered > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #EDE0D0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#A08870", fontWeight: 500 }}>Accuracy</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: (correct / answered) >= 0.7 ? "#22C55E" : (correct / answered) >= 0.4 ? "#F59E0B" : "#EF4444", fontFamily: "'DM Mono', monospace" }}>{Math.round((correct / answered) * 100)}%</span>
              </div>
            )}
          </div>

          {/* State history */}
          <div style={{ background: "#FFFDF8", borderRadius: 12, padding: 12, border: "1px solid #E8D5BE", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#A08870", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>Recent Brain States</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {stateHistory.slice(-30).map((h, i) => (
                <div key={i} title={BRAIN_STATES[h.state].label} style={{ width: 15, height: 15, borderRadius: 3, background: BRAIN_STATES[h.state].bg, border: `1px solid ${BRAIN_STATES[h.state].border}` }} />
              ))}
              {stateHistory.length === 0 && <span style={{ fontSize: 11, color: "#D4B896" }}>Collecting data...</span>}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
              {Object.entries(BRAIN_STATES).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
                  <span style={{ fontSize: 10, color: "#A08870", fontWeight: 500 }}>{v.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Break Overlay */}
      {breakActive && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "#FAF6F0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, animation: "fadeScale 0.4s ease" }}>
          <div style={{ fontSize: 48 }}>🌿</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: "#1C120A", marginBottom: 6 }}>Time to Rest</div>
            <div style={{ fontSize: 14, color: "#7A6050", fontWeight: 500 }}>Step away, breathe, and let your mind reset.</div>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 64, fontWeight: 800, color: "#C2500A", lineHeight: 1 }}>
            {String(Math.floor(breakTimeLeft / 60)).padStart(2, "0")}:{String(breakTimeLeft % 60).padStart(2, "0")}
          </div>
          <div style={{ width: 240, height: 6, borderRadius: 3, background: "#E8D5BE", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #F59E0B, #C2500A)", width: `${((300 - breakTimeLeft) / 300) * 100}%`, transition: "width 1s linear" }} />
          </div>
          <button onClick={() => { setBreakActive(false); setBreakTimeLeft(300); setBreakSnoozed(true); }} style={{ marginTop: 8, background: "none", border: "1px solid #E8D5BE", borderRadius: 8, padding: "8px 20px", color: "#A08870", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Skip Break</button>
        </div>
      )}

      {/* Break Modal */}
      {showBreakModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(30,14,4,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeScale 0.3s ease" }}>
          <div style={{ background: "#FFFDF8", borderRadius: 20, padding: 36, border: "1px solid #E8D5BE", maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 18px", background: "#FEF2F2", border: "2px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧠</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1C120A", marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>Your Brain Needs a Break</h2>
            <p style={{ fontSize: 13, color: "#7A6050", lineHeight: 1.6, marginBottom: 4, fontWeight: 500 }}>Our EEG analysis detected sustained neural fatigue. Continuing reduces retention and accuracy.</p>
            <div style={{ display: "inline-block", margin: "14px 0", padding: "8px 20px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#DC2626", fontFamily: "'DM Mono', monospace" }}>5:00</span>
              <span style={{ fontSize: 11, color: "#A08870", marginLeft: 8 }}>recommended</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              {/* Fixed: was "11p0" — typo in padding value */}
              <button onClick={() => { setShowBreakModal(false); setBreakSnoozed(true); }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "#FBF6EF", border: "1px solid #E8D5BE", color: "#7A6050", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Skip for Now</button>
              <button onClick={() => { setShowBreakModal(false); setBreakActive(true); setBreakTimeLeft(300); }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg, #22C55E, #16A34A)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(34,197,94,0.25)" }}>Take a Break</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
