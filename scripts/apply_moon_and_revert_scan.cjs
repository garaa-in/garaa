const fs = require('fs');

let html = fs.readFileSync('frontend/index.html', 'utf8');

// 1. Revert zxScan back to commit 983c19c (silky cream-white background with black nano-particle 3D globe)
const scanStartMarker = '/* ---- HD ROTATING REAL EARTH MADE OF JOINED MULTI-COLORED PARTICLES ON CREAM WHITE BACKGROUND ---- */';
const scanEndMarker = '/* ---- back to top ---- */';

const scanStartIndex = html.indexOf(scanStartMarker);
const scanEndIndex = html.indexOf(scanEndMarker);

if (scanStartIndex === -1 || scanEndIndex === -1) {
  throw new Error('Could not find zxScan markers in frontend/index.html');
}

const original983c19cScan = `/* ---- HD REAL 3D NANO-PARTICLE GLOBE ON CREAM WHITE SILK BACKGROUND ---- */
 function zxScan(swap,end,sourceButton){
  const el=document.createElement("canvas");el.id="zxs";el.setAttribute("aria-hidden","true");
  const ctx=el.getContext("2d");if(!ctx){setTimeout(swap,1600);setTimeout(end,2950);return}
  const W=innerWidth,H=innerHeight,d=Math.min(devicePixelRatio||1,2),cx=W/2,cy=H/2;
  el.width=Math.max(1,Math.round(W*d));el.height=Math.max(1,Math.round(H*d));ctx.setTransform(d,0,0,d,0,0);document.body.append(el);

  // Trigger smooth CSS fade-in
  requestAnimationFrame(()=>el.classList.add("zx-visible"));

  const landing=document.querySelector(".zl"),button=sourceButton||document.querySelector(".zl-btn");
  if(landing)landing.classList.add("zx-portal-leave");if(button)button.classList.add("zx-portal-button");

  const isMob=W<768||(navigator.hardwareConcurrency||8)<=4;
  const R_globe=Math.min(W,H)*(isMob?0.29:0.25);

  // 1. Generate 3D Mathematical Real Globe Points
  const globePoints=[];
  const phi=Math.PI*(3-Math.sqrt(5)); // Golden ratio angle

  // A. Fibonacci sphere uniform grid
  const SPHERE_COUNT=isMob?750:1350;
  for(let i=0;i<SPHERE_COUNT;i++){
    const y=1-(i/(SPHERE_COUNT-1))*2;
    const rAtY=Math.sqrt(Math.max(0,1-y*y));
    const theta=phi*i;
    globePoints.push({
      x:Math.cos(theta)*rAtY,
      y:y,
      z:Math.sin(theta)*rAtY,
      type:"grid",
      size:0.7+Math.random()*0.45
    });
  }

  // B. Latitude Parallels (Equator, Tropics, Polar circles)
  const parallels=[-60,-40,-20,0,20,40,60];
  parallels.forEach((pDeg)=>{
    const lat=(pDeg*Math.PI)/180;
    const y=Math.sin(lat);
    const rRing=Math.cos(lat);
    const count=Math.round((isMob?32:56)*rRing)+10;
    for(let j=0;j<count;j++){
      const lon=(j/count)*Math.PI*2;
      globePoints.push({
        x:Math.cos(lon)*rRing,
        y:y,
        z:Math.sin(lon)*rRing,
        type:pDeg===0?"equator":"parallel",
        size:pDeg===0?1.1:0.75
      });
    }
  });

  // C. Longitude Meridians
  const numMeridians=isMob?8:12;
  for(let m=0;m<numMeridians;m++){
    const lon=(m/numMeridians)*Math.PI*2;
    const pCount=isMob?22:36;
    for(let k=0;k<pCount;k++){
      const lat=(-Math.PI/2)+(k/(pCount-1))*Math.PI;
      const y=Math.sin(lat);
      const rRing=Math.cos(lat);
      globePoints.push({
        x:Math.cos(lon)*rRing,
        y:y,
        z:Math.sin(lon)*rRing,
        type:"meridian",
        size:0.72
      });
    }
  }

  // D. Real Continental Landmass Clusters
  const continentBoxes=[
    // India & South Asia (High density, sharp forensic focus)
    {lat:[8,35],lon:[68,92],n:isMob?120:250},
    // Rest of Asia
    {lat:[18,55],lon:[95,145],n:isMob?160:340},
    {lat:[52,70],lon:[45,170],n:isMob?100:200},
    {lat:[14,38],lon:[35,62],n:isMob?75:140},
    {lat:[-8,20],lon:[95,130],n:isMob?80:160},
    // Europe
    {lat:[36,68],lon:[-10,42],n:isMob?140:280},
    // Africa
    {lat:[-34,37],lon:[-17,50],n:isMob?170:340},
    // North America
    {lat:[18,65],lon:[-155,-60],n:isMob?170:340},
    // South America
    {lat:[-54,12],lon:[-80,-35],n:isMob?130:250},
    // Australia & Oceania
    {lat:[-40,-12],lon:[113,153],n:isMob?85:170},
    // Antarctica rim
    {lat:[-84,-70],lon:[-180,180],n:isMob?65:130}
  ];

  continentBoxes.forEach((b)=>{
    for(let i=0;i<b.n;i++){
      const latDeg=b.lat[0]+Math.random()*(b.lat[1]-b.lat[0]);
      const lonDeg=b.lon[0]+Math.random()*(b.lon[1]-b.lon[0]);
      const lat=(latDeg*Math.PI)/180;
      const lon=(lonDeg*Math.PI)/180;
      const y=Math.sin(lat);
      const r=Math.cos(lat);
      globePoints.push({
        x:Math.cos(lon)*r,
        y:y,
        z:Math.sin(lon)*r,
        type:"continent",
        size:0.9+Math.random()*0.45
      });
    }
  });

  // Assign random starting positions in outer space for smooth inward assembly
  const particles=globePoints.map((p)=>{
    const ang=Math.random()*Math.PI*2;
    const dist=Math.max(W,H)*(0.55+Math.random()*0.75);
    return{
      startX:cx+Math.cos(ang)*dist,
      startY:cy+Math.sin(ang)*dist,
      tx:p.x,
      ty:p.y,
      tz:p.z,
      size:p.size,
      type:p.type
    };
  });

  // Major continental hubs for global surveillance great-circle arcs
  const HUBS=[
    {name:"Delhi",lat:28.6,lon:77.2},
    {name:"London",lat:51.5,lon:-0.1},
    {name:"New York",lat:40.7,lon:-74.0},
    {name:"Tokyo",lat:35.6,lon:139.6},
    {name:"Sydney",lat:-33.8,lon:151.2},
    {name:"Dubai",lat:25.2,lon:55.2},
    {name:"Singapore",lat:1.35,lon:103.8},
    {name:"Sao Paulo",lat:-23.5,lon:-46.6}
  ].map((h)=>{
    const lat=(h.lat*Math.PI)/180;
    const lon=(h.lon*Math.PI)/180;
    return{
      name:h.name,
      x:Math.cos(lon)*Math.cos(lat),
      y:Math.sin(lat),
      z:Math.sin(lon)*Math.cos(lat)
    };
  });

  const ROUTES=[
    [0,1],[0,3],[0,5],[0,6],[1,2],[2,7],[3,4],[5,1],[6,4]
  ];

  const total=2950;
  const swapAt=1650;
  let started=performance.now();
  let raf=0;
  let didSwap=false;
  let done=false;

  const tilt=0.38; // 21.8 degrees axial tilt
  const cosT=Math.cos(tilt);
  const sinT=Math.sin(tilt);

  const finish=()=>{
    if(done)return;
    done=true;
    if(raf)cancelAnimationFrame(raf);
    ctx.clearRect(0,0,W,H);
    el.remove();
    if(landing)landing.classList.remove("zx-portal-leave");
    if(button)button.classList.remove("zx-portal-button");
    end();
  };

  const frame=(now)=>{
    if(done)return;
    const elapsed=now-started;

    if(!didSwap&&elapsed>=swapAt){
      didSwap=true;
      swap();
    }

    if(elapsed>=2250){
      el.classList.add("zx-fade-out");
    }

    if(elapsed>=total){
      finish();
      return;
    }

    ctx.clearRect(0,0,W,H);

    // Fade factor for smooth transition
    let globalFade=1;
    if(elapsed<350){
      globalFade=Math.min(1,elapsed/350);
    }else if(elapsed>2050){
      globalFade=Math.max(0,1-(elapsed-2050)/900);
    }

    // 1. Warm Silk Cream White Background
    const bgGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*0.75);
    bgGrad.addColorStop(0,"#FCFBF8");
    bgGrad.addColorStop(0.5,"#F7F4EE");
    bgGrad.addColorStop(1,"#ECE6DA");
    ctx.fillStyle=bgGrad;
    ctx.fillRect(0,0,W,H);

    // 2. Soft inner spherical glow behind the globe
    const coreGlow=ctx.createRadialGradient(cx,cy,0,cx,cy,R_globe*1.12);
    coreGlow.addColorStop(0,"rgba(255, 255, 255, 0.95)");
    coreGlow.addColorStop(0.72,"rgba(247, 244, 238, 0.7)");
    coreGlow.addColorStop(1,"rgba(236, 230, 218, 0)");
    ctx.fillStyle=coreGlow;
    ctx.beginPath();
    ctx.arc(cx,cy,R_globe*1.12,0,Math.PI*2);
    ctx.fill();

    // 3. Globe 3D Rotation Calculation
    const rotY=elapsed*0.00115;
    const cosY=Math.cos(rotY);
    const sinY=Math.sin(rotY);
    const camDist=2.8;

    const project3D=(gx,gy,gz)=>{
      // Rotate Y (spin)
      const x1=gx*cosY+gz*sinY;
      const z1=-gx*sinY+gz*cosY;
      const y1=gy;

      // Axial Tilt around Z
      const px=x1*cosT-y1*sinT;
      const py=x1*sinT+y1*cosT;
      const pz=z1;

      // Perspective
      const scale=camDist/(camDist-pz*0.36);
      return{
        x:cx+px*R_globe*scale,
        y:cy+py*R_globe*scale,
        pz,
        scale
      };
    };

    // Assembly easing from outer space into globe shape
    const assembleProgress=Math.min(1,elapsed/780);
    const easeAssemble=1-Math.pow(1-assembleProgress,3); // Cubic ease out

    // Exit expansion progress
    const exitProgress=elapsed>2000?Math.min(1,(elapsed-2000)/950):0;
    const expand=1+Math.pow(exitProgress,2)*0.55;

    // 4. Render Global Surveillance Great-Circle Arcs
    if(elapsed>450){
      const arcFade=Math.min(1,(elapsed-450)/400)*globalFade;
      ctx.lineWidth=0.75;
      ROUTES.forEach(([h1Idx,h2Idx])=>{
        const h1=HUBS[h1Idx];
        const h2=HUBS[h2Idx];
        const p1=project3D(h1.x,h1.y,h1.z);
        const p2=project3D(h2.x,h2.y,h2.z);

        if(p1.pz>-0.2||p2.pz>-0.2){
          const midX=(p1.x+p2.x)/2;
          const midY=(p1.y+p2.y)/2-28*((p1.scale+p2.scale)/2);
          ctx.strokeStyle=\`rgba(10, 13, 20, \${0.14*arcFade})\`;
          ctx.beginPath();
          ctx.moveTo(p1.x,p1.y);
          ctx.quadraticCurveTo(midX,midY,p2.x,p2.y);
          ctx.stroke();

          // Traveling pulse on the route
          const pulseT=(elapsed*0.0012+h1Idx*0.3)%1;
          const qx=Math.pow(1-pulseT,2)*p1.x+2*(1-pulseT)*pulseT*midX+Math.pow(pulseT,2)*p2.x;
          const qy=Math.pow(1-pulseT,2)*p1.y+2*(1-pulseT)*pulseT*midY+Math.pow(pulseT,2)*p2.y;
          ctx.fillStyle="#0A0D14";
          ctx.globalAlpha=arcFade*0.8;
          ctx.beginPath();
          ctx.arc(qx,qy,1.4,0,Math.PI*2);
          ctx.fill();
        }
      });
    }

    // 5. Render Nano-Particles in Deep Carbon Black
    for(let i=0;i<particles.length;i++){
      const p=particles[i];
      const prj=project3D(p.tx,p.ty,p.tz);

      let targetX=prj.x;
      let targetY=prj.y;

      if(expand>1){
        targetX=cx+(targetX-cx)*expand;
        targetY=cy+(targetY-cy)*expand;
      }

      let drawX,drawY;
      if(assembleProgress<1){
        drawX=p.startX+(targetX-p.startX)*easeAssemble;
        drawY=p.startY+(targetY-p.startY)*easeAssemble;
      }else{
        drawX=targetX;
        drawY=targetY;
      }

      const pz=prj.pz;
      const isFront=pz>-0.06;
      const frontAlpha=0.75+0.25*Math.max(0,pz);
      const backAlpha=0.12+0.18*((pz+1)/0.94);
      const alpha=(isFront?frontAlpha:backAlpha)*globalFade;

      const size=p.size*(isFront?1.05*prj.scale:0.72*prj.scale);

      ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
      ctx.fillStyle=isFront?"#0A0D14":"#4B5563";

      ctx.beginPath();
      ctx.arc(drawX,drawY,Math.max(0.42,size*0.75),0,Math.PI*2);
      ctx.fill();
    }

    // 6. Orbital Forensic Scanning Ring
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-0.34);
    ctx.strokeStyle=\`rgba(10, 13, 20, \${0.16*globalFade})\`;
    ctx.lineWidth=0.85;
    ctx.setLineDash([4,8]);
    ctx.beginPath();
    ctx.ellipse(0,0,R_globe*1.28,R_globe*0.42,0,0,Math.PI*2);
    ctx.stroke();

    const pulseAng=elapsed*0.0022;
    const pulseX=Math.cos(pulseAng)*(R_globe*1.28);
    const pulseY=Math.sin(pulseAng)*(R_globe*0.42);
    ctx.fillStyle="#0A0D14";
    ctx.globalAlpha=0.9*globalFade;
    ctx.beginPath();
    ctx.arc(pulseX,pulseY,2.2,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    // 7. Minimalist Typography & Verification Progress Bar
    const labelY=cy+R_globe*1.34;
    ctx.textAlign="center";
    ctx.textBaseline="middle";

    ctx.font="700 11px 'JetBrains Mono', 'Sora', sans-serif";
    try{ctx.letterSpacing="4px"}catch(_){}
    ctx.fillStyle="#0A0D14";
    ctx.globalAlpha=Math.min(1,Math.max(0,(elapsed-400)/450))*globalFade;
    ctx.fillText("GARAA · GLOBAL VERIFICATION",cx,labelY);

    ctx.font="500 10px 'JetBrains Mono', monospace";
    try{ctx.letterSpacing="2px"}catch(_){}
    ctx.fillStyle="#4B5563";
    ctx.globalAlpha=Math.min(1,Math.max(0,(elapsed-550)/450))*globalFade;
    ctx.fillText("INITIALIZING BIOMETRIC SCANNER",cx,labelY+22);

    const barW=Math.min(150,W*0.4);
    const barH=2;
    const barProg=Math.min(1,Math.max(0,(elapsed-300)/1400));
    ctx.fillStyle="rgba(10, 13, 20, 0.1)";
    ctx.fillRect(cx-barW/2,labelY+34,barW,barH);
    ctx.fillStyle="#0A0D14";
    ctx.fillRect(cx-barW/2,labelY+34,barW*barProg,barH);

    ctx.globalAlpha=1;
    raf=requestAnimationFrame(frame);
  };

  raf=requestAnimationFrame(frame);
 }
`;

