const fs = require("fs");
const html = fs.readFileSync("frontend/index.html", "utf-8");
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let idx = 0;
let hasError = false;
while ((match = scriptRegex.exec(html)) !== null) {
  idx++;
  const code = match[1];
  if (code.trim().length === 0) continue;
  try {
    new Function(code);
    console.log("Script #" + idx + " OK (" + code.length + " bytes)");
  } catch (e) {
    console.error("Syntax error in script #" + idx + ": " + e.message);
    hasError = true;
  }
}
if (!hasError) {
  console.log("ALL SCRIPTS VALIDATED CLEANLY!");
} else {
  process.exit(1);
}
