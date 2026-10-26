//#claude
/* Dehn-Bingo – Bingokarte, Ziehen und Würfeln. Vanilla-JS, keine Abhängigkeiten. */
'use strict';

(() => {
  const SIZE = 4;
  const CELLS = SIZE * SIZE;
  const STORE_KEY = 'dehn-bingo.v1';
  const TIMER_MS = 30000;

  const EXERCISES = [
    'Nacken seitlich',
    'Hintere Schulter',
    'Trizeps',
    'Brust',
    'Unterarm / Handgelenk',
    'Seitneigung',
    'Oberer Rücken',
    'Katze (Katze-Kuh)',
    'Kindhaltung',
    'Drehsitz',
    'Hüftbeuger',
    'Oberschenkel vorn',
    'Oberschenkel hinten',
    'Gesäß (Figur 4)',
    'Schmetterling',
    'Wade'
  ];

  /* ===================== Reine Logik (ohne DOM) ===================== */

  // Alle Gewinnlinien: 4 Reihen, 4 Spalten, 2 Diagonalen = 10 Linien.
  function buildLines(size = SIZE) {
    const lines = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) row.push(r * size + c);
      lines.push(row);
    }
    for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = 0; r < size; r++) col.push(r * size + c);
      lines.push(col);
    }
    const diagA = [];
    const diagB = [];
    for (let i = 0; i < size; i++) {
      diagA.push(i * size + i);
      diagB.push(i * size + (size - 1 - i));
    }
    lines.push(diagA, diagB);
    return lines;
  }

  const LINES = buildLines();

  // marks: Array mit 16 Wahrheitswerten. Gibt alle voll angekreuzten Linien zurück.
  function findBingoLines(marks, lines = LINES) {
    return lines.filter((line) => line.every((idx) => marks[idx] === true));
  }

  function isValidNumber(value) {
    const s = String(value == null ? '' : value).trim();
    if (!/^\d{1,2}$/.test(s)) return false;
    const n = Number(s);
    return n >= 1 && n <= CELLS;
  }

  // Findet Felder, deren Zahl mehrfach vorkommt. Leere Felder zählen nicht.
  function findDuplicateIndexes(numbers) {
    const seen = new Map();
    numbers.forEach((value, idx) => {
      const s = String(value == null ? '' : value).trim();
      if (s === '') return;
      const key = /^\d+$/.test(s) ? String(Number(s)) : s; // "05" ist dieselbe Zahl wie "5"
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(idx);
    });
    const indexes = [];
    const values = [];
    seen.forEach((idxs, key) => {
      if (idxs.length > 1) {
        values.push(key);
        idxs.forEach((i) => indexes.push(i));
      }
    });
    return {
      indexes: indexes.sort((a, b) => a - b),
      values: values.sort((a, b) => Number(a) - Number(b))
    };
  }

  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function rollDie() {
    return 1 + Math.floor(Math.random() * 6);
  }

  // Gerade Würfelzahl = dynamisch, ungerade = statisch.
  function isDynamic(die) {
    return Number(die) % 2 === 0;
  }

  // Für das Node-Testskript. Im Browser ist "module" nicht definiert.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SIZE, CELLS, EXERCISES, LINES,
      buildLines, findBingoLines, isValidNumber, findDuplicateIndexes, shuffled, rollDie, isDynamic
    };
  }

  if (typeof document === 'undefined') return;

  /* ===================== Zustand ===================== */

  const state = {
    numbers: new Array(CELLS).fill(''),
    marks: new Array(CELLS).fill(false),
    play: false,
    pool: [],        // noch nicht gezogene Übungen dieser Runde
    drawn: [],       // bereits gezogene Übungen dieser Runde
    current: null,   // { ex: Index, die: 1..6 }
    roundNote: ''
  };

  /* ===================== Speichern (optional) ===================== */

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        numbers: state.numbers,
        marks: state.marks,
        play: state.play,
        pool: state.pool,
        drawn: state.drawn,
        current: state.current
      }));
    } catch (err) {
      /* Kein localStorage (Privatmodus, blockiert) – die Seite läuft trotzdem. */
    }
  }

  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch (err) {
      return;
    }
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const inRange = (n) => Number.isInteger(n) && n >= 0 && n < CELLS;
      if (Array.isArray(data.numbers) && data.numbers.length === CELLS) {
        state.numbers = data.numbers.map((v) => String(v == null ? '' : v).trim());
      }
      if (Array.isArray(data.marks) && data.marks.length === CELLS) {
        state.marks = data.marks.map(Boolean);
      }
      state.play = data.play === true;
      if (Array.isArray(data.pool)) state.pool = data.pool.filter(inRange);
      if (Array.isArray(data.drawn)) state.drawn = data.drawn.filter(inRange);
      if (data.current && inRange(data.current.ex)) {
        const die = Number(data.current.die);
        state.current = { ex: data.current.ex, die: die >= 1 && die <= 6 ? die : 1 };
      }
      // Kreuze auf leeren oder ungültigen Feldern wieder entfernen.
      for (let i = 0; i < CELLS; i++) {
        if (!isValidNumber(state.numbers[i])) state.marks[i] = false;
      }
    } catch (err) {
      /* Kaputte Daten einfach ignorieren. */
    }
  }

  /* ===================== DOM ===================== */

  const el = (id) => document.getElementById(id);
  const cells = [];
  const listItems = [];

  function buildGrid() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < CELLS; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'cell__num';
      input.min = '1';
      input.max = String(CELLS);
      input.step = '1';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.setAttribute('aria-label', 'Feld ' + (i + 1));

      const mark = document.createElement('button');
      mark.type = 'button';
      mark.className = 'cell__mark';
      mark.setAttribute('aria-pressed', 'false');

      input.addEventListener('input', () => setNumber(i, input.value));
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && i + 1 < CELLS) {
          ev.preventDefault();
          cells[i + 1].input.focus();
        }
      });
      mark.addEventListener('click', () => toggleMark(i));

      cell.append(input, mark);
      frag.append(cell);
      cells.push({ cell, input, mark });
    }
    el('grid').append(frag);
  }

  function buildList() {
    const frag = document.createDocumentFragment();
    EXERCISES.forEach((name, i) => {
      const li = document.createElement('li');
      const num = document.createElement('span');
      num.className = 'n';
      num.textContent = String(i + 1);
      const label = document.createElement('span');
      label.className = 'name';
      label.textContent = name;
      li.append(num, label);
      frag.append(li);
      listItems.push(li);
    });
    el('exerciseList').append(frag);
  }

  /* ===================== Aktionen ===================== */

  function setNumber(i, raw) {
    state.numbers[i] = String(raw).trim();
    if (!isValidNumber(state.numbers[i])) state.marks[i] = false;
    render();
    save();
  }

  function toggleMark(i) {
    if (!isValidNumber(state.numbers[i])) return;
    state.marks[i] = !state.marks[i];
    render();
    save();
  }

  function setPlay(on) {
    state.play = Boolean(on);
    render();
    save();
  }

  function randomFill() {
    const numbers = [];
    for (let i = 1; i <= CELLS; i++) numbers.push(String(i));
    state.numbers = shuffled(numbers);
    state.marks = new Array(CELLS).fill(false);
    state.play = true;
    render();
    save();
  }

  function clearCard() {
    state.numbers = new Array(CELLS).fill('');
    state.marks = new Array(CELLS).fill(false);
    state.play = false;
    render();
    save();
    cells[0].input.focus();
  }

  function clearMarks() {
    state.marks = new Array(CELLS).fill(false);
    render();
    save();
  }

  function reshuffle() {
    const all = [];
    for (let i = 0; i < CELLS; i++) all.push(i);
    state.pool = shuffled(all);
    state.drawn = [];
  }

  function draw() {
    stopTimer();
    let newRound = false;
    if (state.pool.length === 0) {
      newRound = state.drawn.length > 0;
      reshuffle();
    }
    const ex = state.pool.pop();
    state.drawn.push(ex);
    state.current = { ex, die: rollDie() };
    state.roundNote = newRound ? 'Neue Runde: alle 16 waren dran, neu gemischt.' : '';
    resetTimerDisplay();
    render();
    save();
  }

  function manualShuffle() {
    stopTimer();
    reshuffle();
    state.current = null;
    state.roundNote = 'Neu gemischt, alle 16 Übungen sind wieder dabei.';
    resetTimerDisplay();
    render();
    save();
  }

  /* ===================== Stoppuhr ===================== */

  let timerId = null;
  let timerEnd = 0;

  function formatLeft(ms) {
    const seconds = Math.max(0, ms) / 1000;
    return seconds.toFixed(1).replace('.', ',') + ' s';
  }

  function tick() {
    const left = timerEnd - Date.now();
    el('timerDisplay').textContent = formatLeft(left);
    if (left <= 0) {
      stopTimer();
      el('timerDisplay').textContent = '0,0 s';
      el('timerStatus').textContent = 'Zeit um – Seite wechseln!';
    }
  }

  function startTimer() {
    stopTimer();
    timerEnd = Date.now() + TIMER_MS;
    el('timerStatus').textContent = '';
    el('btnTimer').textContent = 'Stopp';
    el('btnTimer').setAttribute('aria-pressed', 'true');
    timerId = setInterval(tick, 100);
    tick();
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    const button = el('btnTimer');
    if (button) {
      button.textContent = '30 s starten';
      button.setAttribute('aria-pressed', 'false');
    }
  }

  function resetTimerDisplay() {
    el('timerDisplay').textContent = formatLeft(TIMER_MS);
    el('timerStatus').textContent = '';
  }

  /* ===================== Anzeige ===================== */

  function render() {
    document.body.classList.toggle('mode-play', state.play);
    document.body.classList.toggle('mode-edit', !state.play);

    const btnMode = el('btnMode');
    btnMode.textContent = state.play ? 'Zahlen bearbeiten' : 'Spielen starten';
    btnMode.setAttribute('aria-pressed', state.play ? 'true' : 'false');
    el('modeHint').textContent = state.play
      ? 'Spielen: tippe auf ein gefülltes Feld, um ein Kreuz zu setzen oder zu entfernen.'
      : 'Zahlen eintragen: tippe in ein Feld und schreibe eine Zahl von 1 bis 16.';

    const dupes = findDuplicateIndexes(state.numbers);
    const dupeSet = new Set(dupes.indexes);
    const winLines = findBingoLines(state.marks);
    const winSet = new Set();
    winLines.forEach((line) => line.forEach((i) => winSet.add(i)));

    let filled = 0;
    let invalid = 0;

    cells.forEach((entry, i) => {
      const value = state.numbers[i];
      const valid = isValidNumber(value);
      const broken = value !== '' && !valid;
      if (valid) filled++;
      if (broken) invalid++;

      if (entry.input.value !== value) entry.input.value = value;
      entry.input.readOnly = state.play;
      entry.input.tabIndex = state.play ? -1 : 0;
      entry.input.setAttribute('aria-invalid', broken ? 'true' : 'false');

      entry.cell.classList.toggle('is-marked', state.marks[i] === true);
      entry.cell.classList.toggle('is-dupe', dupeSet.has(i));
      entry.cell.classList.toggle('is-invalid', broken);
      entry.cell.classList.toggle('is-win', winSet.has(i));

      entry.mark.disabled = !valid;
      entry.mark.setAttribute('aria-pressed', state.marks[i] === true ? 'true' : 'false');
      entry.mark.setAttribute('aria-label', valid
        ? 'Kreuz für Feld ' + (i + 1) + ', Zahl ' + value
        : 'Feld ' + (i + 1) + ' ist leer');
    });

    const banner = el('bingoBanner');
    if (winLines.length > 0) {
      banner.textContent = winLines.length === 1
        ? 'Bingo! Eine Reihe ist voll.'
        : 'Bingo! ' + winLines.length + ' Reihen sind voll.';
      banner.hidden = false;
    } else {
      banner.textContent = '';
      banner.hidden = true;
    }

    const problems = [];
    if (dupes.values.length > 0) {
      problems.push(dupes.values.length === 1
        ? 'Die Zahl ' + dupes.values[0] + ' kommt doppelt vor.'
        : 'Diese Zahlen kommen mehrfach vor: ' + dupes.values.join(', ') + '.');
    }
    if (invalid > 0) problems.push('Erlaubt sind nur Zahlen von 1 bis 16.');

    const warnBox = el('warnBox');
    if (problems.length > 0) {
      warnBox.textContent = problems.join(' ');
      warnBox.hidden = false;
    } else {
      warnBox.textContent = '';
      warnBox.hidden = true;
    }

    const marked = state.marks.filter(Boolean).length;
    el('cardStatus').textContent = filled + ' von ' + CELLS + ' Feldern gefüllt, '
      + marked + (marked === 1 ? ' Kreuz' : ' Kreuze') + ' gesetzt.';

    const current = state.current;
    if (current) {
      const dynamic = isDynamic(current.die);
      el('drawTitle').textContent = 'Nr. ' + (current.ex + 1) + ' – ' + EXERCISES[current.ex];
      el('drawDie').textContent = 'Würfel: ' + current.die + ' (' + (dynamic ? 'gerade' : 'ungerade') + ')';
      el('drawTask').textContent = dynamic
        ? 'Dynamisch: 15–20 langsame Wiederholungen pro Seite.'
        : 'Statisch: 30 Sekunden pro Seite halten.';
      el('drawHint').textContent = 'Kreuze die ' + (current.ex + 1) + ' auf deiner Karte an.';
      el('timerBox').hidden = dynamic;
    } else {
      el('drawTitle').textContent = 'Noch keine Übung gezogen.';
      el('drawDie').textContent = '';
      el('drawTask').textContent = '';
      el('drawHint').textContent = '';
      el('timerBox').hidden = true;
    }

    el('poolInfo').textContent = (state.pool.length + ' von ' + CELLS
      + ' Übungen sind noch in dieser Runde.' + (state.roundNote ? ' ' + state.roundNote : '')).trim();

    listItems.forEach((li, i) => {
      li.classList.toggle('is-drawn', state.drawn.indexOf(i) !== -1);
      const isCurrent = Boolean(current) && current.ex === i;
      li.classList.toggle('is-current', isCurrent);
      if (isCurrent) li.setAttribute('aria-current', 'true');
      else li.removeAttribute('aria-current');
    });
  }

  /* ===================== Start ===================== */

  function init() {
    buildGrid();
    buildList();
    load();
    if (state.pool.length === 0 && state.drawn.length === 0) reshuffle();

    el('btnMode').addEventListener('click', () => setPlay(!state.play));
    el('btnRandom').addEventListener('click', randomFill);
    el('btnClearCard').addEventListener('click', clearCard);
    el('btnClearMarks').addEventListener('click', clearMarks);
    el('btnDraw').addEventListener('click', draw);
    el('btnShuffle').addEventListener('click', manualShuffle);
    el('btnTimer').addEventListener('click', () => {
      if (timerId === null) startTimer();
      else { stopTimer(); resetTimerDisplay(); }
    });

    resetTimerDisplay();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
