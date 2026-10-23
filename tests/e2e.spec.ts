import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://timus16.github.io/Jist/';

interface TestResult {
  panel: string;
  flow: string;
  status: 'pass' | 'fail' | 'warn';
  details: string;
  errors: string[];
}

const results: TestResult[] = [];

function addResult(panel: string, flow: string, status: 'pass' | 'fail' | 'warn', details: string, errors: string[] = []) {
  results.push({ panel, flow, status, details, errors });
  const icon = status === 'pass' ? '?' : status === 'fail' ? '?' : '??';
  console.log(`${icon} [${panel}] ${flow}: ${details}`);
  if (errors.length) errors.forEach(e => console.log(`   Error: ${e}`));
}

async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(err.message); });
  await page.waitForTimeout(500);
  return errors;
}

async function checkNetworkFailures(page: Page): Promise<string[]> {
  const failures: string[] = [];
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.waitForTimeout(500);
  return failures;
}

test.describe('Jist PWA - Organizer Panel (Root)', () => {
  test('load page and verify title', async ({ page }) => {
    const errors = await checkConsoleErrors(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    const networkErrors = await checkNetworkFailures(page);
    const allErrors = [...errors, ...networkErrors];
    if (title === 'Jist' || title.includes('Jist')) {
      addResult('Organizer (Root)', 'Load & Title', 'pass', `Title: "${title}"`, allErrors);
    } else {
      addResult('Organizer (Root)', 'Load & Title', 'fail', `Expected "Jist", got "${title}"`, allErrors);
    }
  });
});

test.describe('Jist PWA - Organizer Panel (Root)', () => {
  test('verify bottom tab bar with 3 tabs', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const tabButtons = page.locator('button[role="tab"], a[role="tab"], .tab-button, [data-testid^="tab-"]');
    const tabCount = await tabButtons.count();
    const tabTexts: string[] = [];
    for (let i = 0; i < tabCount; i++) tabTexts.push(await tabButtons.nth(i).textContent() || '');
    const hasHome = tabTexts.some(t => t.toLowerCase().includes('home'));
    const hasNewMatch = tabTexts.some(t => t.toLowerCase().includes('new match') || t.toLowerCase().includes('newmatch'));
    const hasSettings = tabTexts.some(t => t.toLowerCase().includes('setting'));
    if (tabCount >= 3 && hasHome && hasNewMatch && hasSettings) {
      addResult('Organizer (Root)', 'Tab Bar', 'pass', `Found tabs: ${tabTexts.join(', ')}`, [...errors, ...networkErrors]);
    } else {
      addResult('Organizer (Root)', 'Tab Bar', 'fail', `Expected 3 tabs, found ${tabCount}: ${tabTexts.join(', ')}`, [...errors, ...networkErrors]);
    }
  });

  test('click New Match tab navigates to /match/new', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const newMatchTab = page.locator('button[role="tab"]:has-text("New Match"), a[role="tab"]:has-text("New Match"), [data-testid="tab-new-match"]').first();
    if (await newMatchTab.count() === 0) {
      const altTab = page.locator('text=New Match').first();
      if (await altTab.count() > 0) await altTab.click();
      else { addResult('Organizer (Root)', 'New Match Navigation', 'fail', 'New Match tab not found', [...errors, ...networkErrors]); return; }
    } else await newMatchTab.click();
    await page.waitForURL(/\/match\/new/, { timeout: 5000 }).catch(() => {});
    const url = page.url();
    if (url.includes('/match/new')) addResult('Organizer (Root)', 'New Match Navigation', 'pass', `Navigated to ${url}`, [...errors, ...networkErrors]);
    else addResult('Organizer (Root)', 'New Match Navigation', 'fail', `Expected /match/new, got ${url}`, [...errors, ...networkErrors]);
  });

  test('fill match creation form and submit', async ({ page }) => {
    await page.goto(`${BASE_URL}match/new`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    await page.waitForSelector('form, [data-testid="match-form"]', { timeout: 10000 }).catch(() => {});
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], #match-name').first();
    const teamAInput = page.locator('input[name="teamA"], input[placeholder*="team a" i], #team-a').first();
    const teamBInput = page.locator('input[name="teamB"], input[placeholder*="team b" i], #team-b').first();
    const oversInput = page.locator('input[name="overs"], input[type="number"], #overs').first();
    const groundSelect = page.locator('select[name="ground"], select[id*="ground"], [data-testid="ground-select"]').first();
    const timestamp = Date.now();
    const matchName = `Test Match ${timestamp}`;
    if (await nameInput.count() > 0) await nameInput.fill(matchName);
    if (await teamAInput.count() > 0) await teamAInput.fill('Team Alpha');
    if (await teamBInput.count() > 0) await teamBInput.fill('Team Beta');
    if (await oversInput.count() > 0) await oversInput.fill('10');
    if (await groundSelect.count() > 0) { const options = await groundSelect.locator('option').all(); if (options.length > 1) await groundSelect.selectOption({ index: 1 }); }
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Start")').first();
    if (await submitBtn.count() > 0) { await submitBtn.click(); await page.waitForTimeout(2000); }
    const url = page.url();
    const isScorer = url.includes('/scorer/') || (url.includes('/match/') && url.includes('/score'));
    if (isScorer) addResult('Organizer (Root)', 'Match Creation Form', 'pass', `Redirected to scorer: ${url}`, [...errors, ...networkErrors]);
    else addResult('Organizer (Root)', 'Match Creation Form', 'fail', `Expected scorer redirect, got ${url}`, [...errors, ...networkErrors]);
  });

  test('verify scorer panel loads with live scorecard', async ({ page }) => {
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const scorecard = page.locator('[data-testid="scorecard"], .scorecard, .live-score, text=/\d+/').first();
    const hasScorecard = await scorecard.count() > 0;
    if (hasScorecard) addResult('Organizer (Root)', 'Live Scorecard', 'pass', 'Scorecard visible', [...errors, ...networkErrors]);
    else addResult('Organizer (Root)', 'Live Scorecard', 'warn', 'Scorecard not clearly visible (may need match ID)', [...errors, ...networkErrors]);
  });
});

