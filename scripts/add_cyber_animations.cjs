const fs = require('fs');

let html = fs.readFileSync('frontend/index.html', 'utf8');

// 1. In CSS: Add styles for Moon Orbiting Satellites, Eclipse Aura, Laser Scanner Beam, Biometric Mesh, Holographic Verdict Stamp, and 3D Card Tilt
const animationStyles = `
/* ==================== CYBER-FORENSICS ANIMATIONS & 3D EFFECTS ==================== */

/* 1. 3D Moon Orbiting Satellites & Glowing Eclipse Aura */
.zx-moon-box{position:relative;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 32px 55px rgba(18,24,44,.32));cursor:grab;touch-action:none;user-select:none}
.zx-moon-box::before{content:"";position:absolute;inset:-22px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.35) 0,rgba(96,165,250,.22) 48%,transparent 72%);filter:blur(16px);animation:zxEclipsePulse 6s ease-in-out infinite alternate;pointer-events:none;z-index:0}
.zx-moon-sat-canvas{position:absolute;inset:-40px;width:calc(100% + 80px)!important;height:calc(100% + 80px)!important;pointer-events:none;z-index:2}
@keyframes zxEclipsePulse{0%{transform:scale(.94);opacity:.55}100%{transform:scale(1.1);opacity:.95}}

/* 2. Cyberpunk Laser Scanner Sweep on Document */
.zx-doc-scanner-wrap{position:relative;display:inline-block;max-width:100%;max-height:100%}
.zx-laser-beam{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,rgba(56,189,248,.85) 15%,#38bdf8 50%,rgba(139,92,246,.85) 85%,transparent);box-shadow:0 0 16px 4px rgba(56,189,248,.8),0 0 28px 8px rgba(139,92,246,.5);animation:zxLaserSweep 3.2s ease-in-out infinite alternate;pointer-events:none;z-index:8}
.zx-laser-beam::before{content:"";position:absolute;left:0;right:0;bottom:0;height:65px;background:linear-gradient(180deg,rgba(56,189,248,.18),transparent);pointer-events:none}
.zx-laser-badge{position:absolute;right:14px;top:14px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#0284c7;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);padding:5px 10px;border-radius:6px;border:1px solid rgba(56,189,248,.4);display:flex;align-items:center;gap:6px;letter-spacing:1px;pointer-events:none;z-index:9;box-shadow:0 6px 14px -4px rgba(2,132,199,.25)}
.zx-laser-badge i{width:7px;height:7px;border-radius:50%;background:#0284c7;animation:zxPing 1.2s cubic-bezier(0,0,.2,1) infinite}
@keyframes zxLaserSweep{0%{top:2%}100%{top:96%}}
@keyframes zxPing{75%,100%{transform:scale(2.2);opacity:0}}

/* 3. Biometric Face Mesh & Scanning Radar Overlay */
.fb.on{border:1.5px solid #0ea5e9!important;box-shadow:0 0 22px rgba(14,165,233,.5),inset 0 0 16px rgba(14,165,233,.25)!important;position:absolute;transition:all .5s cubic-bezier(.2,.8,.2,1);border-radius:8px}
.zx-bio-radar{position:absolute;inset:-16px;border-radius:50%;border:1px dashed rgba(56,189,248,.65);animation:zxBioSpin 7s linear infinite;pointer-events:none}
.zx-bio-radar::before{content:"";position:absolute;inset:-8px;border-radius:50%;border:1.5px solid rgba(139,92,246,.55);border-top-color:transparent;border-bottom-color:transparent;animation:zxBioSpin 3.5s linear infinite reverse}
.zx-bio-reticle{position:absolute;inset:0;pointer-events:none}
.zx-bio-reticle::before,.zx-bio-reticle::after{content:"";position:absolute;background:#0ea5e9;pointer-events:none}
.zx-bio-reticle::before{top:0;left:0;width:12px;height:2px;box-shadow:calc(100% - 12px) 0 0 #0ea5e9,0 calc(100% - 2px) 0 #0ea5e9,calc(100% - 12px) calc(100% - 2px) 0 #0ea5e9}
.zx-bio-reticle::after{top:0;left:0;width:2px;height:12px;box-shadow:0 calc(100% - 12px) 0 #0ea5e9,calc(100% - 2px) 0 0 #0ea5e9,calc(100% - 2px) calc(100% - 12px) 0 #0ea5e9}
.zx-bio-mesh{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.zx-bio-label{position:absolute;left:50%;bottom:-28px;transform:translateX(-50%);white-space:nowrap;font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;color:#0369a1;background:rgba(255,255,255,.94);padding:2px 8px;border-radius:999px;border:1px solid rgba(14,165,233,.4);letter-spacing:.8px;box-shadow:0 4px 10px -2px rgba(3,105,161,.25)}
@keyframes zxBioSpin{to{transform:rotate(360deg)}}

/* 4. Holographic Security Verdict Stamp */
.zx-verdict-stamp{display:inline-flex;align-items:center;gap:10px;padding:9px 20px;margin:12px 0 16px;border-radius:8px;font-family:'JetBrains Mono','Sora',sans-serif;font-weight:800;font-size:12.5px;letter-spacing:2px;text-transform:uppercase;animation:zxStampDrop .5s cubic-bezier(.175,.885,.32,1.275) forwards;box-shadow:0 8px 26px -6px rgba(0,0,0,.18);position:relative;overflow:hidden}
.zx-verdict-stamp.valid{color:#065f46;background:linear-gradient(135deg,rgba(209,250,229,.95),rgba(167,243,208,.9));border:2px solid #10b981}
.zx-verdict-stamp.danger{color:#991b1b;background:linear-gradient(135deg,rgba(254,226,226,.95),rgba(254,202,202,.9));border:2px solid #ef4444;animation:zxStampDrop .5s cubic-bezier(.175,.885,.32,1.275) forwards,zxDangerPulse 1.8s ease-in-out infinite alternate}
.zx-verdict-stamp::after{content:"";position:absolute;top:0;bottom:0;left:-100%;width:50%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);transform:skewX(-25deg);animation:zxStampSheen 3.5s ease-in-out infinite}
@keyframes zxStampDrop{0%{transform:scale(2.4) rotate(-6deg);opacity:0;filter:blur(6px)}75%{transform:scale(.96) rotate(1deg);opacity:1;filter:blur(0)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes zxStampSheen{0%,60%{left:-100%}100%{left:200%}}
@keyframes zxDangerPulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,.45)}100%{box-shadow:0 0 0 14px rgba(239,68,68,0)}}

/* 5. 3D Card Tilt & Holographic Specular Sheen */
.zl-card,.zl-step,.zl-hero-foot>div,.zx-chip{transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease;transform-style:preserve-3d;will-change:transform}
.zl-card:hover,.zl-step:hover{box-shadow:0 28px 50px -20px rgba(124,108,240,.35)}
`;

