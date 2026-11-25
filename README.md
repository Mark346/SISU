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
De app opent direct in Veeg & Klik (`index.html`). Onderaan het startscherm staat "Andere opties" (`opties.html`) met alle vier manieren:

| Variant | Pagina | Wat het is |
|---|---|---|
| Origineel | `origineel.html` | De bestaande app: route van de tekening, punten slepen, gps-koppeling. Gegevens blijven in de opslag `schouw`. |
| Veeg & Klik | `index.html` (oud adres `veeg.html` stuurt door) | Foto maken, route vegen: de app maakt er een nette pijl van. Symbolen tikken, bijschrift met tikblokjes. |
| Richt & Zet | `richt.html` | Kantel-AR: live camera + kanteling (beta/gamma), pijl in perspectief op de grond, lengte in meters (schatting). Geen echte AR: sta stil bij het afdrukken. Proefstand zonder telefoon: `richt.html?sim=1`. |
| Loop-spoor | `loop.html` | Jij loopt en maakt een foto bij elke knik; gps (reserve: stappen) meet het stuk en de draai, en de app tekent de pijl op de vorige foto. Proefstand zonder lopen: `loop.html?sim=1`. |

De drie nieuwe varianten delen code in `shared/`:
- `legend.js` – tekent pijlen, bestaande buis en symbolen als SVG over een foto (`render`) en brandt ze in een JPEG (`burnIn`).
- `store.js` – IndexedDB `sisu` met de tabellen `surveys` en `photos`; verkleint foto's naar max. 1600 px.
- `camera.js` – foto maken via de camera-kiezer en een live camerabeeld.
- `sensors.js` – knop "Sensoren toestaan" voor kompas, beweging en gps.
- `editor.js` – de foto-editor van Veeg & Klik (vegen → nette pijl, symbolen, bijschrift, fotostrook). Los te openen met `Editor.openEditor(photoId, opties)`, zodat Richt & Zet en Loop-spoor hem als correctie kunnen gebruiken.
- `survey-ui.js` – gedeeld startscherm (nieuw/doorgaan) en schouwoverzicht met fotostrook, vervalt en tellers.
- `storyline.html` – tussenstap vóór het document: alle foto's en bijschriften op een rij om aan te passen, te herordenen of te laten vervallen.
- `pdfdoc.js` – maakt van een schouw een PDF (A4) zonder internet en deelt die via het deelmenu.
- `document.html` – "Zo komt het in het document": tellers, foto's in twee kolommen, afdrukken als PDF en foto's met pijlen delen.

De laatst gekozen variant wordt onthouden (`localStorage` sleutel `sisu.lastVariant`).

## Instellingen, statussen en voortgang
- `instellingen.html`: alle onderdelen van het site survey document (voorbeeld Oranjelaan 2, Oegstgeest) met per onderdeel **Input** (intake) en **Output** (document): verplicht, wenselijk of nee. Opgeslagen in `localStorage` (`sisu.velden`).
- `shared/velden.js`: de lijst met onderdelen, V&G-aspecten, statussen en voortgang.
- `shared/gegevens.js`: formulier voor de intake en voor alle documentgegevens.
- `shared/docmodel.js`: bouwt het document uit de instellingen (scherm, print en PDF).
- Statussen van een schouw: New → Intake compleet → Gelopen → Klaar → Archief. "Intake compleet" gaat vanzelf zodra alle verplichte input er is; "Klaar" kan pas als alle verplichte output er is.
