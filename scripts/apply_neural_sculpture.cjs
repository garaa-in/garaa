const fs = require('fs');

let html = fs.readFileSync('frontend/index.html', 'utf8');

// 1. Locate Moon3D in frontend/index.html
const moonStartMarker = '/* ---------------- 3D Rotating Moon Component ---------------- */';
const moonEndMarker = 'function Landing({ onStart, onGo }) {';

const startIdx = html.indexOf(moonStartMarker);
const endIdx = html.indexOf(moonEndMarker);

if (startIdx === -1 || endIdx === -1) {
  throw new Error('Could not find Moon3D markers in frontend/index.html');
}

// 2. Build the NeuralHandFace3D Component
const neuralComponentCode = `/* ---------------- 3D Neural Hand, Face & Plexus Particle Sculpture ---------------- */
function initNeuralSculpture(canvas, sculptureData) {
  if (!canvas || !sculptureData) return () => {};
  let animId = 0;
  let disposed = false;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(120, Math.round((rect.width || 340) * dpr));
  const height = Math.max(140, Math.round((rect.height || 420) * dpr));
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const cx = width / 2;
  const cy = height * 0.51;
  const baseScale = Math.min(width, height) * 0.44;

  let rotY = 0.06;
  let rotX = -0.03;
  let targetRotY = 0.06;
  let targetRotX = -0.03;
  let velY = 0;
  let velX = 0;
  let isDragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const onPointerDown = (e) => {
    isDragging = true;
    lastPointerX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    lastPointerY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  };
  const onPointerMove = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    if (isDragging) {
      const dx = clientX - lastPointerX;
      const dy = clientY - lastPointerY;
      lastPointerX = clientX;
      lastPointerY = clientY;
      velY = dx * 0.008;
      velX = dy * 0.008;
      targetRotY += velY;
      targetRotX += velX;
    } else {
      const r = canvas.getBoundingClientRect();
      const nx = ((clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((clientY - r.top) / r.height - 0.5) * 2;
      targetRotY = nx * 0.32;
      targetRotX = -ny * 0.20;
    }
  };
  const onPointerUp = () => { isDragging = false; };

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  const particles = sculptureData.particles || [];
  const neuralNodes = sculptureData.neuralNodes || [];
  const connections = sculptureData.connections || [];

  const phases = new Float32Array(particles.length);
  for (let i = 0; i < particles.length; i++) phases[i] = Math.random() * Math.PI * 2;

  const projNodes = new Array(neuralNodes.length);
  for (let i = 0; i < neuralNodes.length; i++) {
    projNodes[i] = { x: 0, y: 0, z: 0, scale: 1 };
  }

  const camDist = 2.85;
  const startTime = performance.now();

  const render = (now) => {
    if (disposed) return;
    const elapsed = now - startTime;
    const timeSec = elapsed * 0.001;

    if (!isDragging) {
      velY *= 0.92;
      velX *= 0.92;
      const idleY = Math.sin(timeSec * 0.65) * 0.16;
      const idleX = Math.cos(timeSec * 0.52) * 0.07 - 0.03;
      rotY += (targetRotY + idleY - rotY) * 0.06;
      rotX += (targetRotX + idleX - rotX) * 0.06;
    } else {
      rotY += (targetRotY - rotY) * 0.22;
      rotX += (targetRotX - rotX) * 0.22;
    }

    ctx.clearRect(0, 0, width, height);

    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    // 1. Project Neural Nodes in 3D
    for (let i = 0; i < neuralNodes.length; i++) {
      const n = neuralNodes[i];
      const driftY = Math.sin(timeSec * 1.1 + i) * 0.012;
      const driftX = Math.cos(timeSec * 0.9 + i) * 0.010;

      const x1 = (n.x + driftX) * cosY + n.z * sinY;
      const z1 = -(n.x + driftX) * sinY + n.z * cosY;
      const y2 = (n.y + driftY) * cosX - z1 * sinX;
      const z2 = (n.y + driftY) * sinX + z1 * cosX;

      const scale = camDist / (camDist - z2 * 0.38);
      projNodes[i].x = cx + x1 * baseScale * scale;
      projNodes[i].y = cy + y2 * baseScale * scale;
      projNodes[i].z = z2;
      projNodes[i].scale = scale;
    }

    // 2. Draw Synaptic Connective Filaments & Traveling Nerve Pulses
    ctx.lineWidth = 0.85 * dpr;
    for (let k = 0; k < connections.length; k++) {
      const [i1, i2, dist] = connections[k];
      const p1 = projNodes[i1];
      const p2 = projNodes[i2];
      if (!p1 || !p2) continue;

      const avgZ = (p1.z + p2.z) * 0.5;
      const zAlpha = Math.max(0.08, Math.min(0.65, 0.32 + avgZ * 0.36));
      const distFade = Math.max(0.2, 1 - dist / 0.42);
      const alpha = zAlpha * distFade;

      ctx.strokeStyle = \`rgba(30, 41, 59, \${alpha})\`;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Traveling pulse spark
      const pulseSpeed = 1.35;
      const pulseT = (timeSec * pulseSpeed + k * 0.21) % 1;
      const pulseX = p1.x + (p2.x - p1.x) * pulseT;
      const pulseY = p1.y + (p2.y - p1.y) * pulseT;

      ctx.fillStyle = avgZ > 0 ? '#0A0D14' : '#4B5563';
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, Math.max(0.7, 1.3 * ((p1.scale + p2.scale) * 0.5)), 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw 3D Nano-Particles forming Face & Hand
    const breathAmp = 0.007;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const ph = phases[i];
      const dx = Math.sin(timeSec * 1.5 + ph) * breathAmp;
      const dy = Math.cos(timeSec * 1.2 + ph) * breathAmp;

      const x1 = (p.x + dx) * cosY + p.z * sinY;
      const z1 = -(p.x + dx) * sinY + p.z * cosY;
      const y2 = (p.y + dy) * cosX - z1 * sinX;
      const z2 = (p.y + dy) * sinX + z1 * cosX;

      const scale = camDist / (camDist - z2 * 0.38);
      const screenX = cx + x1 * baseScale * scale;
      const screenY = cy + y2 * baseScale * scale;

      const isFront = z2 > -0.08;
      const alpha = isFront
        ? Math.min(1, 0.75 + z2 * 0.35)
        : Math.max(0.18, 0.40 + z2 * 0.38);

      const r = Math.max(0.42, p.s * scale * (isFront ? 0.95 : 0.72));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Neural Hub Nodes (Spheres with highlights)
    for (let i = 0; i < neuralNodes.length; i++) {
      const n = neuralNodes[i];
      const p = projNodes[i];
      const isFront = p.z > -0.05;
      const r = n.size * p.scale * (isFront ? 1.05 : 0.82);

      if (n.isWhite) {
        ctx.globalAlpha = Math.min(1, 0.9 + p.z * 0.2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.lineWidth = 1 * dpr;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.stroke();
      } else {
        ctx.globalAlpha = Math.min(1, 0.88 + p.z * 0.15);
        ctx.fillStyle = '#0A0D14';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    disposed = true;
    if (animId) cancelAnimationFrame(animId);
    canvas.removeEventListener('mousedown', onPointerDown);
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
    canvas.removeEventListener('touchstart', onPointerDown);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
  };
}

let __cachedNeuralData = null;

function NeuralHandFace3D() {
  const canvasRef = useRef(null);
  const [data, setData] = useState(__cachedNeuralData);

  useEffect(() => {
    if (__cachedNeuralData) {
      setData(__cachedNeuralData);
      return;
    }
    fetch('/neural_sculpture_data.json')
      .then((r) => r.json())
      .then((json) => {
        __cachedNeuralData = json;
        setData(json);
      })
      .catch((e) => console.error('Failed to load neural sculpture data', e));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const cleanup = initNeuralSculpture(canvas, data);
    return cleanup;
  }, [data]);

  return h("div", {
    className: "zx-sculpture-box",
    "aria-hidden": "true",
    title: "3D Neural Hand & Face • Drag or hover to rotate in 3D"
  }, h("canvas", { ref: canvasRef, className: "zx-sculpture-canvas" }));
}
`;

