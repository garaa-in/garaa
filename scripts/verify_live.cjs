const http = require('http');

http.get('http://localhost:5173/moon_nasa.jpg', res => {
  console.log('moon_nasa.jpg status:', res.statusCode, 'Content-Length:', res.headers['content-length']);
});

http.get('http://localhost:5173/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('index status:', res.statusCode);
    console.log('Has Moon3D component:', body.includes('Moon3D'));
    console.log('Has zx-moon-box class:', body.includes('zx-moon-box'));
    console.log('Has cream-white bg (#FCFBF8):', body.includes('#FCFBF8'));
    console.log('Has GARAA · GLOBAL VERIFICATION:', body.includes('GARAA · GLOBAL VERIFICATION'));
    console.log('Old zx-orb removed from zl-creator:', !body.includes('zl-creator", className: "zx-cr" }, h("div", { className: "zx-orb"'));
  });
});
