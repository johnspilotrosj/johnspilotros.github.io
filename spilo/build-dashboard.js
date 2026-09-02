/* Assemble dashboard/index.html from the template plus the QR encoder.
 * The encoder is single-sourced from qr-encoder.js, the exact file that was
 * verified against a reference encoder and decoded back with jsqr, so the
 * dashboard cannot drift from the version that was tested.
 *
 *   node spilo/build-dashboard.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const template = fs.readFileSync(path.join(dir, 'dashboard.template.html'), 'utf8');
const encoder = fs.readFileSync(path.join(dir, 'qr-encoder.js'), 'utf8');

const MARK = '/*__QR_ENCODER__*/';
if (!template.includes(MARK)) throw new Error('placeholder ' + MARK + ' missing from the template');
if (/<\/script>/i.test(encoder)) throw new Error('encoder contains a closing script tag, it cannot be inlined as is');

/* The UMD wrapper assigns to the global when there is no module system,
   so inlining it defines window.qrMatrix for the page. */
const out = template.replace(MARK, encoder.trimEnd());

fs.mkdirSync(path.join(dir, 'dashboard'), { recursive: true });
fs.writeFileSync(path.join(dir, 'dashboard', 'index.html'), out);

console.log('spilo/dashboard/index.html written,', out.length, 'bytes');
console.log('encoder inlined:', encoder.length, 'bytes');