html = html.slice(0, startIdx) + neuralComponentCode + '\n' + html.slice(endIdx);

// 3. Replace h(Moon3D, null) with h(NeuralHandFace3D, null) in zl-creator
html = html.replace('h(Moon3D, null)', 'h(NeuralHandFace3D, null)');

// 4. Update CSS styles for .zx-sculpture-box and .zx-sculpture-canvas
const sculptureCss = `
.zx-sculpture-box{width:min(86vw,350px);height:min(94vw,430px);margin:0 auto 32px;position:relative;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 32px 55px rgba(18,24,44,.24));cursor:grab;touch-action:none;user-select:none}
.zx-sculpture-box:active{cursor:grabbing}
.zx-sculpture-canvas{width:100%;height:100%;display:block;background:transparent!important}
`;

// Replace .zx-moon-box CSS
const moonCssStart = '.zx-moon-box{width:min(52vw,220px);';
const moonCssEnd = '.zx-moon-canvas{width:100%;height:100%;display:block;border-radius:50%;background:transparent!important}';
const mIdx = html.indexOf(moonCssStart);
const mEndIdx = html.indexOf(moonCssEnd);
if (mIdx !== -1 && mEndIdx !== -1) {
  html = html.slice(0, mIdx) + sculptureCss.trim() + html.slice(mEndIdx + moonCssEnd.length);
}

fs.writeFileSync('frontend/index.html', html, 'utf8');
console.log('Successfully updated frontend/index.html with NeuralHandFace3D!');