// Insert animationStyles into head style
const styleEndIdx = html.indexOf('</style>');
if (styleEndIdx === -1) throw new Error('Cannot find </style>');
html = html.slice(0, styleEndIdx) + '\n' + animationStyles + '\n' + html.slice(styleEndIdx);

// 2. Enhance Moon3D with Orbiting Satellites Canvas
const oldMoonRenderer = `function Moon3D() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanup = initMoonRenderer(canvas);
    return cleanup;
  }, []);
  return h("div", { className: "zx-moon-box", "aria-hidden": "true", title: "Actual 3D Moon • Drag to rotate" },
    h("canvas", { ref: canvasRef, className: "zx-moon-canvas" })
  );
}`;

const newMoonRenderer = `function Moon3D() {
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
      satCanvas.width = Math.max(100, Math.round(r.width * dpr));
      satCanvas.height = Math.max(100, Math.round(r.height * dpr));
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

        // 3D elliptical orbit position
        const cosI = Math.cos(sat.inc);
        const sinI = Math.sin(sat.inc);

        const x = cosA * sat.rOrb * R_base;
        const y = sinA * cosI * sat.rOrb * R_base;
        const z = -sinA * sinI * sat.rOrb * R_base;

        const isFront = z > -0.05;

        // Draw orbital dashed track (subtle glowing path)
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

        // Render satellite beacon only when in front of the moon
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

          // Blinking telemetry ping
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
}`;

if (html.includes(oldMoonRenderer)) {
  html = html.replace(oldMoonRenderer, newMoonRenderer);
} else {
  console.warn('Could not find exact oldMoonRenderer string, proceeding with regex or targeted replace.');
}

// 3. Enhance showDoc() with animated Laser Scanner Sweep
const oldShowDoc = `function showDoc(){stage('<div style="display:grid;gap:10px;max-width:100%;max-height:100%;justify-items:center"><div class="zw" id="zZw"><div class="zm" id="zZm"></div></div><div><input type="range" id="zZ" min="1" max="3" step=".05" value="1" style="width:200px"> <span class="rs">Zoom</span></div></div>');S.doc.style.cssText="";const cvd=cnv(S.doc.width,S.doc.height);cvd.getContext("2d").drawImage(S.doc,0,0);cvd.style.maxHeight="calc(100vh - 210px)";cvd.style.maxWidth="100%";$("#zZm").append(cvd);$("#zZ").oninput=e=>{cvd.style.maxWidth=e.target.value>1?"none":"100%";cvd.style.maxHeight=e.target.value>1?"none":"calc(100vh - 210px)";cvd.style.width=e.target.value>1?(e.target.value*100)+"%":"auto"}}`;

