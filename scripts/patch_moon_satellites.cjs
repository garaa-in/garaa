const fs = require('fs');
let html = fs.readFileSync('frontend/index.html', 'utf8');

const startMarker = 'function Moon3D() {';
const endMarker = 'function Landing({ onStart, onGo }) {';

const sIdx = html.indexOf(startMarker);
const eIdx = html.indexOf(endMarker);

if (sIdx === -1 || eIdx === -1) {
  throw new Error('Markers not found: ' + sIdx + ', ' + eIdx);
}

const replacement = `function Moon3D() {
  const canvasRef = useRef(null);
  const satCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanup = initMoonRenderer(canvas);
    return cleanup;
  }, []);

  // Orbiting Forensic Satellites Telemetry Loop
  useEffect(() => {
    const satCanvas = satCanvasRef.current;
    if (!satCanvas) return;
    const ctx = satCanvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let disposed = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = satCanvas.getBoundingClientRect();
      satCanvas.width = Math.max(100, Math.round((r.width || 280) * dpr));
      satCanvas.height = Math.max(100, Math.round((r.height || 280) * dpr));
    };
    resize();
    window.addEventListener('resize', resize);

    const satellites = [
      { rOrb: 0.62, inc: 0.48, speed: 0.0009, phase: 0.2, color: '#38bdf8', size: 3.2, label: 'SAT-GARAA-1' },
      { rOrb: 0.72, inc: -0.62, speed: 0.00065, phase: 2.4, color: '#818cf8', size: 2.8, label: 'GEO-ORB-2' },
      { rOrb: 0.82, inc: 0.22, speed: 0.00045, phase: 4.5, color: '#a78bfa', size: 2.6, label: 'RAD-TELEMETRY' }
    ];

    const renderSat = (now) => {
      if (disposed) return;
      ctx.clearRect(0, 0, satCanvas.width, satCanvas.height);
      const w = satCanvas.width;
      const h = satCanvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R_base = Math.min(w, h) * 0.44;

      satellites.forEach((sat, idx) => {
        const ang = now * sat.speed + sat.phase;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        const cosI = Math.cos(sat.inc);
        const sinI = Math.sin(sat.inc);

        const x = cosA * sat.rOrb * R_base;
        const y = sinA * cosI * sat.rOrb * R_base;
        const z = -sinA * sinI * sat.rOrb * R_base;

        const isFront = z > -0.05;

        // Draw orbital dashed track
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sat.inc * 0.5);
        ctx.strokeStyle = idx === 0 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(139, 92, 246, 0.13)';
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([4 * dpr, 9 * dpr]);
        ctx.beginPath();
        ctx.ellipse(0, 0, sat.rOrb * R_base, sat.rOrb * R_base * cosI, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (isFront) {
          const sx = cx + x;
          const sy = cy + y;

          // Glowing aura
          const auraGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12 * dpr);
          auraGrad.addColorStop(0, sat.color);
          auraGrad.addColorStop(0.35, sat.color + '66');
          auraGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, 12 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Core beacon
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(sx, sy, sat.size * dpr * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Ping ripple
          const pingScale = ((now * 0.003 + idx * 0.4) % 1);
          ctx.strokeStyle = sat.color + 'aa';
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.arc(sx, sy, (sat.size + pingScale * 14) * dpr, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(renderSat);
    };

    animId = requestAnimationFrame(renderSat);

    return () => {
      disposed = true;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return h("div", { className: "zx-moon-box", "aria-hidden": "true", title: "Actual 3D Moon • Orbiting Telemetry Satellites • Drag to rotate" },
    h("canvas", { ref: canvasRef, className: "zx-moon-canvas" }),
    h("canvas", { ref: satCanvasRef, className: "zx-moon-sat-canvas" })
  );
}

`;

html = html.slice(0, sIdx) + replacement + html.slice(eIdx);
fs.writeFileSync('frontend/index.html', html, 'utf8');
console.log('Successfully patched Moon3D with orbiting forensic satellites!');
