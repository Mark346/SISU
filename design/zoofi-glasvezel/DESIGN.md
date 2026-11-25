# Zoofi – ontwerp "Glasvezel"

De app heet voortaan **Zoofi** (was Sisu / Schouw) en krijgt de stijl **Glasvezel**: donker grafiet, de twaalf kleuren van de vezelkleurcode als merk, het lettertype Archivo en een icoon met de doorsnede van een glasvezelkabel.

Deze map bevat alles om dat te bouwen:

| Bestand | Wat |
|---|---|
| `schermen/01-merk.png` | merkkaart: icoon, kleuren, letters |
| `schermen/02-start.png` | startscherm |
| `schermen/03-schouwoverzicht.png` | één schouw (status, foto's, tellers) |
| `schermen/04-foto-editor.png` | Veeg & Klik-editor |
| `tokens.css` | alle kleuren, vormen en het lettertype als CSS-variabelen |
| `icon.svg`, `icon-klein.svg` | app-icoon (groot) en vereenvoudigd icoon voor kleine maten |
| `app-iconen/` | `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180), `favicon-32.png` |
| `fonts/` | Archivo 400, 600 en 800 (woff2) + licentie (SIL OFL, vrij te gebruiken) |

De schermafbeeldingen zijn op 2x gemaakt (780 px breed = 390 px op de telefoon). Ze laten de bedoeling zien; volg de bestaande code voor wat er op een scherm moet staan en deze afbeeldingen voor hoe het eruitziet.

---

## Wat níet mag veranderen

1. **Opgeslagen gegevens.** De IndexedDB heet `sisu`, de localStorage-sleutels beginnen met `sisu.` (`sisu.velden`, `sisu.gebruik`, `sisu.lastVariant`, `sisu.loop`, `sisu.richt`, `sisu.sensors`) en `window.SISU_VERSIE` blijft zo heten. Hernoem die **niet**: dan is iedereen zijn schouwen kwijt.
2. **Cachenamen in `sw.js`.** Het voorvoegsel `schouw-v` blijft; alleen het nummer gaat omhoog. `schouw-tiles-v1` blijft precies zo (daar zitten bewaarde kaarttegels in).
3. **De legenda op foto's** (`shared/legend.js`): rode pijl met groene rand = nieuw tracé, blauwgroen met gele rand = bestaande buis, bruine symbolen met groene rand = nieuw. Die kleuren komen uit de Sisu-tekening en blijven gelijk.
4. **`origineel.html`**: blijft ongewijzigd (daar betekent oranje "foto" op de kaart).
5. **Het document** (`shared/document.html`, `shared/pdfdoc.js`): het rapport volgt het Sisu-template. Kleuren daarvan blijven in deze ronde zoals ze zijn.
6. **"Sisu" als naam van het document of template** (bv. "Sisu site survey document", "Sisu-template" in `shared/velden.js`) blijft staan. Alleen de **naam van de app** wordt Zoofi.

---

## Regels van de stijl

- **Achtergrond** `--bg` grafiet, **kaarten** `--card` met 1 px rand `--line` en hoek 20 px.
- **Hoofdknop**: lichte pil (`--acc` met tekst `--on-acc`), 56–60 px hoog, Archivo 800. Eén hoofdknop per scherm.
- **Tweede knop**: pil met rand `--line`, transparant, Archivo 600.
- **Gekozen** (chip, gereedschap, schakelaar aan): lichte achtergrond `--acc` met donkere tekst. Niet oranje.
- **Oranje is geen interfacekleur meer.** Vervang elke `#FF7A1A` / `#ffb27a` in de interface door de tokens hieronder.
- **Status van een schouw**: gekleurd bolletje (10 px) + tekst in `--mute`, geen gekleurd vlak. Kleuren `--st-*`.
- **Voortgang** Intake en Document: ringen (44–48 px, lijn 6 px, `--prog-in` en `--prog-doc` op `--track`), met "Intake 4/11" ernaast. In formulieren mag het een balk blijven, in `--prog-in`.
- **Ontbreekt nog** (verplichte velden): tekst in `--warn` (geel), geen oranje.
- **Vezelband**: onder de bovenbalk van het startscherm en het schouwoverzicht 12 lijnen van 2 px (`.vezelband` in `tokens.css`). Niet op de editor.
- **Lettertype** Archivo: koppen 800, knoppen 600/800, tekst 400. Minimaal 13 px, tekst 15–17 px.
- **Tikdoelen** minimaal 44 × 44 px. Knoppen met alleen een icoon krijgen `aria-label`.
- **Over een foto**: knoppen en labels op `--overlay` (donker, 72%), rond of pil.

### Waar oranje nu in de interface zit (vervangen)

| Bestand | Nu | Wordt |
|---|---|---|
| `shared/base.css` | `--acc:#FF7A1A` | `:root` uit `tokens.css` |
| `shared/survey-ui.js` | voortgangsbalk, `.smist` (#ffb27a), `.sect button.on` | ringen; `--warn`; `--acc`/`--on-acc` |
| `shared/editor.js` | `.tl.on`, `.chip.on`, `.th.on` (fallback #FF7A1A) | `--acc`/`--on-acc` (fallback naar de nieuwe waarden) |
| `shared/gegevens.js` | balk, `.fr.mist`, `.bd.verplicht`, `.ch button.on`, `accent-color` | `--prog-in`, `--warn`, `--acc` |
| `shared/storyline.html` | `.sct` (sectiepil) | rand en tekst in `--sec-buiten` / `--sec-binnen` |
| `instellingen.html` | `.todo`, `.cyc.verplicht` | `.todo`: achtergrond `#2A2612`, rand `--warn`; verplicht: `--acc`/`--on-acc` |

Ook hardgecodeerde donkere waarden (`#0d0f12`, `#181b20`, `#22262d`, `#33383f`, `#141414`, `#2a2e35`, `#3a3f47`) in deze bestanden én in `richt.html`, `loop.html`, `opties.html` en `veeg.html` vervangen door de tokens. `theme-color` in alle `<head>`s wordt `#121418`.

---

## Stap 1 – Naam, icoon, lettertype en kleuren

1. Kopieer `fonts/*.woff2` en `fonts/OFL.txt` naar `/fonts/` in de root.
2. Kopieer `app-iconen/icon-192.png` en `icon-512.png` over de bestaande in de root; zet `apple-touch-icon.png` en `favicon-32.png` in de root; zet `icon-klein.svg` in `/shared/`.
3. `manifest.webmanifest`: `name` en `short_name` → `Zoofi`, `background_color` en `theme_color` → `#121418`, iconen 192 en 512 met `"purpose":"any maskable"` (het icoon valt binnen de veilige zone).
4. Alle pagina's: `<title>` Zoofi (of "Zoofi · …"), `apple-touch-icon` → `apple-touch-icon.png` (in `shared/` → `../apple-touch-icon.png`), `<link rel="icon" href="favicon-32.png">`, `theme-color` `#121418`.
5. `shared/base.css`: `:root` vervangen door die uit `tokens.css`, plus de `@font-face`-regels en `.vezelband`. `font-family` van `html,body` → `var(--font)`.
6. Oranje en de oude donkere kleuren vervangen zoals in de tabel hierboven.
7. Bovenbalk startscherm: `icon-klein.svg` (32 px) + "Zoofi" in Archivo 800. Teksten "Sisu · Veeg & Klik" → "Zoofi".
8. `sw.js`: cachenaam `schouw-v28`; nieuwe bestanden in `FILES`: `apple-touch-icon.png`, `favicon-32.png`, `icon-512.png`, `shared/icon-klein.svg`, `fonts/archivo-400.woff2`, `fonts/archivo-600.woff2`, `fonts/archivo-800.woff2`. `shared/versie.js`: nummer 28.

Klaar als: de app heet overal Zoofi, het nieuwe icoon staat op het beginscherm (na opnieuw "Zet op beginscherm"), er is nergens meer oranje in de interface en bestaande schouwen staan er nog.

## Stap 2 – Startscherm (zie `02-start.png`)

- Bovenbalk: icoon + "Zoofi" links, ronde knop Instellingen (44 px, `--card`, rand `--line`) rechts. Daaronder de vezelband.
- Kop "Schouwen" (36 px, 800) met rechts "2 bezig" in `--mute`.
- Hoofdknop "Nieuwe schouw" (pil, 60 px, plusteken). Tikken opent een invoerblad onderin met het adresveld, "Adres overnemen: …" (als er een open schouw is) en "Start schouw". Het adresveld staat dus niet meer los op het startscherm.
- Kaart per open schouw: adres (20 px, 600), statusbolletje + "Gelopen · vandaag", pijltje rechts, twee ringen (Intake, Document). De rode knop **Verwijderen** naast de kaart vervalt; verwijderen kan in het schouwoverzicht (stap 3).
- "Klaar" en "Archief" als pil-rij (bolletje + aantal + eerste adres); openklappen zoals nu, met Document / Delen (PDF) / Openen / Archiveren in pil-knoppen.
- "Andere opties" als tekstlink onderaan.

## Stap 3 – Schouwoverzicht (zie `03-schouwoverzicht.png`)

- Bovenbalk: pil-knop "‹ Schouwen" + adres als titel (afgekapt met …). Daaronder de vezelband.
- Statuskaart: stappenbalk met 5 delen (gekleurd t/m de huidige status, huidige vet), twee ringknoppen Intake en Document (openen het formulier zoals nu), "Nog verplicht: …" in `--warn`, knoppen "‹ vorige status" (tweede knop) en de volgende stap (hoofdknop).
- "Foto's voor" als schakelaar Buiten/Binnen met bolletje `--sec-buiten` / `--sec-binnen`.
- "Foto n maken" als hoofdknop met camera-icoon, "Foto uit galerij" als ronde knop ernaast.
- Fotostrook: miniaturen 104 × 78, hoek 14, nummer in een donker pilletje. Vervallen foto: gestippelde rand en "vervalt".
- Tellers in één kaart met scheidingslijnen; plus/min als ronde knoppen van 44 px.
- "Naar document" als pil (licht), "Andere schouw" als tekstlink, en onderaan **"Schouw verwijderen"** in `--red` met de bestaande "Zeker? Tik nog eens".

## Stap 4 – Foto-editor (zie `04-foto-editor.png`)

- De foto staat bovenaan over de volle breedte (ongeveer de helft van het scherm), zonder bovenbalk erboven.
- Over de foto: linksboven een ronde terugknop en een pil "Foto 1 / 3", rechtsboven een pil met het sectiebolletje en "Buiten"/"Binnen", linksonder de aanwijzing "Veeg over de route".
- Rechts op de foto een verticale rail (achtergrond `--overlay`, pil): de **twee of drie meest gebruikte gereedschappen** (volgorde uit `toolsOpVolgorde()`), daaronder Ongedaan en Wis foto. Gekozen gereedschap: lichte ronde achtergrond.
- Onder de foto: alle gereedschappen in gebruiksvolgorde als horizontaal scrollende pillen (mini-symbool uit `Legend.mini` + naam).
- Bijschrift-kaart: de zin zoals hij nu wordt opgebouwd, met de tikblokjes (`CH`) als pillen eronder; "Let op" in `--warn`.
- Onderaan: "Document" (tweede knop) en "Volgende foto" (hoofdknop), allebei pillen van 56 px.
- Richt & Zet en Loop-spoor gebruiken dezelfde editor als correctie: die krijgen dit vanzelf mee.

## Overige schermen

`opties.html`, `instellingen.html`, `shared/storyline.html` en de formulieren uit `shared/gegevens.js` krijgen dezelfde tokens, kaarten, pil-knoppen en chips. Geen nieuwe indeling nodig.
