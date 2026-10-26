<!--#claude-->
# Dehn-Bingo

Kleine statische Seite für eine Sportstunde zum Thema Stretching: 16 Dehnübungen,
eine 4×4-Bingokarte, ein Knopf, der Übung und Würfel zieht. Gedacht für Handys.

Nur HTML, CSS und Vanilla-JavaScript – kein Build-Schritt, keine externen Bibliotheken.

## Dateien

| Datei        | Inhalt                                                        |
|--------------|---------------------------------------------------------------|
| `index.html` | Seitenstruktur                                                |
| `style.css`  | Design, Hell- und Dunkelmodus über `prefers-color-scheme`      |
| `app.js`     | Bingologik, Ziehen, Würfeln, Stoppuhr                         |

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

1. Jede Übung hat eine Nummer von 1 bis 16 (Liste in Abschnitt 3 der Seite).
2. Alle tragen die Zahlen 1–16 selbst in die Karte ein, jede Zahl genau einmal.
   „Zufällig füllen“ macht das auf Wunsch automatisch.
3. „Spielen starten“ schaltet von Eintragen auf Ankreuzen um.
4. Die Lehrkraft tippt auf **Ziehen**: es erscheint eine Übung plus Würfelzahl.
   * Würfel **gerade** → dynamisch, 15–20 langsame Wiederholungen pro Seite.
   * Würfel **ungerade** → statisch, 30 Sekunden pro Seite halten
     (dafür gibt es den Stoppuhr-Knopf).
5. Alle machen die Übung mit und kreuzen die Zahl auf ihrer Karte an.
6. Vier Kreuze in einer Reihe, Spalte oder Diagonale = **Bingo!**
   Die Gewinnreihe wird farbig hervorgehoben.

Es wird ohne Wiederholung gezogen. Nach allen 16 Übungen mischt die Seite
automatisch neu; „Neu mischen“ startet die Runde auch vorher neu.

## Technische Hinweise

* Der Zustand der Karte wird, wenn möglich, im `localStorage` gespeichert.
  Ist der nicht verfügbar (Privatmodus, blockierte Website-Daten), läuft die
  Seite trotzdem – dann eben ohne Speichern (alle Zugriffe in `try`/`catch`).
* Alle Bedienelemente sind per Tastatur erreichbar (`Tab`, `Enter`, `Leertaste`),
  der Fokus ist sichtbar. `Enter` in einem Kartenfeld springt zum nächsten Feld.
* Doppelte oder unerlaubte Zahlen werden markiert und als Warnung angezeigt.
* Ab etwa 360 px Breite nutzbar, Seitenrand 16 px, kein horizontales Scrollen.
