const http = require('http');
const fs = require('fs');
const assert = require('assert');

http.get('http://localhost:5173/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('=== VERIFYING PRICING SECTION ===');
    console.log('HTTP Status:', res.statusCode);
    assert.strictEqual(res.statusCode, 200, 'Page must return 200 OK');

    // 1. Placement verification: zl-about comes before PricingSection call, which comes before zl-reviews
    const posAbout = body.lastIndexOf('id: "zl-about"');
    const posPricingCall = body.lastIndexOf('h(PricingSection');
    const posReviews = body.lastIndexOf('id: "zl-reviews"');
    console.log('Section positions in Landing JSX:', { posAbout, posPricingCall, posReviews });
    assert.ok(posAbout > 0, 'zl-about must exist in Landing');
    assert.ok(posPricingCall > 0, 'PricingSection must be invoked in Landing');
    assert.ok(posReviews > 0, 'zl-reviews must exist in Landing');
    assert.ok(posAbout < posPricingCall, 'zl-about must be before PricingSection call');
    assert.ok(posPricingCall < posReviews, 'PricingSection must be before zl-reviews call');
    console.log('✓ Section order: About Garaa -> PricingSection -> Ready when you are: PASS');

    // 2. Header
    assert.ok(body.includes('GARAA PLANS'), 'Must include eyebrow GARAA PLANS');
    assert.ok(body.includes('Trust, at every level.'), 'Must include heading');
    assert.ok(body.includes('Intelligent verification. Deeper screening. A safer digital world.'), 'Must include subtitle');
    console.log('✓ Section Header: PASS');

    // 3. Card 1 - Garaa Verify
    assert.ok(body.includes('Garaa Verify'), 'Must include Garaa Verify');
    assert.ok(body.includes('$29'), 'Must include $29');
    assert.ok(body.includes('Identity & Document Verification'), 'Must include Verify subtitle');
    assert.ok(body.includes('Verify identities, analyze documents, and identify potential document anomalies in one intelligent workspace.'), 'Must include Verify description');
    assert.ok(body.includes('AI-assisted document analysis'), 'Must include feature 1');
    assert.ok(body.includes('Potential document tampering indicators'), 'Must include feature 2');
    assert.ok(body.includes('Identity and document consistency checks'), 'Must include feature 3');
    assert.ok(body.includes('Verification reports'), 'Must include feature 4');
    assert.ok(body.includes('Supported identity checks where authorized data sources are available'), 'Must include feature 5');
    assert.ok(body.includes('onOpenScanner'), 'Must bind to onOpenScanner');
    console.log('✓ Garaa Verify card content & scanner link: PASS');

    // 4. Card 2 - Garaa Screen
    assert.ok(body.includes('Garaa Screen'), 'Must include Garaa Screen');
    assert.ok(body.includes('$99'), 'Must include $99');
    assert.ok(body.includes('Criminal Record Screening'), 'Must include Screen subtitle');
    assert.ok(body.includes('Go beyond identity verification with a dedicated screening solution designed to support more informed trust and safety decisions.'), 'Must include Screen description');
    assert.ok(body.includes('Authorized criminal-record screening'), 'Must include Screen feature 1');
    assert.ok(body.includes('Identity and record matching'), 'Must include Screen feature 2');
    assert.ok(body.includes('Source-linked findings where available'), 'Must include Screen feature 3');
    assert.ok(body.includes('Potential-match review'), 'Must include Screen feature 4');
    assert.ok(body.includes('Screening reports with clear, potential-match, or inconclusive statuses'), 'Must include Screen feature 5');
    assert.ok(body.includes('Separate monthly subscription'), 'Must state separate monthly subscription');
    console.log('✓ Garaa Screen card content & screening link: PASS');

    // 5. Card 3 - TraceX
    assert.ok(body.includes('TraceX'), 'Must include TraceX');
    assert.ok(body.includes('COMING SOON'), 'Must include COMING SOON badge');
    assert.ok(body.includes('Next-generation risk intelligence.'), 'Must include TraceX subtitle');
    assert.ok(body.includes('A new era of digital security is on the way. TraceX is being developed to help investigate suspicious digital activity, analyze potential risk signals, and support cybersecurity investigations.'), 'Must include TraceX description');
    assert.ok(body.includes('Suspicious-activity investigation'), 'Must include TraceX feature 1');
    assert.ok(body.includes('Digital risk intelligence'), 'Must include TraceX feature 2');
    assert.ok(body.includes('Potential threat indicators'), 'Must include TraceX feature 3');
    assert.ok(body.includes('Future integration opportunities with Garaa'), 'Must include TraceX feature 4');
    assert.ok(body.includes('Something powerful is coming — advanced security, designed to stay accessible.'), 'Must include brand message');
    assert.ok(body.includes('Stay Tuned'), 'Must include Stay Tuned CTA');
    console.log('✓ TraceX card content & placeholder: PASS');

    // 6. Pricing Footnote & Existing Disclaimer
    assert.ok(body.includes('Pricing and service availability are subject to usage limits, verification scope, authorized data-source availability, and applicable service charges.'), 'Must include pricing footnote');
    assert.ok(body.includes('DEMO BUILD · mock verification logic · no live government database access'), 'Must preserve demo disclaimer');
    console.log('✓ Footnote and demo disclaimer: PASS');

    // 7. Premium Hover Animation CSS
    assert.ok(body.includes('.zl-plan-card:hover{transform:scale(1.03)'), 'Must scale(1.03) on hover');
    assert.ok(body.includes('box-shadow:0 0 45px rgba(255,255,255,.95)'), 'Must have soft white glow');
    assert.ok(body.includes('transition:transform 300ms'), 'Must have smooth 300ms transition');
    console.log('✓ Premium Hover & Glow Animation CSS: PASS');

    console.log('ALL PRICING SECTION TESTS PASSED SUCCESSFULLY!');
  });
});
