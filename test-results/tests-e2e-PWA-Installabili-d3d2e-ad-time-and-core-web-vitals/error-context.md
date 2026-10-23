# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> PWA Installability & Performance >> performance: load time and core web vitals
- Location: tests\e2e.spec.ts:274:3

# Error details

```
ReferenceError: require is not defined
```

# Test source

```ts
  195 |   });
  196 | 
  197 |   test('verify delivery appears in recent overs and scorecard updates', async ({ page }) => {
  198 |     await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
  199 |     const errors = await checkConsoleErrors(page);
  200 |     const networkErrors = await checkNetworkFailures(page);
  201 |     const recentOvers = page.locator('[data-testid="recent-overs"], .recent-overs, .overs-history, .ball-history').first();
  202 |     const scorecard = page.locator('[data-testid="scorecard"], .scorecard, .live-score').first();
  203 |     const hasOvers = await recentOvers.count() > 0;
  204 |     const hasScorecard = await scorecard.count() > 0;
  205 |     if (hasOvers && hasScorecard) addResult('Scorer', 'Score Updates', 'pass', 'Recent overs and scorecard present', [...errors, ...networkErrors]);
  206 |     else addResult('Scorer', 'Score Updates', 'warn', `Recent overs: ${hasOvers}, Scorecard: ${hasScorecard} (may need active match)`, [...errors, ...networkErrors]);
  207 |   });
  208 | 
  209 |   test('test match completion flow', async ({ page }) => {
  210 |     await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
  211 |     const errors = await checkConsoleErrors(page);
  212 |     const networkErrors = await checkNetworkFailures(page);
  213 |     const endButtons = page.locator('button:has-text("End"), button:has-text("Finish"), button:has-text("Complete"), [data-testid="end-match"]').first();
  214 |     const allOutBtn = page.locator('button:has-text("All Out"), [data-testid="all-out"]').first();
  215 |     const hasEnd = await endButtons.count() > 0;
  216 |     const hasAllOut = await allOutBtn.count() > 0;
  217 |     if (hasEnd || hasAllOut) addResult('Scorer', 'Match Completion', 'pass', `End match: ${hasEnd}, All out: ${hasAllOut}`, [...errors, ...networkErrors]);
  218 |     else addResult('Scorer', 'Match Completion', 'warn', 'Match completion controls not visible (may need active match)', [...errors, ...networkErrors]);
  219 |   });
  220 | });
  221 | 
  222 | test.describe('Jist PWA - Viewer Panel', () => {
  223 |   test('load viewer page and verify title', async ({ page }) => {
  224 |     await page.goto(`${BASE_URL}viewer.html`, { waitUntil: 'networkidle' });
  225 |     const errors = await checkConsoleErrors(page);
  226 |     const networkErrors = await checkNetworkFailures(page);
  227 |     const title = await page.title();
  228 |     if (title.includes('Viewer') || title.includes('Jist')) addResult('Viewer', 'Load & Title', 'pass', `Title: "${title}"`, [...errors, ...networkErrors]);
  229 |     else addResult('Viewer', 'Load & Title', 'fail', `Expected "Jist Viewer", got "${title}"`, [...errors, ...networkErrors]);
  230 |   });
  231 | 
  232 |   test('show read-only scorecard and wagon wheel', async ({ page }) => {
  233 |     await page.goto(`${BASE_URL}viewer.html`, { waitUntil: 'networkidle' });
  234 |     const errors = await checkConsoleErrors(page);
  235 |     const networkErrors = await checkNetworkFailures(page);
  236 |     const scorecard = page.locator('[data-testid="scorecard"], .scorecard, .viewer-scorecard').first();
  237 |     const wagonWheel = page.locator('[data-testid="wagon-wheel"], .wagon-wheel, .field-map, .shot-map, canvas').first();
  238 |     const ballEntry = page.locator('.ball-entry, [data-testid="ball-entry"], button:has-text("1"), button:has-text("4")').first();
  239 |     const shotCapture = page.locator('[data-testid="shot-capture"], .shot-capture').first();
  240 |     const hasScorecard = await scorecard.count() > 0;
  241 |     const hasWagonWheel = await wagonWheel.count() > 0;
  242 |     const hasNoBallEntry = await ballEntry.count() === 0;
  243 |     const hasNoShotCapture = await shotCapture.count() === 0;
  244 |     if (hasScorecard && hasWagonWheel && hasNoBallEntry && hasNoShotCapture) addResult('Viewer', 'Read-only UI', 'pass', 'Scorecard + wagon wheel present, no ball entry or shot capture', [...errors, ...networkErrors]);
  245 |     else { const issues = []; if (!hasScorecard) issues.push('missing scorecard'); if (!hasWagonWheel) issues.push('missing wagon wheel'); if (!hasNoBallEntry) issues.push('has ball entry (should not)'); if (!hasNoShotCapture) issues.push('has shot capture (should not)'); addResult('Viewer', 'Read-only UI', 'fail', `Issues: ${issues.join(', ')}`, [...errors, ...networkErrors]); }
  246 |   });
  247 | });
  248 | 
  249 | test.describe('Jist PWA - Organizer Panel (Explicit)', () => {
  250 |   test('load organizer.html and verify same flows as root', async ({ page }) => {
  251 |     await page.goto(`${BASE_URL}organizer.html`, { waitUntil: 'networkidle' });
  252 |     const errors = await checkConsoleErrors(page);
  253 |     const networkErrors = await checkNetworkFailures(page);
  254 |     const title = await page.title();
  255 |     const hasTabs = await page.locator('button[role="tab"], a[role="tab"]').count() >= 3;
  256 |     if (title.includes('Jist') && hasTabs) addResult('Organizer (Explicit)', 'Load & Tabs', 'pass', `Title: "${title}", tabs present`, [...errors, ...networkErrors]);
  257 |     else addResult('Organizer (Explicit)', 'Load & Tabs', 'fail', `Title: "${title}", tabs: ${hasTabs}`, [...errors, ...networkErrors]);
  258 |   });
  259 | });
  260 | 
  261 | test.describe('PWA Installability & Performance', () => {
  262 |   test('check manifest and service worker', async ({ page }) => {
  263 |     await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  264 |     const errors = await checkConsoleErrors(page);
  265 |     const networkErrors = await checkNetworkFailures(page);
  266 |     const manifestLink = page.locator('link[rel="manifest"]').first();
  267 |     const hasManifest = await manifestLink.count() > 0;
  268 |     const swRegistered = await page.evaluate(async () => { if ('serviceWorker' in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); return regs.length > 0; } return false; });
  269 |     const isInstallable = await page.evaluate(() => !!(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone));
  270 |     if (hasManifest && swRegistered) addResult('PWA', 'Installability', 'pass', `Manifest: ${hasManifest}, SW: ${swRegistered}, Installed: ${isInstallable}`, [...errors, ...networkErrors]);
  271 |     else addResult('PWA', 'Installability', 'warn', `Manifest: ${hasManifest}, SW: ${swRegistered}, Installed: ${isInstallable}`, [...errors, ...networkErrors]);
  272 |   });
  273 | 
  274 |   test('performance: load time and core web vitals', async ({ page }) => {
  275 |     const startTime = Date.now();
  276 |     await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  277 |     const loadTime = Date.now() - startTime;
  278 |     const metrics = await page.evaluate(() => new Promise(resolve => { let result: any = {}; let done = false; const checkDone = () => { if (!done) { done = true; resolve(result); } }; try { new PerformanceObserver(list => { const entries = list.getEntries(); const cls = entries.find(e => e.entryType === 'layout-shift'); if (cls) result.cls = cls.value; checkDone(); }).observe({ type: 'layout-shift', buffered: true }); } catch {} try { new PerformanceObserver(list => { const entries = list.getEntries(); const fid = entries.find(e => e.entryType === 'first-input'); if (fid) result.fid = fid.processingStart; checkDone(); }).observe({ type: 'first-input', buffered: true }); } catch {} try { new PerformanceObserver(list => { const entries = list.getEntries(); const lcp = entries[entries.length - 1]; if (lcp) result.lcp = lcp.startTime; checkDone(); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {} setTimeout(checkDone, 2000); }));
  279 |     const perfStatus = loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warn' : 'fail';
  280 |     addResult('PWA', 'Performance', perfStatus, `Load: ${loadTime}ms, LCP: ${metrics.lcp || 'N/A'}ms, CLS: ${metrics.cls || 'N/A'}`, []);
  281 |   });
  282 | });
  283 | 
  284 | test.afterAll(async () => {
  285 |   console.log('\n========== TEST REPORT ==========\n');
  286 |   const byPanel: Record<string, TestResult[]> = {};
  287 |   results.forEach(r => { if (!byPanel[r.panel]) byPanel[r.panel] = []; byPanel[r.panel].push(r); });
  288 |   for (const [panel, tests] of Object.entries(byPanel)) { console.log(`\n## ${panel}`); tests.forEach(t => { const icon = t.status === 'pass' ? 'PASS' : t.status === 'fail' ? 'FAIL' : 'WARN'; console.log(`  ${icon} ${t.flow}: ${t.details}`); t.errors.forEach(e => console.log(`     - ${e}`)); }); }
  289 |   const pass = results.filter(r => r.status === 'pass').length;
  290 |   const fail = results.filter(r => r.status === 'fail').length;
  291 |   const warn = results.filter(r => r.status === 'warn').length;
  292 |   console.log(`\n========== SUMMARY ==========`); console.log(`PASS: ${pass}`); console.log(`WARN: ${warn}`); console.log(`FAIL: ${fail}`); console.log(`Total: ${results.length}`);
  293 |   console.log(`\n========== PRIORITIZED ISSUES ==========`); const failed = results.filter(r => r.status === 'fail'); const warned = results.filter(r => r.status === 'warn'); if (failed.length) { console.log('\nCRITICAL (Broken):'); failed.forEach((r, i) => console.log(`  ${i+1}. [${r.panel}] ${r.flow}: ${r.details}`)); } if (warned.length) { console.log('\nHIGH (Missing/Incomplete):'); warned.forEach((r, i) => console.log(`  ${i+1}. [${r.panel}] ${r.flow}: ${r.details}`)); }
  294 |   console.log(`\n========== ROADMAP GAPS ==========`); console.log('P1 - Tap-to-zone shot capture: Tested in Scorer > Shot Capture Sheet'); console.log('P2 - ArUco marker detection: Not tested (requires camera access)'); console.log('P3 - Supabase sync: Not tested (requires backend)'); console.log('P4 - Multi-device realtime: Not tested');
> 295 |   const fs = require('fs');
      |              ^ ReferenceError: require is not defined
  296 |   fs.writeFileSync('test-report.json', JSON.stringify({ timestamp: new Date().toISOString(), baseUrl: BASE_URL, summary: { pass, fail, warn, total: results.length }, results, roadmapGaps: ['P1 - Tap-to-zone shot capture', 'P2 - ArUco marker detection', 'P3 - Supabase sync', 'P4 - Multi-device realtime'] }, null, 2));
  297 |   console.log('\nFull JSON report saved to test-report.json');
  298 | });
  299 | 
```