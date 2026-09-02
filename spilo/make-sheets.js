/* Build one printable QR sign per open house address.
 *
 *   node spilo/make-sheets.js addresses.txt
 *   node spilo/make-sheets.js "1234 W Main St, Boise" "5678 N Oak Ave, Eagle"
 *
 * One address per line in the file. Blank lines and lines starting with #
 * are ignored. Writes to spilo/sheets/:
 *   - one HTML file per address, named after the address
 *   - all-sheets.html, every sign in one file, one per page, print once
 *
 * The address never appears on the printed sign. It rides in the QR only,
 * so the lead lands tagged with the right property in /leads. The filename
 * is how you tell the sheets apart.
 */
const fs = require('fs');
const path = require('path');
const qrMatrix = require('./qr-encoder.js');

const SITE = 'https://spilo.xyz';
const OUT = path.join(__dirname, 'sheets');

/* ---------- gather addresses ---------- */
const args = process.argv.slice(2);
if (!args.length) {
  console.error('Give me a file of addresses, or the addresses themselves.\n');
  console.error('  node spilo/make-sheets.js addresses.txt');
  console.error('  node spilo/make-sheets.js "1234 W Main St, Boise"');
  process.exit(1);
}

let addresses = [];
if (args.length === 1 && fs.existsSync(args[0]) && fs.statSync(args[0]).isFile()) {
  addresses = fs.readFileSync(args[0], 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
} else {
  addresses = args.map((a) => a.trim()).filter(Boolean);
}

if (!addresses.length) {
  console.error('No addresses found.');
  process.exit(1);
}

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
}

function qrSvg(url, cls) {
  const q = qrMatrix(url);
  const quiet = 4;
  const dim = q.size + quiet * 2;
  let d = '';
  for (let r = 0; r < q.size; r++) {
    for (let c = 0; c < q.size; c++) {
      if (q.modules[r][c]) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return `<svg class="${cls}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" aria-label="QR code to the sign in sheet"><rect width="${dim}" height="${dim}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}

const STYLE = `
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    font-family:"Archivo","Segoe UI",system-ui,-apple-system,sans-serif;
    color:#22252c;background:#fff;-webkit-font-smoothing:antialiased;
  }
  .sheet{
    width:100%;max-width:760px;margin:0 auto;padding:56px 40px;text-align:center;
    display:flex;flex-direction:column;justify-content:center;min-height:100vh;
  }
  .kicker{
    font-size:13px;letter-spacing:.24em;text-transform:uppercase;
    color:#8a6d29;font-weight:700;margin:0;
  }
  h1{
    font-family:"Italiana","Didot","Bodoni MT",serif;font-weight:400;
    font-size:72px;line-height:1.02;margin:14px 0 0;letter-spacing:.012em;
  }
  .qr{display:block;width:340px;height:340px;margin:38px auto 0}
  .help{font-size:19px;color:#5a5f6b;margin:26px 0 0}
  .foot{
    margin:44px auto 0;padding-top:20px;border-top:1px solid #e2e0da;
    font-size:14px;line-height:1.65;color:#5a5f6b;max-width:420px;
  }
  .foot strong{color:#22252c;font-size:16px}
  /* US Letter, portrait. margin 0 on the page box is what stops the browser
     printing its own header and footer (date, page title, URL) into the
     margin area. The half inch of breathing room comes back as padding on
     the sheet itself. */
  @page{size:Letter portrait;margin:0}

  @media print{
    html,body{margin:0;padding:0;background:#fff}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .sheet{
      width:8.5in;max-width:8.5in;
      /* Just under the 11in page height, so rounding cannot push a blank
         page out after each sheet. */
      height:10.9in;min-height:0;
      margin:0;padding:0.5in;
      display:flex;flex-direction:column;justify-content:center;
      break-after:page;page-break-after:always;
    }
    .sheet:last-child{break-after:auto;page-break-after:auto}
    .kicker{font-size:11pt}
    h1{font-size:52pt;margin-top:0.12in}
    .qr{width:3.4in;height:3.4in;margin:0.5in auto 0}
    .help{font-size:14pt;margin-top:0.3in}
    .foot{margin-top:0.5in;padding-top:0.2in;font-size:10.5pt;max-width:4.6in}
  }
`;

function sheetMarkup(url) {
  return `<section class="sheet">
  <p class="kicker">Open House</p>
  <h1>Sign in here.</h1>
  ${qrSvg(url, 'qr')}
  <p class="help">Point your phone camera at the code.</p>
  <p class="foot">
    <strong>John Spilotros</strong><br>
    Keller Williams Realty Boise &middot; (215) 859-3267<br>
    Licensed Idaho Salesperson #1681619
  </p>
</section>`;
}

function page(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Italiana&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

/* ---------- write ---------- */
fs.mkdirSync(OUT, { recursive: true });

const all = [];
for (const address of addresses) {
  const url = SITE + '/signin?p=' + encodeURIComponent(address);
  const file = path.join(OUT, slug(address) + '.html');
  /* The title carries the address so the browser tab and the print header
     tell you which sheet this is. The sign itself stays anonymous. */
  fs.writeFileSync(file, page(address, sheetMarkup(url)));
  all.push(sheetMarkup(url));
  console.log(path.relative(process.cwd(), file));
  console.log('   -> ' + url);
}

const allFile = path.join(OUT, 'all-sheets.html');
fs.writeFileSync(allFile, page('All open house sheets', all.join('\n')));
console.log('\n' + path.relative(process.cwd(), allFile) + '  (' + addresses.length + ' sheets, one per page)');
console.log('Open it and print. Each address prints on its own page.');