test.describe('Jist PWA - Scorer Panel', () => {
  test('load scorer page and verify title', async ({ page }) => {
    await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const title = await page.title();
    if (title.includes('Scorer') || title.includes('Jist')) addResult('Scorer', 'Load & Title', 'pass', `Title: "${title}"`, [...errors, ...networkErrors]);
    else addResult('Scorer', 'Load & Title', 'fail', `Expected "Jist Scorer", got "${title}"`, [...errors, ...networkErrors]);
  });

  test('auto-navigate to match scoring or show match list', async ({ page }) => {
    await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const matchList = page.locator('[data-testid="match-list"], .match-list, text=/select.*match/i, text=/no.*match/i').first();
    const scoringView = page.locator('[data-testid="scoring-view"], .scoring-panel, .ball-entry').first();
    const hasList = await matchList.count() > 0;
    const hasScoring = await scoringView.count() > 0;
    if (hasScoring) addResult('Scorer', 'Auto-navigate', 'pass', 'Shows scoring view directly', [...errors, ...networkErrors]);
    else if (hasList) addResult('Scorer', 'Auto-navigate', 'pass', 'Shows match list (no matchId in URL)', [...errors, ...networkErrors]);
    else addResult('Scorer', 'Auto-navigate', 'warn', 'Neither match list nor scoring view clearly detected', [...errors, ...networkErrors]);
  });

  test('test ball entry: scoring shots and extras', async ({ page }) => {
    await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const ballButtons = [
      { name: 'Dot', selectors: ['button:has-text("•")', 'button:has-text("Dot")', '[data-run="0"]'] },
      { name: '1', selectors: ['button:has-text("1")', '[data-run="1"]'] },
      { name: '2', selectors: ['button:has-text("2")', '[data-run="2"]'] },
      { name: '3', selectors: ['button:has-text("3")', '[data-run="3"]'] },
      { name: '4', selectors: ['button:has-text("4")', '[data-run="4"]'] },
      { name: '6', selectors: ['button:has-text("6")', '[data-run="6"]'] },
      { name: 'Wide', selectors: ['button:has-text("Wide")', '[data-extra="wide"]'] },
      { name: 'No Ball', selectors: ['button:has-text("No Ball")', '[data-extra="noball"]'] },
      { name: 'Bye', selectors: ['button:has-text("Bye")', '[data-extra="bye"]'] },
      { name: 'Leg Bye', selectors: ['button:has-text("Leg Bye")', '[data-extra="legbye"]'] },
      { name: 'Wicket', selectors: ['button:has-text("Wicket")', '[data-extra="wicket"]', 'button:has-text("W")'] },
    ];
    let foundButtons = 0;
    for (const btn of ballButtons) for (const sel of btn.selectors) { const el = page.locator(sel).first(); if (await el.count() > 0 && await el.isVisible()) { foundButtons++; break; } }
    if (foundButtons >= 8) addResult('Scorer', 'Ball Entry Buttons', 'pass', `Found ${foundButtons}/11 ball entry buttons`, [...errors, ...networkErrors]);
    else if (foundButtons > 0) addResult('Scorer', 'Ball Entry Buttons', 'warn', `Only found ${foundButtons}/11 ball entry buttons`, [...errors, ...networkErrors]);
    else addResult('Scorer', 'Ball Entry Buttons', 'fail', 'No ball entry buttons found (may need active match)', [...errors, ...networkErrors]);
  });

  test('test shot capture sheet for scoring shots', async ({ page }) => {
    await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const fourBtn = page.locator('button:has-text("4"), [data-run="4"]').first();
    const sixBtn = page.locator('button:has-text("6"), [data-run="6"]').first();
    let shotCaptureOpened = false, zoneSelectionWorked = false, shotTypeSelectionWorked = false;
    for (const btn of [fourBtn, sixBtn]) {
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click(); await page.waitForTimeout(1000);
        const shotSheet = page.locator('[data-testid="shot-capture"], .shot-capture, .shot-sheet, [role="dialog"]:has-text("shot" i)').first();
        if (await shotSheet.count() > 0 && await shotSheet.isVisible()) {
          shotCaptureOpened = true;
          const zones = page.locator('[data-zone], .zone, .field-zone, button[class*="zone"]').first();
          if (await zones.count() > 0) { await zones.click(); zoneSelectionWorked = true; }
          const shotTypes = page.locator('[data-shot-type], .shot-type, button:has-text("Drive"), button:has-text("Cut"), button:has-text("Pull")').first();
          if (await shotTypes.count() > 0) { await shotTypes.click(); shotTypeSelectionWorked = true; }
          const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Save"), button[type="submit"]').first();
          if (await confirmBtn.count() > 0) await confirmBtn.click();
        }
        break;
      }
    }
    if (shotCaptureOpened && zoneSelectionWorked && shotTypeSelectionWorked) addResult('Scorer', 'Shot Capture Sheet', 'pass', 'Opens, zone select, shot type select, confirm all work', [...errors, ...networkErrors]);
    else if (shotCaptureOpened) addResult('Scorer', 'Shot Capture Sheet', 'warn', `Opens but zone/shot selection incomplete (zone: ${zoneSelectionWorked}, shot: ${shotTypeSelectionWorked})`, [...errors, ...networkErrors]);
    else addResult('Scorer', 'Shot Capture Sheet', 'fail', 'Shot capture sheet did not open (may need active match with batter)', [...errors, ...networkErrors]);
  });

  test('verify delivery appears in recent overs and scorecard updates', async ({ page }) => {
    await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const recentOvers = page.locator('[data-testid="recent-overs"], .recent-overs, .overs-history, .ball-history').first();
    const scorecard = page.locator('[data-testid="scorecard"], .scorecard, .live-score').first();
    const hasOvers = await recentOvers.count() > 0;
    const hasScorecard = await scorecard.count() > 0;
    if (hasOvers && hasScorecard) addResult('Scorer', 'Score Updates', 'pass', 'Recent overs and scorecard present', [...errors, ...networkErrors]);
    else addResult('Scorer', 'Score Updates', 'warn', `Recent overs: ${hasOvers}, Scorecard: ${hasScorecard} (may need active match)`, [...errors, ...networkErrors]);
  });

  test('test match completion flow', async ({ page }) => {
    await page.goto(`${BASE_URL}scorer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const endButtons = page.locator('button:has-text("End"), button:has-text("Finish"), button:has-text("Complete"), [data-testid="end-match"]').first();
    const allOutBtn = page.locator('button:has-text("All Out"), [data-testid="all-out"]').first();
    const hasEnd = await endButtons.count() > 0;
    const hasAllOut = await allOutBtn.count() > 0;
    if (hasEnd || hasAllOut) addResult('Scorer', 'Match Completion', 'pass', `End match: ${hasEnd}, All out: ${hasAllOut}`, [...errors, ...networkErrors]);
    else addResult('Scorer', 'Match Completion', 'warn', 'Match completion controls not visible (may need active match)', [...errors, ...networkErrors]);
  });
});

test.describe('Jist PWA - Viewer Panel', () => {
  test('load viewer page and verify title', async ({ page }) => {
    await page.goto(`${BASE_URL}viewer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const title = await page.title();
    if (title.includes('Viewer') || title.includes('Jist')) addResult('Viewer', 'Load & Title', 'pass', `Title: "${title}"`, [...errors, ...networkErrors]);
    else addResult('Viewer', 'Load & Title', 'fail', `Expected "Jist Viewer", got "${title}"`, [...errors, ...networkErrors]);
  });

  test('show read-only scorecard and wagon wheel', async ({ page }) => {
    await page.goto(`${BASE_URL}viewer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const scorecard = page.locator('[data-testid="scorecard"], .scorecard, .viewer-scorecard').first();
    const wagonWheel = page.locator('[data-testid="wagon-wheel"], .wagon-wheel, .field-map, .shot-map, canvas').first();
    const ballEntry = page.locator('.ball-entry, [data-testid="ball-entry"], button:has-text("1"), button:has-text("4")').first();
    const shotCapture = page.locator('[data-testid="shot-capture"], .shot-capture').first();
    const hasScorecard = await scorecard.count() > 0;
    const hasWagonWheel = await wagonWheel.count() > 0;
    const hasNoBallEntry = await ballEntry.count() === 0;
    const hasNoShotCapture = await shotCapture.count() === 0;
    if (hasScorecard && hasWagonWheel && hasNoBallEntry && hasNoShotCapture) addResult('Viewer', 'Read-only UI', 'pass', 'Scorecard + wagon wheel present, no ball entry or shot capture', [...errors, ...networkErrors]);
    else { const issues = []; if (!hasScorecard) issues.push('missing scorecard'); if (!hasWagonWheel) issues.push('missing wagon wheel'); if (!hasNoBallEntry) issues.push('has ball entry (should not)'); if (!hasNoShotCapture) issues.push('has shot capture (should not)'); addResult('Viewer', 'Read-only UI', 'fail', `Issues: ${issues.join(', ')}`, [...errors, ...networkErrors]); }
  });
});

test.describe('Jist PWA - Organizer Panel (Explicit)', () => {
  test('load organizer.html and verify same flows as root', async ({ page }) => {
    await page.goto(`${BASE_URL}organizer.html`, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const title = await page.title();
    const hasTabs = await page.locator('button[role="tab"], a[role="tab"]').count() >= 3;
    if (title.includes('Jist') && hasTabs) addResult('Organizer (Explicit)', 'Load & Tabs', 'pass', `Title: "${title}", tabs present`, [...errors, ...networkErrors]);
    else addResult('Organizer (Explicit)', 'Load & Tabs', 'fail', `Title: "${title}", tabs: ${hasTabs}`, [...errors, ...networkErrors]);
  });
});

test.describe('PWA Installability & Performance', () => {
  test('check manifest and service worker', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const errors = await checkConsoleErrors(page);
    const networkErrors = await checkNetworkFailures(page);
    const manifestLink = page.locator('link[rel="manifest"]').first();
    const hasManifest = await manifestLink.count() > 0;
    const swRegistered = await page.evaluate(async () => { if ('serviceWorker' in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); return regs.length > 0; } return false; });
    const isInstallable = await page.evaluate(() => !!(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone));
    if (hasManifest && swRegistered) addResult('PWA', 'Installability', 'pass', `Manifest: ${hasManifest}, SW: ${swRegistered}, Installed: ${isInstallable}`, [...errors, ...networkErrors]);
    else addResult('PWA', 'Installability', 'warn', `Manifest: ${hasManifest}, SW: ${swRegistered}, Installed: ${isInstallable}`, [...errors, ...networkErrors]);
  });

  test('performance: load time and core web vitals', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    const metrics = await page.evaluate(() => new Promise(resolve => { let result: any = {}; let done = false; const checkDone = () => { if (!done) { done = true; resolve(result); } }; try { new PerformanceObserver(list => { const entries = list.getEntries(); const cls = entries.find(e => e.entryType === 'layout-shift'); if (cls) result.cls = cls.value; checkDone(); }).observe({ type: 'layout-shift', buffered: true }); } catch {} try { new PerformanceObserver(list => { const entries = list.getEntries(); const fid = entries.find(e => e.entryType === 'first-input'); if (fid) result.fid = fid.processingStart; checkDone(); }).observe({ type: 'first-input', buffered: true }); } catch {} try { new PerformanceObserver(list => { const entries = list.getEntries(); const lcp = entries[entries.length - 1]; if (lcp) result.lcp = lcp.startTime; checkDone(); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {} setTimeout(checkDone, 2000); }));
    const perfStatus = loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warn' : 'fail';
    addResult('PWA', 'Performance', perfStatus, `Load: ${loadTime}ms, LCP: ${metrics.lcp || 'N/A'}ms, CLS: ${metrics.cls || 'N/A'}`, []);
  });
});

test.afterAll(async () => {
  console.log('\n========== TEST REPORT ==========\n');
  const byPanel: Record<string, TestResult[]> = {};
  results.forEach(r => { if (!byPanel[r.panel]) byPanel[r.panel] = []; byPanel[r.panel].push(r); });
  for (const [panel, tests] of Object.entries(byPanel)) { console.log(`\n## ${panel}`); tests.forEach(t => { const icon = t.status === 'pass' ? 'PASS' : t.status === 'fail' ? 'FAIL' : 'WARN'; console.log(`  ${icon} ${t.flow}: ${t.details}`); t.errors.forEach(e => console.log(`     - ${e}`)); }); }
  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const warn = results.filter(r => r.status === 'warn').length;
  console.log(`\n========== SUMMARY ==========`); console.log(`PASS: ${pass}`); console.log(`WARN: ${warn}`); console.log(`FAIL: ${fail}`); console.log(`Total: ${results.length}`);
  console.log(`\n========== PRIORITIZED ISSUES ==========`); const failed = results.filter(r => r.status === 'fail'); const warned = results.filter(r => r.status === 'warn'); if (failed.length) { console.log('\nCRITICAL (Broken):'); failed.forEach((r, i) => console.log(`  ${i+1}. [${r.panel}] ${r.flow}: ${r.details}`)); } if (warned.length) { console.log('\nHIGH (Missing/Incomplete):'); warned.forEach((r, i) => console.log(`  ${i+1}. [${r.panel}] ${r.flow}: ${r.details}`)); }
  console.log(`\n========== ROADMAP GAPS ==========`); console.log('P1 - Tap-to-zone shot capture: Tested in Scorer > Shot Capture Sheet'); console.log('P2 - ArUco marker detection: Not tested (requires camera access)'); console.log('P3 - Supabase sync: Not tested (requires backend)'); console.log('P4 - Multi-device realtime: Not tested');
  const fs = require('fs');
  fs.writeFileSync('test-report.json', JSON.stringify({ timestamp: new Date().toISOString(), baseUrl: BASE_URL, summary: { pass, fail, warn, total: results.length }, results, roadmapGaps: ['P1 - Tap-to-zone shot capture', 'P2 - ArUco marker detection', 'P3 - Supabase sync', 'P4 - Multi-device realtime'] }, null, 2));
  console.log('\nFull JSON report saved to test-report.json');
});
