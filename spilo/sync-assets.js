/* Point the standalone spilo pages at the site's CURRENT built assets.
 *
 *   node spilo/sync-assets.js
 *
 * Why this exists.
 *
 * /signin, /admin and /dashboard are hand written pages that live outside the
 * React app, but they borrow the site's stylesheet, and /admin loads the React
 * bundle itself. Both are referenced by their exact built filename, which Vite
 * fingerprints with a content hash. Every time styles.css or any component
 * changes, that hash changes, the old file stops existing, and those three
 * pages silently lose their stylesheet the moment the site is deployed.
 *
 * That matters most for /signin, which is what the two printed open house QR
 * codes point at. Those signs cannot be reprinted, so an unstyled sign in
 * sheet is not a cosmetic problem.
 *
 * Run this after `npm run build` and before deploying. deploy-crm-to-spilo.bat
 * already calls it.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const builtIndex = path.join(root, 'john-spilotros-realtor-react', 'dist', 'index.html');

if (!fs.existsSync(builtIndex)) {
  console.error('No build found at ' + builtIndex);
  console.error('Run "npm run build" in john-spilotros-realtor-react first.');
  process.exit(1);
}

const html = fs.readFileSync(builtIndex, 'utf8');
const css = (html.match(/\/assets\/index-[A-Za-z0-9_-]+\.css/) || [])[0];
const js = (html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];

if (!css || !js) {
  console.error('Could not read the asset names out of the build. Nothing changed.');
  console.error('  css: ' + css + '\n  js:  ' + js);
  process.exit(1);
}

console.log('Current build uses:');
console.log('  ' + css);
console.log('  ' + js);
console.log('');

const targets = [
  'signin/index.html',
  'admin/index.html',
  'dashboard.template.html'
];

let changed = 0;

targets.forEach(function (rel) {
  const file = path.join(__dirname, rel);
  if (!fs.existsSync(file)) {
    console.log('skipped ' + rel + ' (not found)');
    return;
  }

  const before = fs.readFileSync(file, 'utf8');
  const after = before
    .replace(/\/assets\/index-[A-Za-z0-9_-]+\.css/g, css)
    .replace(/\/assets\/index-[A-Za-z0-9_-]+\.js/g, js);

  if (after === before) {
    console.log('already current: ' + rel);
    return;
  }

  fs.writeFileSync(file, after);
  changed++;
  console.log('updated: ' + rel);
});

if (changed) {
  console.log('');
  console.log(changed + ' page(s) repointed. Run "node spilo/build-dashboard.js" so');
  console.log('dashboard/index.html picks up the new stylesheet too.');
} else {
  console.log('');
  console.log('Nothing needed changing.');
}