html = html.slice(0, scanStartIndex) + original983c19cScan + html.slice(scanEndIndex);

// 2. Add Moon3D component before Landing component
const moonRendererCode = `
/* ---------------- 3D Rotating Moon Component ---------------- */
function initMoonRenderer(canvas) {
  if (!canvas) return () => {};
  let animId = 0;
  let disposed = false;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(64, Math.round((rect.width || 210) * dpr));
  const height = Math.max(64, Math.round((rect.height || 210) * dpr));
  canvas.width = width;
  canvas.height = height;

  let rotX = 0;
  let rotY = 0;
  let targetRotX = 0;
  let velX = 0;
  let isDragging = false;
  let lastPointerX = 0;

  const onPointerDown = (e) => {
    isDragging = true;
    lastPointerX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const dx = clientX - lastPointerX;
    lastPointerX = clientX;
    velX = dx * 0.007;
    rotX += velX;
  };
  const onPointerUp = () => { isDragging = false; };

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Try WebGL
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false }) ||
         canvas.getContext('experimental-webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  } catch (err) {}

  if (gl) {
    const vsSource = \`
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    \`;

    const fsSource = \`
      precision highp float;
      uniform sampler2D u_tex;
      uniform float u_time;
      uniform float u_rotX;
      uniform vec2 u_res;
      varying vec2 v_uv;

      #define PI 3.141592653589793

      void main() {
        vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / (0.5 * min(u_res.x, u_res.y));
        float r = length(p);
        float R = 0.94;

        if (r > R) {
          float edge = smoothstep(R + 0.025, R, r);
          if (edge <= 0.001) {
            discard;
          }
          // Very subtle limb atmospheric scattering halo
          gl_FragColor = vec4(0.85, 0.88, 0.98, edge * 0.06);
          return;
        }

        float z = sqrt(max(0.0, R * R - r * r));
        vec3 N = normalize(vec3(p.x, -p.y, z));

        // Moon subtle axial tilt
        float tilt = 0.09;
        float cosT = cos(tilt);
        float sinT = sin(tilt);
        vec3 Nt = vec3(N.x, N.y * cosT - N.z * sinT, N.y * sinT + N.z * cosT);

        float lat = asin(clamp(Nt.y, -1.0, 1.0));
        // Slow majestic 3D rotation + user interactive drag
        float lon = atan(Nt.x, Nt.z) + u_rotX + u_time * 0.075;

        vec2 uv = vec2(fract(lon / (2.0 * PI) + 0.5), lat / PI + 0.5);
        vec4 tex = texture2D(u_tex, uv);

        // 3D Directional Sunlight from upper right
        vec3 L = normalize(vec3(0.52, 0.38, 0.76));
        float NdotL = dot(N, L);
        float diffuse = clamp(NdotL, 0.0, 1.0);
        // Soft earthshine on the shadowed side so dark maria and craters have rich 3D presence
        float earthshine = 0.20 + 0.08 * (1.0 - diffuse);
        float limb = pow(1.0 - N.z, 2.6) * 0.18;

        float lighting = diffuse * 0.85 + earthshine + limb;
        vec3 col = tex.rgb * lighting;

        // Anti-aliased limb edge
        float alpha = smoothstep(R, R - 0.012, r);
        gl_FragColor = vec4(col, alpha);
      }
    \`;

    function createShader(gl, type, source) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const uTex = gl.getUniformLocation(prog, 'u_tex');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRotX = gl.getUniformLocation(prog, 'u_rotX');
    const uRes = gl.getUniformLocation(prog, 'u_res');

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([180, 180, 180, 255]));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    img.src = '/moon_nasa.jpg';

    gl.viewport(0, 0, width, height);

    const renderGL = (time) => {
      if (disposed) return;
      if (!isDragging) {
        velX *= 0.94;
        rotX += velX;
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.enableVertexAttribArray(aPos);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uTex, 0);

      gl.uniform1f(uTime, time * 0.001);
      gl.uniform1f(uRotX, rotX);
      gl.uniform2f(uRes, width, height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(renderGL);
    };
    animId = requestAnimationFrame(renderGL);
  } else {
    // 2D Canvas fallback
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {};
    img.src = '/moon_nasa.jpg';

    const render2D = (time) => {
      if (disposed) return;
      if (!isDragging) {
        velX *= 0.94;
        rotX += velX;
      }
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(cx, cy) * 0.92;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      if (img.complete && img.naturalWidth) {
        const offset = ((time * 0.02 + rotX * 60) % img.naturalWidth + img.naturalWidth) % img.naturalWidth;
        ctx.drawImage(img, offset, 0, img.naturalWidth - offset, img.naturalHeight, cx - r, cy - r, (r * 2) * ((img.naturalWidth - offset) / img.naturalWidth), r * 2);
        if (offset > 0) {
          ctx.drawImage(img, 0, 0, offset, img.naturalHeight, cx - r + (r * 2) * ((img.naturalWidth - offset) / img.naturalWidth), cy - r, (r * 2) * (offset / img.naturalWidth), r * 2);
        }
      } else {
        ctx.fillStyle = '#bbb';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // 3D spherical shading overlay
      const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.65, 'rgba(20, 24, 38, 0.1)');
      grad.addColorStop(1, 'rgba(10, 14, 25, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      ctx.restore();
      animId = requestAnimationFrame(render2D);
    };
    animId = requestAnimationFrame(render2D);
  }

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

function Moon3D() {
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
}
`;

