const http = require('http');

http.get('http://localhost:5173/neural_sculpture_data.json', res => {
  console.log('neural_sculpture_data.json status:', res.statusCode, 'Content-Length:', res.headers['content-length']);
});

http.get('http://localhost:5173/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('index status:', res.statusCode);
    console.log('Has NeuralHandFace3D component:', body.includes('NeuralHandFace3D'));
    console.log('Has zx-sculpture-box class:', body.includes('zx-sculpture-box'));
    console.log('Has cream-white bg (#FCFBF8):', body.includes('#FCFBF8'));
    console.log('Has GARAA · GLOBAL VERIFICATION:', body.includes('GARAA · GLOBAL VERIFICATION'));
    console.log('Old zx-orb removed from zl-creator:', !body.includes('zl-creator", className: "zx-cr" }, h("div", { className: "zx-orb"'));
    console.log('Old Moon3D removed from zl-creator:', !body.includes('h(Moon3D, null)'));
  });
});
