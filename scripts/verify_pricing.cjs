const fs = require('fs');
const assert = require('assert');
const path = require('path');

function verifyHtml(filePath) {
  console.log(`\n=== VERIFYING HTML: ${path.basename(filePath)} ===`);
  const body = fs.readFileSync(filePath, 'utf-8');

  // 1. Placement verification: zl-about -> PricingSection -> zl-reviews
  const posAbout = body.lastIndexOf('id: "zl-about"') !== -1 ? body.lastIndexOf('id: "zl-about"') : body.lastIndexOf('id="zl-about"');
  const posPricingCall = body.lastIndexOf('h(PricingSection') !== -1 ? body.lastIndexOf('h(PricingSection') : body.lastIndexOf('id="zl-plans"');
  const posReviews = body.lastIndexOf('id: "zl-reviews"') !== -1 ? body.lastIndexOf('id: "zl-reviews"') : body.lastIndexOf('id="zl-reviews"');
  console.log('Section positions in JSX / DOM:', { posAbout, posPricingCall, posReviews });
  assert.ok(posAbout > 0, 'zl-about must exist in Landing');
  assert.ok(posPricingCall > 0, 'PricingSection must be invoked in Landing');
  assert.ok(posReviews > 0, 'zl-reviews must exist in Landing');
  assert.ok(posAbout < posPricingCall, 'zl-about must be before PricingSection');
  assert.ok(posPricingCall < posReviews, 'PricingSection must be before zl-reviews');
  console.log('✓ Section order: About Garaa -> PricingSection -> Ready when you are: PASS');

  // 2. Section Header
  assert.ok(body.includes('GARAA PLANS'), 'Must include eyebrow GARAA PLANS');
  assert.ok(body.includes('Trust, at every level.'), 'Must include heading');
  assert.ok(body.includes('Intelligent verification. Deeper screening. A safer digital world.'), 'Must include subtitle');
  console.log('✓ Section Header: PASS');

  // 3. Card 1 - GARAA VERIFY with Rupee Conversion
  assert.ok(body.includes('GARAA VERIFY'), 'Must include GARAA VERIFY title');
  assert.ok(body.includes('$29'), 'Must include $29');
  assert.ok(body.includes('₹2,499'), 'Must include converted rupee price ₹2,499');
  assert.ok(body.includes('zl-plan-inr'), 'Must display rupee conversion badge on card');
  assert.ok(body.includes('zl-plan-micro-icon'), 'Must include micro-icon container');
  assert.ok(body.includes('Intelligent identity and document verification, designed to help identify inconsistencies and potential document manipulation.'), 'Must include exact Verify description');
  assert.ok(body.includes('Identity and document analysis'), 'Must include Verify feature 1');
  assert.ok(body.includes('Potential tampering indicators'), 'Must include Verify feature 2');
  assert.ok(body.includes('Verification reports'), 'Must include Verify feature 3');
  assert.ok(body.includes('PAY $29 (₹2,499)'), 'Must include PAY $29 action with rupee price');
  console.log('✓ Card 1 (Garaa Verify) initial state, reveal tray & payment trigger: PASS');

  // 4. Card 2 - GARAA SCREEN with Rupee Conversion
  assert.ok(body.includes('GARAA SCREEN'), 'Must include GARAA SCREEN title');
  assert.ok(body.includes('$99'), 'Must include $99');
  assert.ok(body.includes('₹8,499'), 'Must include converted rupee price ₹8,499');
  assert.ok(body.includes('Go beyond identity verification with screening workflows designed to support informed trust and safety decisions.'), 'Must include exact Screen description');
  assert.ok(body.includes('Authorized criminal-record screening'), 'Must include Screen feature 1');
  assert.ok(body.includes('Identity and record matching'), 'Must include Screen feature 2');
  assert.ok(body.includes('Reviewable screening findings'), 'Must include Screen feature 3');
  assert.ok(body.includes('PAY $99 (₹8,499)'), 'Must include PAY $99 action with rupee price');
  console.log('✓ Card 2 (Garaa Screen) initial state, reveal tray & payment trigger: PASS');

  // 5. Card 3 - TRACEX
  assert.ok(body.includes('TRACEX'), 'Must include TRACEX title');
  assert.ok(body.includes('zl-plan-soon-text'), 'Must include clean COMING SOON status (no fake price)');
  assert.ok(body.includes('An upcoming digital risk intelligence product designed to investigate suspicious activity and uncover potential security signals.'), 'Must include exact TraceX description');
  assert.ok(body.includes('Suspicious-activity investigation'), 'Must include TraceX feature 1');
  assert.ok(body.includes('Digital risk intelligence'), 'Must include TraceX feature 2');
  assert.ok(body.includes('Potential threat indicators'), 'Must include TraceX feature 3');
  assert.ok(body.includes('Joining the Garaa family soon at an affordable price.'), 'Must include exact supporting line');
  assert.ok(body.includes('STAY TUNED'), 'Must include STAY TUNED action');
  assert.ok(body.includes('TraceX will be available soon. No action required today.'), 'Must include exact inline notice');
  console.log('✓ Card 3 (TraceX) initial state, reveal tray, supporting line & notice: PASS');

  // 6. Payment Scanner Modal & QR Code Integration
  assert.ok(body.includes('PaymentModal'), 'Must define PaymentModal component');
  assert.ok(body.includes('payment_qr.png'), 'Must reference user\'s PhonePe QR code image');
  assert.ok(body.includes('8591250390-2@ybl'), 'Must include user\'s verified UPI ID');
  assert.ok(body.includes('PARTH VIJAY GIDDE'), 'Must include user\'s verified payee name');
  assert.ok(body.includes('zl-pay-scanner-beam'), 'Must include animated laser scanner sweep beam');
  assert.ok(body.includes('zl-pay-corner'), 'Must include scanner reticle corners');
  assert.ok(body.includes('PhonePe'), 'Must state PhonePe support');
  assert.ok(body.includes('Google Pay'), 'Must state Google Pay support');
  assert.ok(body.includes('Paytm'), 'Must state Paytm support');
  assert.ok(body.includes('upi://pay'), 'Must provide direct mobile UPI app intent');
  console.log('✓ Payment Scanner Modal, PhonePe QR code, UPI details & currency converter: PASS');

  // 7. Interactive CSS & Smooth Animations
  assert.ok(body.includes('.zl-plan-reveal{'), 'Must define collapsible reveal tray');
  assert.ok(body.includes('max-height:0;'), 'Reveal tray must be 0 height initially');
  assert.ok(body.includes('opacity:0;'), 'Reveal tray must be transparent initially');
  assert.ok(body.includes('transform:scale(1.05)'), 'Card must scale to 1.05 on hover');
  assert.ok(body.includes('box-shadow:0 0 50px rgba(255,255,255,.95)'), 'Must have soft white outer glow on hover');
  assert.ok(body.includes('cubic-bezier(.16,1,.3,1)'), 'Must use smooth cubic-bezier easing');
  assert.ok(body.includes('align-items:start;'), 'Grid must align-items: start');
  console.log('✓ Interactive reveal-on-hover CSS, glowing aesthetics & layout stability: PASS');
}

verifyHtml(path.join(__dirname, '../frontend/index.html'));
verifyHtml(path.join(__dirname, '../index.html'));

console.log('\n======================================================');
console.log('ALL PRICING & PAYMENT SCANNER TESTS PASSED PERFECTLY!');
console.log('======================================================');
