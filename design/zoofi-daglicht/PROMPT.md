# Prompts voor de webbouwer (Claude Code in Mark346/SISU)

Eerst moet de map `design/zoofi-daglicht/` in de repo staan. Plak daarna prompt 1. Prompt 2 is optioneel: dat zijn twee kleine verbeteringen die geen kleur zijn.

---

## Prompt 1 – Stijl Daglicht met donkere stand

```
Zoofi krijgt de stijl "Daglicht": licht wordt de standaard, met een donkere stand die je met één tik wisselt. Alles staat in design/zoofi-daglicht/: lees DESIGN.md helemaal en bekijk de PNG's in design/zoofi-daglicht/schermen/.

Voer "Stappen" 1 t/m 7 uit DESIGN.md uit. thema.css en thema.js zijn al getest: neem ze precies over en haal het woord "html " voor de regels niet weg. voorbeeld-wijzigingen.diff laat zien hoe index.html, instellingen.html en paf.html moeten veranderen.

Let vooral op "Wat níet mag veranderen": logo en de vezelkleuren --f1 t/m --f12 blijven gelijk, de IndexedDB 'sisu' en de localStorage-sleutels 'sisu.*' blijven, de cachenamen 'schouw-v…' en 'schouw-tiles-v1' blijven, en storyline.html, document.html, pdfdoc.js, origineel.html, richt.html, loop.html en opties.html raak je niet aan.

Controleer daarna de punten onder "Klaar als" in DESIGN.md.
Hoog de versie op naar 100 (shared/versie.js en sw.js), commit met een duidelijke Nederlandse omschrijving en push naar main.
```

## Prompt 2 – Twee kleine verbeteringen (optioneel)

```
Twee kleine verbeteringen in het schouwoverzicht (shared/survey-ui.js en shared/gegevens.js), zonder iets aan de kleuren te veranderen:

1. In de kaarten Informatie, Foto's buiten en Foto's binnen begint de kleine tekst met "11 nog te doen · …". Zet dat eerste stuk ("11 nog te doen") in een eigen <b class="todo"> en geef .todo in shared/thema.css de stijl: html .todo{font-weight:800;color:var(--ink)}. De rest van de regel blijft zoals hij is.
2. Bovenaan het schouwoverzicht staat het adres twee keer: in de bovenbalk en direct daaronder boven de stappenbalk. Laat het adres boven de stappenbalk weg en houd "stap 1 van 3" rechts staan. Lang drukken om de status terug te zetten moet blijven werken.

Hoog de versie op (versie.js en sw.js), commit en push naar main.
```
