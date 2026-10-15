const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\parth\\.gemini\\antigravity\\brain\\4c6b359d-4d77-4608-8ddb-9fc76b24e5f2\\.system_generated\\logs\\transcript_full.jsonl';

const stream = fs.createReadStream(transcriptPath, { encoding: 'utf8' });
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

let found = false;
rl.on('line', (line) => {
  if (found || !line.includes('<!DOCTYPE html>')) return;
  try {
    const obj = JSON.parse(line);
    const content = obj.content;
    if (content && content.includes('<!DOCTYPE html>')) {
      const start = content.indexOf('<!DOCTYPE html>');
      const end = content.lastIndexOf('</html>');
      if (start !== -1 && end !== -1) {
        found = true;
        const html = content.substring(start, end + 7);
        fs.writeFileSync('original_garaa.html', html, 'utf8');
        console.log('SUCCESS! Length:', html.length);
        console.log('Has tw-static:', html.includes('tw-static'));
        console.log('Has zx-js:', html.includes('zx-js'));
        process.exit(0);
      }
    }
  } catch (e) {
    // line might be huge
  }
});

rl.on('close', () => {
  if (!found) console.log('Not found in transcript_full.jsonl');
});
