# Prompts voor de webbouwer (Claude Code in Mark346/SISU)

Eerst moet de map `design/zoofi-glasvezel/` in de repo staan. Plak daarna de prompts één voor één, in deze volgorde. Wacht na elke prompt tot hij gepusht is en kijk even op je telefoon voordat je de volgende plakt.

---

## Prompt 1 – Naam, icoon, lettertype en kleuren

```
De app heet voortaan Zoofi en krijgt de stijl "Glasvezel". Alles staat in design/zoofi-glasvezel/: lees DESIGN.md helemaal en bekijk de vier PNG's in design/zoofi-glasvezel/schermen/.

Voer nu alleen "Stap 1 – Naam, icoon, lettertype en kleuren" uit DESIGN.md uit.
Let vooral op "Wat níet mag veranderen": de IndexedDB 'sisu', de localStorage-sleutels 'sisu.*', de cachenamen 'schouw-v…' en 'schouw-tiles-v1', de legendakleuren op foto's, origineel.html en de kleuren van het document blijven zoals ze zijn.

Controleer daarna met een zoekopdracht dat er geen #FF7A1A of #ffb27a meer in de interface zit (behalve in origineel.html, shared/document.html en shared/pdfdoc.js), en dat de app nog opent met bestaande schouwen.
Hoog de versie op naar 28 (shared/versie.js en sw.js), commit met een duidelijke Nederlandse omschrijving en push naar main.
```

## Prompt 2 – Startscherm

```
Voer "Stap 2 – Startscherm" uit design/zoofi-glasvezel/DESIGN.md uit. Het voorbeeld is design/zoofi-glasvezel/schermen/02-start.png.
Gebruik alleen de tokens uit shared/base.css (geen nieuwe losse kleuren). Houd alle bestaande functies: doorgaan, nieuwe schouw met adres, adres overnemen, Klaar en Archief met Document/Delen/Openen/Archiveren/Terugzetten.
Hoog de versie op (versie.js en sw.js), commit en push naar main.
```

## Prompt 3 – Schouwoverzicht

```
Voer "Stap 3 – Schouwoverzicht" uit design/zoofi-glasvezel/DESIGN.md uit. Het voorbeeld is design/zoofi-glasvezel/schermen/03-schouwoverzicht.png.
Alle bestaande knoppen en tellers blijven werken (statusstappen, Intake/Document openen, Buiten/Binnen, foto maken, galerij, lang drukken = vervalt, tellers, Naar document). Verwijderen van een schouw komt onderaan dit scherm, met "Zeker? Tik nog eens".
Hoog de versie op, commit en push naar main.
```

## Prompt 4 – Foto-editor

```
Voer "Stap 4 – Foto-editor" uit design/zoofi-glasvezel/DESIGN.md uit. Het voorbeeld is design/zoofi-glasvezel/schermen/04-foto-editor.png.
Het tekenen (vegen → nette pijl), alle 18 gereedschappen in gebruiksvolgorde, de bijschrift-blokjes, Ongedaan, Wis foto, Volgende foto en Naar document blijven precies zo werken. Test ook dat Richt & Zet en Loop-spoor de editor nog als correctie kunnen openen.
Hoog de versie op, commit en push naar main.
```

## Prompt 5 – Overige schermen

```
Geef opties.html, instellingen.html, shared/storyline.html en de formulieren uit shared/gegevens.js dezelfde Glasvezel-stijl volgens "Overige schermen" in design/zoofi-glasvezel/DESIGN.md: tokens, kaarten, pil-knoppen en chips. Geen nieuwe indeling.
Hoog de versie op, commit en push naar main.
```
