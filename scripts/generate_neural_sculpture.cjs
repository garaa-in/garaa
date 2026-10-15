const fs = require('fs');
const zlib = require('zlib');

const imgPath = 'C:/Users/parth/.gemini/antigravity/brain/4c6b359d-4d77-4608-8ddb-9fc76b24e5f2/.user_uploaded/media_1792101559620_a567d3fb.png';
const buf = fs.readFileSync(imgPath);
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

const idats = [];
let offset = 8;
while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') idats.push(buf.slice(offset + 8, offset + 8 + len));
  offset += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idats));
const stride = 1 + width * 4;

const rgba = Buffer.alloc(width * height * 4);
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
for (let y = 0; y < height; y++) {
  const filter = raw[y * stride];
  const rowOffset = y * stride + 1;
  for (let x = 0; x < width * 4; x++) {
    const val = raw[rowOffset + x];
    let recon = 0;
    const a = x >= 4 ? rgba[y * width * 4 + x - 4] : 0;
    const b = y > 0 ? rgba[(y - 1) * width * 4 + x] : 0;
    const c = (x >= 4 && y > 0) ? rgba[(y - 1) * width * 4 + x - 4] : 0;
    if (filter === 0) recon = val;
    else if (filter === 1) recon = (val + a) & 0xff;
    else if (filter === 2) recon = (val + b) & 0xff;
    else if (filter === 3) recon = (val + Math.floor((a + b) / 2)) & 0xff;
    else if (filter === 4) recon = (val + paeth(a, b, c)) & 0xff;
    rgba[y * width * 4 + x] = recon;
  }
}

const particles = [];
const neuralNodes = [];

const cX = width * 0.49;
const cY = height * 0.48;
const scaleFactor = 1 / (width * 0.46);

const STEP = 4;
for (let y = 25; y < height - 25; y += STEP) {
  for (let x = 25; x < width - 25; x += STEP) {
    const i = (y * width + x) * 4;
    const r = rgba[i], g = rgba[i+1], b = rgba[i+2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    const distToCenter = Math.hypot((x - width * 0.45) / width, (y - height * 0.5) / height);
    const bgLum = 186 - distToCenter * 24;

    if (lum < bgLum - 14) {
      const darkness = Math.min(1, Math.max(0, (bgLum - lum) / 140));
      const nx = (x - cX) * scaleFactor;
      const ny = (y - cY) * scaleFactor;

      let nz = 0;
      let pType = 'stipple';
      let pSize = 0.85 + darkness * 0.95;
      let pColor = lum < 55 ? '#0A0D14' : lum < 90 ? '#1E2530' : lum < 130 ? '#3A4454' : '#6B7688';

      // 1. Face region: x in [370..670], y in [165..555]
      if (x >= 370 && y >= 165 && y <= 555) {
        pType = 'face';
        const faceMidX = 490 + (y - 350) * 0.16;
        const dxFace = (x - faceMidX) / 130;
        const dyFace = (y - 350) / 180;

        const radialSq = 1 - Math.min(0.95, dxFace * dxFace * 0.85 + dyFace * dyFace * 0.55);
        nz = Math.sqrt(Math.max(0, radialSq)) * 0.42;

        // Nose protrusion
        if (y >= 310 && y <= 420 && x >= 460 && x <= 535) {
          const noseDist = Math.hypot((x - 495) / 35, (y - 365) / 55);
          if (noseDist < 1.0) nz += (1 - noseDist) * 0.18;
        }
        // Eye socket indentation
        if (y >= 270 && y <= 335 && x >= 495 && x <= 585) {
          const eyeDist = Math.hypot((x - 540) / 45, (y - 305) / 30);
          if (eyeDist < 1.0) nz -= (1 - eyeDist) * 0.12;
        }
        // Lips protrusion
        if (y >= 430 && y <= 475 && x >= 475 && x <= 535) {
          nz += 0.08;
        }
      }
      // 2. Hand region: x < 420 and y > 380
      else if (x < 420 && y > 380) {
        pType = 'hand';
        const handProgress = (860 - y) / 480;
        nz = -0.12 + handProgress * 0.48;

        if (x > 260 && y < 600) {
          nz += 0.14; // Fingertips in front
          pSize *= 1.15;
        }
      }
      // 3. Neural plexus & floating node clusters
      else {
        pType = 'neural';
        const seed = Math.sin(x * 12.9898 + y * 78.233);
        nz = (seed * 0.5) * 0.42;
        pSize = lum < 45 ? 1.5 : 1.05;
      }

      // Detect prominent neural nodes (spheres) in the plexus
      // Looking for local dark peaks or explicit node points
      const isNeuralZone = (y < 340) || (x < 440 && y >= 340 && y <= 660) || (x > 580);
      if (isNeuralZone && lum < 65) {
        if (Math.random() < 0.065) {
          neuralNodes.push({
            x: Math.round(nx * 1000) / 1000,
            y: Math.round(ny * 1000) / 1000,
            z: Math.round(nz * 1000) / 1000,
            size: 2.0 + Math.random() * 1.6,
            isWhite: Math.random() < 0.15
          });
        }
      }

      particles.push({
        x: Math.round(nx * 1000) / 1000,
        y: Math.round(ny * 1000) / 1000,
        z: Math.round(nz * 1000) / 1000,
        s: Math.round(pSize * 10) / 10,
        c: pColor,
        t: pType
      });
    }
  }
}

// Connect neural nodes with 3D filaments
const connections = [];
const maxDist = 0.38;
for (let i = 0; i < neuralNodes.length; i++) {
  let count = 0;
  for (let j = i + 1; j < neuralNodes.length; j++) {
    const p1 = neuralNodes[i];
    const p2 = neuralNodes[j];
    const d = Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
    if (d < maxDist) {
      connections.push([i, j, Math.round(d * 1000) / 1000]);
      count++;
      if (count >= 5) break;
    }
  }
}

console.log('Refined Neural Sculpture:');
console.log('Total particles:', particles.length);
console.log('Neural nodes:', neuralNodes.length);
console.log('Neural connections:', connections.length);

const outData = {
  particles,
  neuralNodes,
  connections
};

fs.mkdirSync('frontend/public', { recursive: true });
fs.writeFileSync('frontend/public/neural_sculpture_data.json', JSON.stringify(outData));
fs.writeFileSync('public/neural_sculpture_data.json', JSON.stringify(outData));
console.log('Saved neural_sculpture_data.json successfully!');
