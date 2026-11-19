# Schouw – veldtest

Een web-app voor de telefoon om een kabelroute op een tekening te zetten, foto's te maken, de tekening aan gps te koppelen en een rapport als PDF te maken.

## Op GitHub Pages zetten
1. Maak op github.com een nieuwe repository, bijvoorbeeld `schouw`.
2. Kies **Add file → Upload files** en sleep alle bestanden uit deze map erin. Klik op **Commit changes**.
3. Ga naar **Settings → Pages**. Kies bij *Source* "Deploy from a branch", met de branch `main` en de map `/ (root)`. Klik op **Save**.
4. Na ongeveer een minuut staat de app op `https://<jouw-naam>.github.io/schouw/`.
5. Open die link op je telefoon in Safari of Chrome. Kies **Delen → Zet op beginscherm**.

## Bestanden
- `index.html` – de hele app
- `voorbeeld-tekening.jpg` – de kaart van pagina 3 (voor het voorbeeldproject)
- `manifest.webmanifest`, `sw.js`, `icon-*.png` – voor het beginscherm en voor werken bij slecht bereik

## Goed om te weten
- Alles wordt **alleen op de telefoon** bewaard, in de opslag van de browser. Er gaat niets naar een server.
- Wis je de websitegegevens van Safari of Chrome, dan ben je de projecten kwijt. Maak dus eerst het rapport als PDF.
- Bij de eerste keer "Positie" of "Ik sta hier" vraagt de telefoon om toestemming voor je locatie.
- Voor het inlezen van een PDF-tekening is internet nodig. De PDF-lezer wordt dan van cdnjs geladen.
- Werk je een bestand bij op GitHub, dan krijg je de nieuwe versie soms pas na twee keer openen te zien. Dat komt doordat de app een kopie bewaart voor slecht bereik.
