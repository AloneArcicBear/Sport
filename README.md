<!--#claude-->
# Dehn-Bingo

Kleine statische Seite für eine Sportstunde zum Thema Stretching. Die Bingokarte
liegt auf Papier – die Seite zieht die Übungen, würfelt dazu und zeigt
Abbildung und Kurzanleitung. Gedacht für Handys.

Nur HTML, CSS und Vanilla-JavaScript – kein Build-Schritt, keine externen Bibliotheken.

## Dateien

| Datei        | Inhalt                                                      |
|--------------|-------------------------------------------------------------|
| `index.html` | Seitenstruktur                                              |
| `style.css`  | Design, Hell- und Dunkelmodus über `prefers-color-scheme`   |
| `app.js`     | Ziehen, Würfeln, Übungsdaten                                |
| `bilder/`    | 16 Strichzeichnungen, `01.png` bis `16.png`                 |

## Lokal ausprobieren

`index.html` einfach im Browser öffnen. Ein Server ist nicht nötig.

## GitHub Pages aktivieren

1. Die Dateien in den Branch `main` pushen.
2. Im Repo oben auf **Settings** klicken.
3. In der linken Spalte **Pages** öffnen.
4. Unter *Build and deployment* bei **Source** „Deploy from a branch“ auswählen.
5. Bei **Branch** `main` und als Ordner `/ (root)` wählen, dann **Save**.
6. Nach ein bis zwei Minuten ist die Seite erreichbar unter
   `https://<benutzername>.github.io/<repo-name>/`
   – für dieses Repo also <https://alonearcicbear.github.io/Sport/>.

## So wird gespielt

1. Jede Übung hat eine Nummer von 1 bis 16 (Liste mit Abbildungen in
   Abschnitt 2 der Seite).
2. Alle tragen die Zahlen 1–16 selbst in ihre Papier-Bingokarte ein,
   jede Zahl genau einmal.
3. Die Lehrkraft tippt auf **Ziehen**: es erscheint eine Übung mit Abbildung
   plus Würfelzahl.
   * Würfel **gerade** → dynamisch, 15–20 langsame Wiederholungen pro Seite.
   * Würfel **ungerade** → statisch, 30 Sekunden pro Seite halten.
   * Dazu erscheint die Kurzanleitung, passend zum Würfel. Die jeweils andere
     Variante lässt sich darunter aufklappen.
4. Alle machen die Übung mit und kreuzen die Zahl auf ihrer Karte an.
5. Vier Kreuze in einer Reihe, Spalte oder Diagonale = **Bingo!**

Es wird ohne Wiederholung gezogen. Nach allen 16 Übungen mischt die Seite
automatisch neu; „Neu mischen“ startet die Runde auch vorher neu.

## Nach einer Änderung an app.js oder style.css

In `index.html` die Versionsnummer hochzählen:

```html
<link rel="stylesheet" href="style.css?v=3">
<script src="app.js?v=3" defer></script>
```

GitHub Pages liefert alle Dateien mit `cache-control: max-age=600` aus. Ohne
die Nummer kann ein Browser bis zu zehn Minuten lang das neue `index.html` mit
einem alten `app.js` kombinieren – dann bricht das Skript ab und keine Taste
reagiert mehr. Die Nummer ist für den Browser eine neue Adresse, also wird
sicher neu geladen.

## Technische Hinweise

* Alle 16 Abbildungen werden beim Seitenstart vorgeladen (zusammen rund 32 KB).
  Sonst wird erst im Moment des Ziehens geladen, und bei langsamer Verbindung
  bleibt die Stelle kurz leer.
* Die Strichzeichnungen stammen aus `Stretching_Bingo.pdf` und liegen als
  PNG mit transparentem Hintergrund vor. Im Dunkelmodus werden sie per
  CSS-Filter invertiert, damit die Striche hell erscheinen.
* Welche Übung schon gezogen wurde, wird – wenn möglich – im `localStorage`
  gespeichert. Ist der nicht verfügbar (Privatmodus, blockierte Website-Daten),
  läuft die Seite trotzdem (alle Zugriffe in `try`/`catch`).
* Alle Bedienelemente sind per Tastatur erreichbar (`Tab`, `Enter`, `Leertaste`),
  der Fokus ist sichtbar.
* Ab etwa 360 px Breite nutzbar, Seitenrand 16 px, kein horizontales Scrollen.
