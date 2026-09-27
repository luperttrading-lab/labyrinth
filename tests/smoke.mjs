// Rauchtest im Browser: Neigung simulieren, Wand, Loch, Ziel.
// Aufruf: node tests/smoke.mjs [url]   (Seite muss per HTTP ausgeliefert werden)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');

const url = process.argv[2] || 'http://localhost:8765/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url);
await p.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + '/menu.png' : '/dev/null' });
await p.click('.lvl >> nth=0');
await p.click('#startBtn');
const tiltTo = (beta, gamma) => p.evaluate(([b, g]) =>
  window.dispatchEvent(Object.assign(new Event('deviceorientation'), { beta: b, gamma: g })), [beta, gamma]);
await tiltTo(0, 0);
await p.waitForTimeout(400);                       // Kalibrierung auf flach
const pos = () => p.evaluate(() => ({ x: ball.x, y: ball.y, falls, running, finished }));
let ok = true;
const check = (name, cond, v) => { console.log((cond ? 'ok     ' : 'FEHLER ') + name, JSON.stringify(v)); ok &&= cond; };

check('liegt still bei flacher Haltung', true, await pos());
const p0 = await pos(); await p.waitForTimeout(500);
const p1 = await pos();
check('kein Drift ohne Neigung', Math.hypot(p1.x - p0.x, p1.y - p0.y) < 0.01, p1);

await tiltTo(0, 12);                                // nach rechts kippen
let q, maxX = 0;
for (let i = 0; i < 40; i++) { await p.waitForTimeout(100); q = await pos(); maxX = Math.max(maxX, q.x); }
check('rollt nach rechts, prallt an der Wand ab', maxX > 9.6 && maxX <= 9.71 && Math.abs(q.y - 1.5) < 0.05, { maxX, ...q });

await tiltTo(12, 0); await p.waitForTimeout(1500);   // Oberkante hoch → nach unten
q = await pos();
check('rollt nach unten bis Wand in Zeile 6', q.y > 5.6 && q.y <= 5.71, q);

// Loch: Kugel direkt neben Loch (3.5, 5.5) setzen und hineinkippen
await p.evaluate(() => { ball.x = 3.5; ball.y = 4.7; ball.vx = ball.vy = 0; });
await tiltTo(10, 0); await p.waitForTimeout(1200);
q = await pos();
check('fällt ins Loch und startet neu', q.falls === 1 && Math.abs(q.x - 1.5) < 0.3 && Math.abs(q.y - 1.5) < 0.3, q);

// Ziel
await tiltTo(0, 0);
await p.evaluate(() => { ball.x = 9.5; ball.y = 14.8; ball.vx = ball.vy = 0; });
await tiltTo(10, 0); await p.waitForTimeout(1200);
q = await pos();
const winVisible = await p.isVisible('#ovWin');
check('Ziel erreicht, Gewinn-Dialog', q.finished && winVisible, q);
if (process.env.SHOT_DIR) {
  await p.click('#retryBtn'); await p.click('#startBtn'); await tiltTo(0, 0); await p.waitForTimeout(300);
  await tiltTo(8, 10); await p.waitForTimeout(700);
  await p.screenshot({ path: process.env.SHOT_DIR + '/game.png' });
}
// Nullpunkt: Start rechnet absolut waagerecht, "⊙ Null" übernimmt die aktuelle Haltung
await p.click('#back');
await p.click('.lvl >> nth=0'); await p.click('#startBtn');
await tiltTo(8, 0); await p.waitForTimeout(300);
await p.evaluate(() => { ball.x = 5.5; ball.y = 1.5; ball.vx = ball.vy = 0; });
await p.waitForTimeout(400);
q = await pos();
check('Standard-Nullpunkt waagerecht: 8° Neigung rollt', q.y > 1.55, q);
await p.click('#calib'); await p.waitForTimeout(200);
await p.evaluate(() => { ball.x = 5.5; ball.y = 1.5; ball.vx = ball.vy = 0; });
await p.waitForTimeout(500);
q = await pos();
check('nach ⊙ Null liegt die Kugel in dieser Haltung still', Math.abs(q.y - 1.5) < 0.02, q);
const zero = await p.evaluate(() => JSON.parse(localStorage.getItem('laby.zero')));
check('eigener Nullpunkt gespeichert', zero && zero.b === 8, zero);
await p.click('#back');
await p.click('#zeroReset');
const z2 = await p.evaluate(() => [tilt.zeroB, tilt.zeroG, localStorage.getItem('laby.zero')]);
check('Zurücksetzen auf waagerecht', z2[0] === 0 && z2[1] === 0 && z2[2] === 'null', z2);

// Ohne Banden: nach rechts über den Wegrand hinaus → Absturz, Neustart
await p.click('#modes .card >> nth=1');
await p.click('.lvl >> nth=0'); await p.click('#startBtn');
await tiltTo(0, 0); await p.waitForTimeout(300);
if (process.env.SHOT_DIR) await p.screenshot({ path: process.env.SHOT_DIR + '/edge.png' });
await tiltTo(0, 12);
let fell = false;
for (let i = 0; i < 40 && !fell; i++) { await p.waitForTimeout(100); fell = (await pos()).falls === 1; }
q = await pos();
check('ohne Banden: fällt über den Rand', fell, q);
await tiltTo(0, 0); await p.waitForTimeout(900);
q = await pos();
check('ohne Banden: Neustart am Start', Math.abs(q.x - 1.5) < 0.3 && Math.abs(q.y - 1.5) < 0.3, q);

check('keine JS-Fehler', errs.length === 0, errs);
await b.close();
process.exit(ok ? 0 : 1);
