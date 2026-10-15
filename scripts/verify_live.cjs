const http = require('http');

http.get('http://localhost:5173/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('index status:', res.statusCode);
    console.log('Has Moon3D component:', body.includes('Moon3D'));
    console.log('Has Satellites Canvas:', body.includes('zx-moon-sat-canvas'));
    console.log('Has Laser Scanner Beam:', body.includes('zx-laser-beam'));
    console.log('Has Biometric Radar & Reticle:', body.includes('zx-bio-radar'));
    console.log('Has Holographic Verdict Stamp:', body.includes('zx-verdict-stamp'));
    console.log('Has 3D Card Tilt:', body.includes('initTilt'));
    console.log('Has cream-white bg (#FCFBF8):', body.includes('#FCFBF8'));
  });
});
