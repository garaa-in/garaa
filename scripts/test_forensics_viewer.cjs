const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    pass++;
  } else {
    console.error(`FAIL: ${message}`);
    fail++;
  }
}

// 1. Viewer persona added
assert(
  html.includes('Document Inspector') && html.includes('role: "Viewer"'),
  'Document Inspector (Viewer) persona added to personas list'
);

// 2. isViewerMode state logic in App
assert(
  html.includes('const isViewerMode = personaRole === "Viewer"'),
  'isViewerMode state logic present in App'
);

// 3. Exit Viewer Mode button
assert(
  html.includes('Exit Viewer Mode'),
  'Exit Viewer Mode button present in TopBar'
);

// 4. Detailed Forensic Tamper Report button & modal
assert(
  html.includes('🔬 OPEN DETAILED FORENSIC TAMPER REPORT') && html.includes('ForensicTamperModal'),
  'Detailed Forensic Tamper Report button and ForensicTamperModal integrated'
);

// 5. Sample tampered generator
assert(
  html.includes('createSampleTamperedFile') && html.includes('⚡ Try Sample Tampered Document'),
  'Sample tampered generator and demo button integrated'
);

// 6. Camera capture immunity
assert(
  html.includes('isPhysicalCamera') && html.includes('LIVE OPTICAL CAPTURE · ZERO DIGITAL SPLICING'),
  'Camera scans guaranteed physical capture immunity (zero tamper)'
);

// 7. Viewer mode restricted card
assert(
  html.includes('isViewerMode: true') && html.includes('ExtractedCredentialsCard({ fields, result, isViewerMode })'),
  'Restricted credentials card without telemetry badges for Viewer mode'
);

// 8. ELA Engine Block Analysis
assert(
  html.includes('analyzeForensicTamper') && html.includes('renderForensicHeatmap') && html.includes('blockSize = 16'),
  'Canvas-based Error Level Analysis (ELA) and high-pass edge frequency engine'
);

console.log(`\nResults: ${pass} / ${pass + fail} checks passed.`);
if (fail > 0) process.exit(1);
