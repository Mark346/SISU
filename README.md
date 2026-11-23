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

## Varianten
De hoofdpagina (`index.html`) laat vier manieren zien om de schouw buiten te doen:

| Variant | Pagina | Wat het is |
|---|---|---|
| Origineel | `origineel.html` | De bestaande app: route van de tekening, punten slepen, gps-koppeling. Gegevens blijven in de opslag `schouw`. |
| Veeg & Klik | `veeg.html` | Foto maken, route vegen: de app maakt er een nette pijl van. Symbolen tikken, bijschrift met tikblokjes. |
| Richt & Zet | `richt.html` | Kantel-AR: live camera + kanteling (beta/gamma), pijl in perspectief op de grond, lengte in meters (schatting). Geen echte AR: sta stil bij het afdrukken. Proefstand zonder telefoon: `richt.html?sim=1`. |
| Loop-spoor | `loop.html` | Jij loopt en maakt een foto bij elke knik; gps (reserve: stappen) meet het stuk en de draai, en de app tekent de pijl op de vorige foto. Proefstand zonder lopen: `loop.html?sim=1`. |

De drie nieuwe varianten delen code in `shared/`:
- `legend.js` – tekent pijlen, bestaande buis en symbolen als SVG over een foto (`render`) en brandt ze in een JPEG (`burnIn`).
- `store.js` – IndexedDB `sisu` met de tabellen `surveys` en `photos`; verkleint foto's naar max. 1600 px.
- `camera.js` – foto maken via de camera-kiezer en een live camerabeeld.
- `sensors.js` – knop "Sensoren toestaan" voor kompas, beweging en gps.
- `editor.js` – de foto-editor van Veeg & Klik (vegen → nette pijl, symbolen, bijschrift, fotostrook). Los te openen met `Editor.openEditor(photoId, opties)`, zodat Richt & Zet en Loop-spoor hem als correctie kunnen gebruiken.
- `survey-ui.js` – gedeeld startscherm (nieuw/doorgaan) en schouwoverzicht met fotostrook, vervalt en tellers.
- `document.html` – "Zo komt het in het document": tellers, foto's in twee kolommen, afdrukken als PDF en foto's met pijlen delen.

De laatst gekozen variant wordt onthouden (`localStorage` sleutel `sisu.lastVariant`).
