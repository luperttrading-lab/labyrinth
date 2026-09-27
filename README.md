# Labyrinth

Kugel-Labyrinth als Web-App fürs Handy: Handy flach halten, durch Kippen die Kugel an den Löchern
vorbei ins grüne Ziel balancieren.

- `index.html` – das ganze Spiel (Physik, Level, Menü, Update-Mechanismus)
- `sw.js` – Service Worker, *Netz zuerst* (Updates kommen an, offline läuft der Cache)
- `tests/levels.mjs` – prüft, dass jedes Level lösbar ist (`node tests/levels.mjs`)
- `tests/smoke.mjs` – Browsertest mit simulierter Neigung (Seite per HTTP ausliefern, z. B.
  `python3 -m http.server 8765`, dann `node tests/smoke.mjs`)

## Aufs iPhone

Der Bewegungssensor ist im Browser nur über **HTTPS** zugänglich, und iOS fragt beim ersten Tipp auf
*Start* um Erlaubnis. Also: GitHub Pages einschalten (Settings → Pages → Deploy from branch), die
Adresse in Safari öffnen, *Teilen → Zum Home-Bildschirm*.

Am Rechner geht zum Testen auch die Tastatur (Pfeiltasten / WASD).

## Neues Level

Im Array `LEVELS` in `index.html`, 11 × 17 Zeichen: `#` Wand, `.` Boden, `o` Loch, `S` Start,
`Z` Ziel. Danach `node tests/levels.mjs` laufen lassen und `APP_VERSION` hochzählen.
