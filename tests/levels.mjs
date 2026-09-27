// Prüft jedes Level: Rechteck, Rand geschlossen, genau ein S und ein Z,
// und ein Weg von S nach Z, der weder Wand noch Loch betritt.
// Aufruf: node tests/levels.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.match(/const LEVELS = (\[[\s\S]*?\n\]);/)[1];
const LEVELS = eval(src);

let fail = 0;
LEVELS.forEach((L, i) => {
  const m = L.map, err = [];
  const rows = m.length, cols = m[0].length;
  if (m.some(r => r.length !== cols)) err.push('Zeilen ungleich lang');
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const edge = y === 0 || x === 0 || y === rows - 1 || x === cols - 1;
    if (edge && m[y][x] !== '#') err.push(`Rand offen bei ${x},${y}`);
  }
  const find = c => { const r = []; m.forEach((row, y) => [...row].forEach((ch, x) => ch === c && r.push([x, y]))); return r; };
  const S = find('S'), Z = find('Z');
  if (S.length !== 1 || Z.length !== 1) err.push(`S=${S.length} Z=${Z.length}`);
  else {
    const seen = new Set([S[0].join()]), q = [S[0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, c = m[ny]?.[nx];
        if (!c || c === '#' || c === 'o' || seen.has(nx + ',' + ny)) continue;
        seen.add(nx + ',' + ny); q.push([nx, ny]);
      }
    }
    if (!seen.has(Z[0].join())) err.push('kein Weg von S nach Z');
  }
  console.log(`${err.length ? 'FEHLER' : 'ok    '} Level ${i + 1} ${L.name}${err.length ? ': ' + err.join('; ') : ''}`);
  fail += err.length;
});
process.exit(fail ? 1 : 0);