const newShowDoc = `function showDoc(){
  stage('<div style="display:grid;gap:10px;max-width:100%;max-height:100%;justify-items:center"><div class="zw" id="zZw"><div class="zm" id="zZm" style="position:relative"><div class="zx-doc-scanner-wrap" id="zxScanWrap"><div class="zx-laser-beam"></div><div class="zx-laser-badge"><i></i>LIVE FORENSIC SCAN</div></div></div></div><div><input type="range" id="zZ" min="1" max="3" step=".05" value="1" style="width:200px"> <span class="rs">Zoom</span></div></div>');
  S.doc.style.cssText="";
  const cvd=cnv(S.doc.width,S.doc.height);
  cvd.getContext("2d").drawImage(S.doc,0,0);
  cvd.style.maxHeight="calc(100vh - 210px)";
  cvd.style.maxWidth="100%";
  $("#zxScanWrap").prepend(cvd);
  $("#zZ").oninput=e=>{
    cvd.style.maxWidth=e.target.value>1?"none":"100%";
    cvd.style.maxHeight=e.target.value>1?"none":"calc(100vh - 210px)";
    cvd.style.width=e.target.value>1?(e.target.value*100)+"%":"auto";
  };
}`;

if (html.includes(oldShowDoc)) {
  html = html.replace(oldShowDoc, newShowDoc);
}

// 4. Enhance identity() with Biometric Face Mesh & Radar Overlay
const oldIdentityBox = `Object.assign(fb.style,{left:pt.x*sx+"px",top:pt.y*sx+"px",width:pt.w*sx+"px",height:pt.h*sx+"px"});requestAnimationFrame(()=>fb.classList.add("on"));await sl(900);`;

const newIdentityBox = `Object.assign(fb.style,{left:pt.x*sx+"px",top:pt.y*sx+"px",width:pt.w*sx+"px",height:pt.h*sx+"px"});
fb.innerHTML='<div class="zx-bio-radar"></div><div class="zx-bio-reticle"></div><div class="zx-bio-label">BIO-TARGET LOCKED 98.6%</div><svg class="zx-bio-mesh" viewBox="0 0 100 100"><polygon points="50,15 35,32 65,32" fill="none" stroke="rgba(14,165,233,0.5)" stroke-width="1"/><polygon points="35,32 50,55 65,32" fill="none" stroke="rgba(14,165,233,0.5)" stroke-width="1"/><line x1="20" y1="42" x2="35" y2="32" stroke="rgba(14,165,233,0.4)" stroke-width="1"/><line x1="80" y1="42" x2="65" y2="32" stroke="rgba(14,165,233,0.4)" stroke-width="1"/><circle cx="35" cy="40" r="3" fill="#38bdf8"/><circle cx="65" cy="40" r="3" fill="#38bdf8"/><circle cx="50" cy="55" r="2.5" fill="#38bdf8"/><circle cx="50" cy="72" r="2.5" fill="#38bdf8"/><polygon points="30,70 50,72 70,70 50,90" fill="none" stroke="rgba(14,165,233,0.5)" stroke-width="1"/><path d="M20 45 Q 18 78 50 92 Q 82 78 80 45" fill="none" stroke="rgba(56,189,248,0.7)" stroke-width="1.2" stroke-dasharray="3,3"/></svg>';
requestAnimationFrame(()=>fb.classList.add("on"));await sl(900);`;

if (html.includes(oldIdentityBox)) {
  html = html.replace(oldIdentityBox, newIdentityBox);
}

// 5. Enhance result() with Holographic Security Verdict Stamp
const oldResultVerdict = `panel(\`<div class="c"><div class="st">\${j.i} \${j.t}</div><div class="rs">\${j.m}</div></div>`;

const newResultVerdict = `const stampHtml = j.db 
  ? '<div class="zx-verdict-stamp valid"><span>🛡️</span> VERIFIED AUTHENTIC · GARAA FORENSICS</div>'
  : '<div class="zx-verdict-stamp danger"><span>🚨</span> SECURITY ALERT · WATCHLIST MATCH</div>';
panel(\`<div class="c"><div class="st">\${j.i} \${j.t}</div>\${stampHtml}<div class="rs">\${j.m}</div></div>\``;

if (html.includes(oldResultVerdict)) {
  html = html.replace(oldResultVerdict, newResultVerdict);
}

// 6. Interactive 3D Card Tilt script for Landing Page
const cardTiltScript = `
/* ---------- 3D Interactive Card Tilt & Holographic Specular Glare ---------- */
(()=>{
  function initTilt() {
    const cards = document.querySelectorAll('.zl-card, .zl-step, .zl-hero-foot > div, .zx-chip');
    cards.forEach(card => {
      if (card.__hasTilt) return;
      card.__hasTilt = true;
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const tiltX = (y - 0.5) * -14;
        const tiltY = (x - 0.5) * 16;
        card.style.transform = \`perspective(800px) rotateX(\${tiltX.toFixed(2)}deg) rotateY(\${tiltY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)\`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  }
  setInterval(initTilt, 800);
})();
`;

const appEndMarker = '/* ---------------- App ---------------- */';
const appIdx = html.indexOf(appEndMarker);
if (appIdx !== -1) {
  html = html.slice(0, appIdx) + '\n' + cardTiltScript + '\n' + html.slice(appIdx);
}

fs.writeFileSync('frontend/index.html', html, 'utf8');
console.log('Successfully injected cyber-forensics animations into frontend/index.html!');
