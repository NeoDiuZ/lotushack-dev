import { useState, useEffect, useRef } from "react";

const BRAIN_STATES = {
  focused:  { label: "Very Focused", color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", icon: "🧠", desc: "25–60% · Deep concentration" },
  unfocused:{ label: "Mid Focus",    color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "⚡", desc: "13–24% · Moderate attention" },
  fatigued: { label: "Not Focused",  color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "💤", desc: "0–12% · Low cognitive engagement" },
};

const DIFFICULTY = { easy: "Easy", medium: "Medium", hard: "Hard" };

const QUESTIONS = {
  easy: [
    { q: "A store sells a jacket for $120 after applying a 20% discount. What was the original price?", options: ["$140", "$144", "$150", "$160"], correct: 2, hint: "If the discounted price is 80% of the original, divide $120 by 0.8." },
    { q: "The equation 3x − 7 = 14 is solved for x. What is the value of x?", options: ["3", "5", "7", "9"], correct: 2, hint: "Add 7 to both sides, then divide by 3." },
    { q: "Line l passes through (0, 4) and (2, 8). Which equation represents line l?", options: ["y = 2x + 4", "y = 4x + 2", "y = 2x − 4", "y = x + 4"], correct: 0, hint: "Slope = (8−4)/(2−0) = 2. Use y = mx + b with point (0, 4)." },
    { q: "A car travels 150 miles in 2.5 hours. At the same speed, how far does it travel in 4 hours?", options: ["200 miles", "220 miles", "240 miles", "260 miles"], correct: 2, hint: "Find the unit rate (miles per hour), then multiply by 4." },
    { q: "If 5(x + 2) = 35, what is the value of x + 2?", options: ["5", "6", "7", "8"], correct: 2, hint: "Divide both sides by 5 directly." },
    { q: "The sum of three consecutive integers is 48. What is the largest integer?", options: ["14", "15", "16", "17"], correct: 3, hint: "Let the integers be n, n+1, n+2. Set their sum equal to 48." },
    { q: "A rectangle has a perimeter of 54 cm. If its length is 17 cm, what is its width?", options: ["8 cm", "10 cm", "12 cm", "20 cm"], correct: 1, hint: "Perimeter = 2(length + width). Solve for width." },
    { q: "If y = 3x − 5 and x = 4, what is y?", options: ["5", "7", "8", "17"], correct: 1, hint: "Substitute x = 4 into the equation." },
  ],
  medium: [
    { q: "The function f(x) = x² − 6x + 8 equals zero at x = 2. What is the other solution?", options: ["x = 3", "x = 4", "x = 5", "x = 6"], correct: 1, hint: "Factor: (x − 2)(x − 4) = 0." },
    { q: "A school's enrollment increased from 800 to 1,000 students over 4 years. What was the percent increase?", options: ["20%", "22.5%", "25%", "30%"], correct: 2, hint: "Percent increase = (change / original) × 100." },
    { q: "In the xy-plane, which of the following is an equation of a circle centered at (3, −2) with radius 5?", options: ["(x−3)² + (y+2)² = 5", "(x+3)² + (y−2)² = 25", "(x−3)² + (y+2)² = 25", "(x−3)² + (y−2)² = 25"], correct: 2, hint: "Circle formula: (x − h)² + (y − k)² = r²." },
    { q: "If 2x + y = 10 and x − y = 2, what is the value of x?", options: ["2", "3", "4", "5"], correct: 2, hint: "Add the two equations to eliminate y." },
    { q: "A line has slope −3/4 and passes through (8, 1). What is the y-intercept?", options: ["5", "6", "7", "8"], correct: 2, hint: "Use y − y₁ = m(x − x₁), then set x = 0." },
    { q: "The table shows f(1)=2, f(2)=5, f(3)=10, f(4)=17. Which formula fits f(x)?", options: ["f(x) = 3x − 1", "f(x) = x² + 1", "f(x) = 2x + 1", "f(x) = x² − 1"], correct: 1, hint: "Try f(x) = x² + 1: f(1)=2, f(2)=5, f(3)=10 ✓" },
    { q: "Tickets to a concert cost $12 for students and $20 for adults. If 300 tickets were sold for $4,400, how many student tickets were sold?", options: ["100", "150", "175", "200"], correct: 2, hint: "Set up a system: s + a = 300 and 12s + 20a = 4400." },
    { q: "If x² − 9 = 0, what are all values of x?", options: ["x = 3 only", "x = −3 only", "x = ±3", "x = ±9"], correct: 2, hint: "Factor as (x+3)(x−3) = 0, or take the square root of both sides." },
  ],
  hard: [
    { q: "The polynomial p(x) = x³ − 5x² + 2x + 8 has a factor (x − 4). What are the remaining factors?", options: ["(x − 1)(x + 2)", "(x + 1)(x − 2)", "(x − 2)(x + 1)", "(x + 2)(x − 1)"], correct: 0, hint: "Divide p(x) by (x − 4) using synthetic division, then factor the quotient." },
    { q: "In the xy-plane, the parabola y = (x − 3)² − 4 intersects the x-axis at two points. What is the distance between those points?", options: ["2", "4", "6", "8"], correct: 1, hint: "Set y = 0 and solve. The roots are x = 3 ± 2." },
    { q: "If sin θ = 3/5 and θ is in the first quadrant, what is tan θ?", options: ["3/4", "4/5", "3/5", "4/3"], correct: 0, hint: "Use the Pythagorean identity to find cos θ = 4/5, then tan θ = sin θ / cos θ." },
    { q: "A data set has mean 50 and standard deviation 8. Approximately what percent of values fall between 34 and 66?", options: ["68%", "76%", "95%", "99.7%"], correct: 2, hint: "34 and 66 are 2 standard deviations from the mean. Apply the empirical rule." },
    { q: "If f(x) = 2x + 1 and g(x) = x² − 3, what is f(g(3))?", options: ["10", "11", "12", "13"], correct: 3, hint: "First compute g(3) = 9 − 3 = 6, then f(6) = 2(6) + 1." },
    { q: "The system y = x² − 4x + 4 and y = 2x − 4 intersects at how many points?", options: ["0", "1", "2", "3"], correct: 1, hint: "Substitute 2x − 4 into the quadratic and check the discriminant." },
    { q: "A geometric sequence starts 4, 12, 36, … What is the 6th term?", options: ["324", "972", "2916", "972"], correct: 1, hint: "Common ratio r = 3. 6th term = 4 × 3⁵." },
    { q: "Which value of k makes kx² − 8x + 4 = 0 have exactly one real solution?", options: ["k = 2", "k = 4", "k = 8", "k = 16"], correct: 1, hint: "One real solution means discriminant = 0: b² − 4ac = 64 − 16k = 0." },
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

function BrainwaveEEG({ state, bandValues }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bandValuesRef = useRef(bandValues);
  useEffect(() => { bandValuesRef.current = bandValues; }, [bandValues]);


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
      const bv = bandValuesRef.current;
      // idle: flat near-zero waves when no BLE connected
      const idleMults = { Delta: 0.04, Theta: 0.04, Alpha: 0.04, Beta: 0.04, Gamma: 0.04 };
      const mults = bv
        ? { Delta: Math.max(0.05, (bv.delta || 0) / 100), Theta: Math.max(0.05, (bv.theta || 0) / 100), Alpha: Math.max(0.05, (bv.alpha || 0) / 100), Beta: Math.max(0.05, (bv.beta || 0) / 100), Gamma: Math.max(0.05, (bv.gamma || 0) / 100) }
        : idleMults;

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
  const [focusScore, setFocusScore] = useState(0);
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
  const [stateHistory, setStateHistory] = useState([]);
  const [breakActive, setBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(300);
  const [showEasierPrompt, setShowEasierPrompt] = useState(false);
  const [easierPromptSnoozedAt, setEasierPromptSnoozedAt] = useState(null);
  const [showLockInModal, setShowLockInModal] = useState(false);
  const lockInDismissedAt = useRef(null);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleStatus, setBleStatus] = useState("disconnected"); // "disconnected" | "connecting" | "connected"
  const [bandValues, setBandValues] = useState(null);
  const breakTimerRef = useRef(null);
  const bleDeviceRef = useRef(null);
  const focusHistoryRef = useRef([]);


  useEffect(() => { const iv = setInterval(() => setSessionTime((t) => t + 1), 1000); return () => clearInterval(iv); }, []);


  // Only auto-upgrade difficulty when focused; never auto-downgrade
  useEffect(() => {
    if (brainState === "focused") setDifficulty((d) => d === "easy" ? "medium" : "hard");
  }, [brainState]);

  // Reset prompts on each new question
  useEffect(() => {
    setShowHint(false);
    setShowEasierPrompt(false);
    setEasierPromptSnoozedAt(null);
  }, [qIndex]);

  // Drive hint/stuck/rest popups from accumulated low-focus duration
  useEffect(() => {
    if (brainState === "focused") {
      // Full recovery — clear everything
      setShowHint(false);
      setShowEasierPrompt(false);
      return;
    }
    // Show popups once thresholds are crossed (Mid Focus pauses counter but keeps state)
    if (fatigueDuration >= 15 && !showHint) setShowHint(true);
    const snoozed = easierPromptSnoozedAt !== null && fatigueDuration < easierPromptSnoozedAt + 60;
    if (fatigueDuration >= 30 && !showEasierPrompt && !snoozed) setShowEasierPrompt(true);
  }, [fatigueDuration, brainState, showHint, showEasierPrompt, easierPromptSnoozedAt]);

  useEffect(() => {
    if (brainState === "fatigued") {
      breakTimerRef.current = setInterval(() => setFatigueDuration((d) => d + 1), 1000);
      let lockInTimer = null;
      if (bleConnected) {
        const now = Date.now();
        const cooldownOk = !lockInDismissedAt.current || (now - lockInDismissedAt.current >= 60000);
        if (cooldownOk) {
          setShowLockInModal(true);
          lockInTimer = setTimeout(() => { setShowLockInModal(false); lockInDismissedAt.current = Date.now(); }, 3500);
        }
      }
      return () => { clearInterval(breakTimerRef.current); if (lockInTimer) clearTimeout(lockInTimer); };
    } else if (brainState === "focused") {
      // Only reset counter on full recovery (Very Focused), not on Mid Focus bounce
      setFatigueDuration(0);
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    } else {
      // Mid Focus: stop the counter but keep the accumulated duration
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    }
    return () => { if (breakTimerRef.current) clearInterval(breakTimerRef.current); };
  }, [brainState]);

  useEffect(() => { if (fatigueDuration >= 45 && !breakSnoozed && !showBreakModal && !breakActive) setShowBreakModal(true); }, [fatigueDuration, breakSnoozed, showBreakModal, breakActive]);

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


  const handleBLENotification = (event) => {
    const raw = new TextDecoder().decode(event.target.value);
    if (!raw.startsWith("S:")) return;
    const parts = raw.substring(2).split(",");
    if (parts.length < 6) return;
    const [g, b, a, t, d] = parts.map(Number);
    const focusPct = parts.length >= 8 ? Number(parts[6]) : -1;

    setBandValues({ gamma: g, beta: b, alpha: a, theta: t, delta: d });

    if (focusPct < 0) {
      setFocusScore(0);
      return;
    }

    // Display raw value unchanged
    setFocusScore(focusPct);

    // Use a 5-reading rolling average for state to prevent single-packet noise flips
    const history = focusHistoryRef.current;
    history.push(focusPct);
    if (history.length > 5) history.shift();
    const avg = history.reduce((s, v) => s + v, 0) / history.length;

    let nextState;
    if      (avg >= 25) nextState = "focused";   // Very Focused: 25–60
    else if (avg >= 13) nextState = "unfocused"; // Mid Focus: 13–24
    else                nextState = "fatigued";  // Not Focused: 0–12
    setBrainState(nextState);
    setStateHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last.state === nextState) return prev; // dedupe identical consecutive states
      return [...prev.slice(-29), { state: nextState, time: Date.now() }];
    });
  };

  const connectBLE = async () => {
    if (bleConnected) {
      try { bleDeviceRef.current?.gatt?.disconnect(); } catch (_) {}
      setBleConnected(false);
      setBleStatus("disconnected");
      setBandValues(null);
      setFocusScore(0);
      focusHistoryRef.current = [];
      return;
    }
    setBleStatus("connecting");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["6910123a-eb0d-4c35-9a60-bebe1dcb549d"] }],
      });
      bleDeviceRef.current = device;
      device.addEventListener("gattserverdisconnected", () => {
        setBleConnected(false);
        setBleStatus("disconnected");
        setBandValues(null);
        setFocusScore(0);
        focusHistoryRef.current = [];
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("6910123a-eb0d-4c35-9a60-bebe1dcb549d");
      const char = await service.getCharacteristic("5f4f1107-7fc1-43b2-a540-0aa1a9f1ce78");
      await char.startNotifications();
      char.addEventListener("characteristicvaluechanged", handleBLENotification);
      setBleConnected(true);
      setBleStatus("connected");
    } catch (e) {
      setBleStatus("disconnected");
    }
  };

  const currentQ = QUESTIONS[difficulty][qIndex % QUESTIONS[difficulty].length];
  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    setAnswered((a) => a + 1);
    if (i === currentQ.correct) setCorrect((c) => c + 1);
    setTimeout(() => { setSelected(null); setShowHint(false); setShowEasierPrompt(false); setQIndex((q) => q + 1); }, 1200);
  };
  const switchToEasier = () => {
    setDifficulty("easy");
    setShowHint(false);
    setShowEasierPrompt(false);
    setSelected(null);
    setQIndex((q) => q + 1);
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={connectBLE} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8, border: "1px solid #E8D5BE",
            background: bleConnected ? "#FFF7ED" : "#FFFDF8",
            color: bleConnected ? "#C2500A" : "#A08870",
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: bleStatus === "connected" ? "#22C55E" : bleStatus === "connecting" ? "#F59E0B" : "#D4B896",
              animation: bleStatus === "connecting" ? "blinker 1s infinite" : "none",
            }} />
            {bleStatus === "connected" ? "EEG Live" : bleStatus === "connecting" ? "Connecting…" : "Connect EEG"}
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #C2500A, #B45309)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>S</div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: isMobile ? 12 : 16, gap: isMobile ? 12 : 16, overflow: "auto" }}>

        {/* Full-width heading */}
        <div>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#C2500A", fontWeight: 700, textTransform: "uppercase" }}>Current Session: Advanced Calculus &amp; SAT Prep</span>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#1C120A", marginBottom: 0, marginTop: 4, lineHeight: 1.2 }}>
            Mastering <em style={{ color: "#C2500A", fontStyle: "italic" }}>Cognitive</em> Flow.
          </h1>
        </div>

        {/* Two-column row — both cards start flush at the same height */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", gap: isMobile ? 12 : 16 }}>
        {/* Left: Question area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Question Card */}
          <div style={{ background: "#FFFDF8", borderRadius: 16, padding: isMobile ? 24 : 36, border: "1px solid #E8D5BE", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)", animation: "slideIn 0.35s ease" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: "#FFF7ED", color: "#C2500A", padding: "5px 14px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", border: "1px solid #FED7AA" }}>Mathematics Section</span>
              <span style={{ fontSize: 12, color: "#A08870" }}>
                Difficulty: <span style={{ color: difficulty === "hard" ? "#EF4444" : difficulty === "medium" ? "#F59E0B" : "#22C55E", fontWeight: 700 }}>{DIFFICULTY[difficulty]}</span>
                <span style={{ marginLeft: 8, fontSize: 9, padding: "3px 8px", background: st.bg, color: st.color, borderRadius: 4, border: `1px solid ${st.border}`, fontWeight: 600 }}>AI-Adapted</span>
              </span>
            </div>

            <p style={{ fontSize: isMobile ? 15 : 18, lineHeight: 1.65, color: "#1C120A", marginBottom: 18, fontWeight: 600 }}>{currentQ.q}</p>

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

          </div>

          {/* Popups — horizontal row below card, no effect on card height */}
          {(showHint || showEasierPrompt) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
              {showHint && !showEasierPrompt && (
                <div style={{ flex: "1 1 auto", minWidth: 200, padding: "10px 14px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A", animation: "fadeScale 0.3s ease", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#B45309", marginBottom: 2 }}>Hint</div>
                    <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>{currentQ.hint}</div>
                  </div>
                </div>
              )}
              {showEasierPrompt && (
                <div style={{ flex: "1 1 auto", minWidth: 220, padding: "10px 14px", borderRadius: 10, background: "#FFF7ED", border: "1px solid #FED7AA", animation: "fadeScale 0.3s ease", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>🧩</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 11, color: "#C2500A" }}>Still stuck?</div>
                      <div style={{ fontSize: 11, color: "#92400E", marginTop: 1 }}>Switch to an easier question?</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { setShowEasierPrompt(false); setEasierPromptSnoozedAt(fatigueDuration); }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #FED7AA", background: "none", color: "#A08870", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Stay</button>
                    <button onClick={switchToEasier} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #C2500A, #9A3D07)", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Switch</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right Panel ─── */}
        <div style={{ width: isMobile ? "100%" : isTablet ? 260 : 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, position: isMobile ? "static" : "sticky", top: 16, alignSelf: "flex-start" }}>
          {/* EEG Brain State Card */}
          <div style={{
            background: "#F5EDD8", borderRadius: 18, padding: 18,
            position: "relative", overflow: "hidden",
            boxShadow: "0 4px 24px rgba(30,14,4,0.1)", border: "1px solid #E8D5BE",
          }}>
            {bleConnected ? (<>
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
              <BrainwaveEEG state={brainState} bandValues={bandValues} />
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
            </>) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, position: "relative" }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1C120A", lineHeight: 1.15, marginBottom: 2 }}>Mental<br/>Strength</h3>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#D4B896", textTransform: "uppercase", fontWeight: 600 }}>No Connection</div>
                </div>
                <span style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "#EDE0D020", color: "#D4B896", border: "1px solid #E8D5BE", lineHeight: 1.3, textAlign: "center" }}>
                  Offline
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 0", position: "relative" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#D4B896", lineHeight: 1, fontFamily: "'Nunito', sans-serif" }}>--%</div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#D4B896", textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>Focus Score</div>
                <div style={{ fontSize: 11, color: "#A08870", marginTop: 12, fontWeight: 500 }}>Connect your EEG device to begin tracking</div>
              </div>
            </>
            )}
          </div>


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
        </div> {/* end two-column row */}
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

      {/* Lock In Modal — auto-dismisses after 3.5s */}
      {showLockInModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(30,14,4,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeScale 0.25s ease" }} onClick={() => { setShowLockInModal(false); lockInDismissedAt.current = Date.now(); }}>
          <div style={{ background: "#1C0A04", borderRadius: 20, padding: 36, border: "1px solid #7F1D1D", maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 18px", background: "#EF4444", border: "2px solid #FCA5A5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🔴</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Nunito', sans-serif" }}>Lock In!</h2>
            <p style={{ fontSize: 13, color: "#FCA5A5", lineHeight: 1.6, fontWeight: 500 }}>Focus score dropped below 13%. Redirect your attention to the question now.</p>
          </div>
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