// Insert Moon3D before "function Landing"
const landingPos = html.indexOf('function Landing(');
if (landingPos === -1) {
  throw new Error('Could not find function Landing in frontend/index.html');
}
html = html.slice(0, landingPos) + moonRendererCode + '\n' + html.slice(landingPos);

// 3. Replace .zx-orb with Moon3D in zl-creator
const oldCreatorOrb = 'h("div", { className: "zx-orb", "aria-hidden": "true" })';
if (!html.includes(oldCreatorOrb)) {
  throw new Error('Could not find zx-orb in zl-creator');
}
html = html.replace(oldCreatorOrb, 'h(Moon3D, null)');

// 4. Update CSS styles for .zx-moon-box and .zx-moon-canvas, and remove old zx-orb gradient & animation
const moonCss = `
.zx-moon-box{width:min(52vw,220px);aspect-ratio:1;margin:0 auto 38px;position:relative;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 32px 55px rgba(18,24,44,.32));cursor:grab;touch-action:none;user-select:none}
.zx-moon-box:active{cursor:grabbing}
.zx-moon-canvas{width:100%;height:100%;display:block;border-radius:50%;background:transparent!important}
`;

// Replace first occurrence of .zx-orb styling
const orbCssStart = '.zx-orb{width:min(46vw,180px);aspect-ratio:1;margin:0 auto 46px;';
const orbCssEnd = '.zx-orb::after{inset:-36%;border-color:rgba(169,155,240,.6);transform:rotateX(72deg) rotateY(18deg)}';
const orbIdx = html.indexOf(orbCssStart);
const orbEndIdx = html.indexOf(orbCssEnd);
if (orbIdx !== -1 && orbEndIdx !== -1) {
  html = html.slice(0, orbIdx) + moonCss.trim() + html.slice(orbEndIdx + orbCssEnd.length);
}

// Write back to frontend/index.html
fs.writeFileSync('frontend/index.html', html, 'utf8');
console.log('Successfully updated frontend/index.html with Moon3D and restored 983c19c zxScan!');
