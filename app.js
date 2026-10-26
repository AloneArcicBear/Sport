//#claude
/* Dehn-Bingo – Übung ziehen, würfeln, Abbildung und Kurzanleitung zeigen.
   Vanilla-JS, keine Abhängigkeiten. */
'use strict';

(() => {
  const COUNT = 16;
  const STORE_KEY = 'dehn-bingo.v3';

  // Name und Kurzanleitung je Übung (aus der Übungskarten-Übersicht).
  const EXERCISES = [
    {
      name: 'Nacken seitlich',
      statisch: 'Aufrechter Stand. Ohr zur Schulter neigen, Hand liegt nur sanft auf dem Kopf, die andere Schulter aktiv nach unten ziehen.',
      dynamisch: 'Kopf langsam von Schulter zu Schulter pendeln.'
    },
    {
      name: 'Hintere Schulter',
      statisch: 'Arm gestreckt quer vor die Brust, die andere Hand zieht am Oberarm (nicht am Ellbogengelenk).',
      dynamisch: 'Arme weit öffnen und vor der Brust überkreuzen.'
    },
    {
      name: 'Trizeps',
      statisch: 'Ellbogen zeigt nach oben, Hand liegt zwischen den Schulterblättern, die andere Hand schiebt den Ellbogen sanft nach hinten.',
      dynamisch: 'Hand wandert in kleinen, kontrollierten Bewegungen am Rücken auf und ab.'
    },
    {
      name: 'Brust',
      statisch: 'Aufrecht stehen, Hände hinter dem Rücken verschränken, gestreckte Arme nach hinten-oben heben, Brustbein nach vorn.',
      dynamisch: 'Arme in Schulterhöhe weit öffnen und vor der Brust wieder zusammenführen.'
    },
    {
      name: 'Unterarm / Handgelenk',
      statisch: 'Arm gestreckt nach vorn, Handfläche zeigt nach vorn (Finger nach oben); die andere Hand zieht die Finger sanft zum Körper.',
      dynamisch: 'Handgelenk kreisen, Finger öffnen und schließen.'
    },
    {
      name: 'Seitneigung',
      statisch: 'Hüftbreit stehen, Knie leicht gebeugt. Rechten Arm gestreckt über den Kopf heben.',
      dynamisch: 'Mit dem Arm über dem Kopf langsam von rechts nach links und zurück neigen.'
    },
    {
      name: 'Oberer Rücken',
      statisch: 'Hände vor der Brust verschränken, Arme nach vorn schieben, Rücken rund machen, Kopf zwischen die Arme.',
      dynamisch: 'Arme weit öffnen und sich selbst umarmen, im Wechsel.'
    },
    {
      name: 'Katze (Katze-Kuh)',
      statisch: 'Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte. Rücken rund machen (Katze), Kinn zur Brust.',
      dynamisch: 'Fließend zwischen Katze (rund) und Kuh (Hohlkreuz, Blick nach vorn) wechseln.'
    },
    {
      name: 'Kindhaltung',
      statisch: 'Auf die Fersen setzen, Oberkörper auf die Oberschenkel ablegen, Arme lang nach vorn. Gegendehnung nach Rückbeugen.',
      dynamisch: 'Hände abwechselnd nach links und rechts wandern lassen.'
    },
    {
      name: 'Drehsitz',
      statisch: 'Langsitz. Ein Bein aufstellen und über das gestreckte Bein setzen, Gegenellbogen an das Knie, aufrichten und eindrehen, Blick über die Schulter.',
      dynamisch: 'Beide Knie angewinkelt, von Seite zu Seite fallen lassen.'
    },
    {
      name: 'Hüftbeuger',
      statisch: 'Ausfallschritt, hinteres Knie am Boden (Unterlage), Becken nach vorn-unten schieben, Oberkörper aufrecht.',
      dynamisch: 'Becken kontrolliert nach vorn schieben und zurück.'
    },
    {
      name: 'Oberschenkel vorn',
      statisch: 'Einbeinstand (ggf. festhalten), Ferse zum Gesäß ziehen, Knie zeigt nach unten, Hüfte nach vorn.',
      dynamisch: 'Ferse langsam zum Gesäß ziehen und wieder lösen.'
    },
    {
      name: 'Oberschenkel hinten',
      statisch: 'Sitz, ein Bein gestreckt, das andere angewinkelt. Mit geradem Rücken aus der Hüfte nach vorn neigen.',
      dynamisch: 'Im Stand das gestreckte Bein kontrolliert nach vorn pendeln.'
    },
    {
      name: 'Gesäß (Figur 4)',
      statisch: 'Rückenlage. Fuß auf das Gegenknie legen (Zahl 4), Oberschenkel des Standbeins zur Brust ziehen.',
      dynamisch: 'Oberschenkel langsam heranziehen und wieder lösen.'
    },
    {
      name: 'Schmetterling',
      statisch: 'Sitz, Fußsohlen aneinander, Knie sinken nach außen, Rücken aufrecht.',
      dynamisch: 'Knie sanft wie Schmetterlingsflügel auf und ab bewegen.'
    },
    {
      name: 'Wade',
      statisch: 'Schrittstellung an der Wand, hinteres Bein gestreckt, Ferse am Boden, Fußspitzen nach vorn, Hüfte nach vorn.',
      dynamisch: 'Hinteres Knie abwechselnd leicht beugen und strecken.'
    }
  ];

  /* ===================== Reine Logik (ohne DOM) ===================== */

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

  // Strichzeichnung zur Übung, 0-basierter Index.
  function imagePath(index) {
    return 'bilder/' + ('0' + (index + 1)).slice(-2) + '.png';
  }

  // Für das Node-Testskript. Im Browser ist "module" nicht definiert.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COUNT, EXERCISES, shuffled, imagePath };
  }

  if (typeof document === 'undefined') return;

  /* ===================== Zustand ===================== */

  const state = {
    pool: [],        // noch nicht gezogene Übungen dieser Runde
    drawn: [],       // bereits gezogene Übungen dieser Runde
    current: null,   // Index der gezogenen Übung, oder null
    roundNote: ''
  };

  /* ===================== Speichern (optional) ===================== */

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
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
      const inRange = (n) => Number.isInteger(n) && n >= 0 && n < COUNT;
      if (Array.isArray(data.pool)) state.pool = data.pool.filter(inRange);
      if (Array.isArray(data.drawn)) state.drawn = data.drawn.filter(inRange);
      if (inRange(data.current)) state.current = data.current;
    } catch (err) {
      /* Kaputte Daten einfach ignorieren. */
    }
  }

  /* ===================== DOM ===================== */

  const el = (id) => document.getElementById(id);
  const listItems = [];

  function buildList() {
    const frag = document.createDocumentFragment();
    EXERCISES.forEach((exercise, i) => {
      const li = document.createElement('li');
      const num = document.createElement('span');
      num.className = 'n';
      num.textContent = String(i + 1);
      const figur = document.createElement('img');
      figur.className = 'figur';
      figur.src = imagePath(i);
      figur.alt = '';
      const label = document.createElement('span');
      label.className = 'name';
      label.textContent = exercise.name;
      li.append(num, figur, label);
      frag.append(li);
      listItems.push(li);
    });
    el('exerciseList').append(frag);
  }

  /* ===================== Ziehen ===================== */

  function reshuffle() {
    const all = [];
    for (let i = 0; i < COUNT; i++) all.push(i);
    state.pool = shuffled(all);
    state.drawn = [];
  }

  function draw() {
    let newRound = false;
    if (state.pool.length === 0) {
      newRound = state.drawn.length > 0;
      reshuffle();
    }
    const ex = state.pool.pop();
    state.drawn.push(ex);
    state.current = ex;
    state.roundNote = newRound ? 'Neue Runde: alle 16 waren dran, neu gemischt.' : '';
    render();
    save();
  }

  function manualShuffle() {
    reshuffle();
    state.current = null;
    state.roundNote = 'Neu gemischt, alle 16 Übungen sind wieder dabei.';
    render();
    save();
  }

  /* ===================== Anzeige ===================== */

  function render() {
    const current = state.current;
    const image = el('drawImage');
    const gezogen = current !== null;

    if (gezogen) {
      const exercise = EXERCISES[current];
      el('drawNr').textContent = String(current + 1);
      el('drawNr').hidden = false;
      el('drawName').textContent = exercise.name;
      image.src = imagePath(current);
      image.hidden = false;
      el('textStatisch').textContent = exercise.statisch;
      el('textDynamisch').textContent = exercise.dynamisch;
      el('varianten').hidden = false;
      el('drawHint').textContent = 'Kreuze die ' + (current + 1) + ' auf deiner Karte an.';
    } else {
      el('drawNr').textContent = '';
      el('drawNr').hidden = true;
      el('drawName').textContent = 'Noch keine Übung gezogen.';
      image.removeAttribute('src');
      image.hidden = true;
      el('textStatisch').textContent = '';
      el('textDynamisch').textContent = '';
      el('varianten').hidden = true;
      el('drawHint').textContent = '';
    }

    el('poolInfo').textContent = (state.pool.length + ' von ' + COUNT
      + ' Übungen sind noch in dieser Runde.' + (state.roundNote ? ' ' + state.roundNote : '')).trim();

    listItems.forEach((li, i) => {
      li.classList.toggle('is-drawn', state.drawn.indexOf(i) !== -1);
      const isCurrent = gezogen && current === i;
      li.classList.toggle('is-current', isCurrent);
      if (isCurrent) li.setAttribute('aria-current', 'true');
      else li.removeAttribute('aria-current');
    });
  }

  /* ===================== Start ===================== */

  // Alle Abbildungen sofort holen (zusammen rund 32 KB), damit beim Ziehen
  // nichts nachgeladen werden muss und keine Lücke entsteht.
  function preloadImages() {
    for (let i = 0; i < COUNT; i++) {
      const img = new Image();
      img.src = imagePath(i);
    }
  }

  function init() {
    buildList();
    preloadImages();
    load();
    if (state.pool.length === 0 && state.drawn.length === 0) reshuffle();

    el('btnDraw').addEventListener('click', draw);
    el('btnShuffle').addEventListener('click', manualShuffle);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
