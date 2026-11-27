# Zoofi – stijl "Daglicht"

Zoofi wordt vooral buiten gebruikt, op de telefoon, vaak in de zon. Daarom wordt **licht de standaard**: zwarte tekst op wit, een zwarte hoofdknop en duidelijke randen. Voor binnen, kelders en 's avonds is er een **donkere stand** in dezelfde stijl. Wisselen kan met één tik op de maan- of zon-knop in de bovenbalk, of in Instellingen.

Het **logo en de 12 bolletjes blijven precies hetzelfde**. De bovenbalk is daarom in beide standen grafiet (`#121418`), net als nu.

Deze map bevat alles om dat te bouwen:

| Bestand | Wat |
|---|---|
| `thema.css` | het nieuwe `shared/thema.css`, compleet. Getest in een kopie van de app. |
| `thema.js` | nieuw bestand `shared/thema.js`: wisselen tussen licht en donker. |
| `voorbeeld-wijzigingen.diff` | precies welke regels in `index.html`, `instellingen.html` en `paf.html` veranderen (zo is het getest) |
| `schermen/licht-*.png`, `schermen/donker-*.png` | hoe het eruit moet zien: start, schouwoverzicht, foto's buiten, foto-editor, instellingen |

De schermafbeeldingen zijn op 2x gemaakt (780 px breed = 390 px op de telefoon), met voorbeelddata.

---

## Wat níet mag veranderen

1. **Logo en bolletjes.** `shared/icon-klein.svg` en de vezelkleuren `--f1` t/m `--f12` blijven zoals ze zijn, in beide standen. Het oude licht thema veranderde `--f6` en `--f9`; dat gebeurt niet meer.
2. **Opgeslagen gegevens.** De IndexedDB `sisu` en alle localStorage-sleutels `sisu.*` blijven. De stand wordt bewaard in de bestaande sleutel `sisu.thema`, met de waarde `donker` of `licht`. Een oude waarde `licht` blijft gewoon werken (dat is nu de standaard).
3. **Cachenamen in `sw.js`.** Het voorvoegsel `schouw-v` blijft, alleen het nummer gaat omhoog. `schouw-tiles-v1` blijft precies zo.
4. **`shared/base.css`** blijft zoals hij is. Zijn donkere tokens blijven de basis voor schermen die `thema.css` niet laden.
5. **Niet in deze ronde:** de afronding (`shared/storyline.html`), het document (`shared/document.html`, `shared/pdfdoc.js`), `origineel.html`, `richt.html`, `loop.html`, `opties.html`, en de legenda op foto's (`shared/legend.js`). Die laden `thema.css` niet en blijven zoals ze zijn.
6. **`theme-color`** blijft overal `#121418`, omdat de bovenbalk altijd grafiet is. De regel die hem op `#EEF0F3` zette, vervalt.

---

## Regels van de stijl

**Lichte stand (standaard)**

| Token | Kleur | Waarvoor |
|---|---|---|
| `--bg` | `#E4E7EB` | achtergrond |
| `--card` | `#FFFFFF` | kaarten |
| `--line` | `#6B7480` | kaartranden (3,8:1 op de achtergrond) |
| `--ink` | `#0A0C0F` | tekst |
| `--mute` | `#3A434E` | bijtekst (10:1 op wit) |
| `--acc` / `--on-acc` | `#0A0C0F` / `#FFFFFF` | hoofdknop zwart met witte tekst |
| `--signal-fill` | `#FFD000` | "nog te doen" |

**Donkere stand** (`html[data-thema="donker"]`)

| Token | Kleur | Waarvoor |
|---|---|---|
| `--bg` | `#121418` | achtergrond, gelijk aan de bovenbalk |
| `--card` | `#1E2127` | kaarten |
| `--line` | `#6A7280` | kaartranden (3,8:1) |
| `--ink` | `#FFFFFF` | tekst |
| `--mute` | `#C8CDD4` | bijtekst |
| `--acc` / `--on-acc` | `#FFFFFF` / `#0A0C0F` | hoofdknop wit met zwarte tekst |
| `--signal-fill` | `#FFD000` | "nog te doen" |

**Voor beide standen**

- **Eén betekenis per kleur.** Geel = nog te doen: een gele balk links in de kaart, een geel rondje met `!`, en de kop "3 nog te doen" als gele balk met zwarte tekst. Groen met ✓ = klaar. Rood = verwijderen. Blauw en oranje worden niet meer voor "nog te doen" gebruikt.
- **Randen** van kaarten, knoppen en invoervelden 1,5 px.
- **Bijtekst** minimaal 15 px ("11 nog te doen", "Document 5/31", "Uitwerking · vandaag").
- **OFFNET / ONNET** als massief label: groen of violet met witte tekst (licht), zwarte tekst (donker).
- **Stappenbalk** (Uitwerking / Afronding / Klaar) 7 px hoog.
- **Bovenbalk** altijd grafiet `#121418` met witte tekst. De terugknop en ronde knoppen erin zijn `#1C1F25` met rand `#3A3E46`.
- **Wisselknop**: ronde knop van 44 px in de bovenbalk van `index.html`, links van Instellingen. Op elk scherm met een bovenbalk zichtbaar (ook als Instellingen verborgen is). Maan-icoon in de lichte stand, zon-icoon in de donkere. `aria-label="Donkere stand"` en `aria-pressed`.
- **Instellingen**: de schakelaar "Buitenmodus" wordt "Donkere stand" (aan = donker), met de uitleg "Voor binnen en 's avonds. Buiten is de lichte stand het best leesbaar. Wisselen kan ook met de maan-knop bovenin."

Belangrijk bij `thema.css`: elke regel voor onderdelen begint met `html `. De app voegt een deel van zijn stijl pas later toe (vanuit `survey-ui.js`, `gegevens.js` en `editor.js`). Zonder dat extra woord wint die latere stijl, en dan staat bijvoorbeeld de gele kop in de donkere stand zonder leesbare tekst. Haal `html ` dus niet weg.

---

## Stappen

1. Vervang `shared/thema.css` door `design/zoofi-daglicht/thema.css`.
2. Zet `design/zoofi-daglicht/thema.js` neer als `shared/thema.js`.
3. Pas in de `<head>` van `index.html`, `instellingen.html` en `paf.html` het inline-script aan. Nu:
   `if(localStorage.getItem('sisu.thema')==='licht'){document.documentElement.dataset.thema='licht';document.querySelector('meta[name=theme-color]').content='#EEF0F3';}`
   Wordt:
   `if(localStorage.getItem('sisu.thema')==='donker')document.documentElement.dataset.thema='donker';`
   De rest van dat script (tekstgrootte) blijft.
4. `index.html`: zet in de bovenbalk, direct vóór `<a class="hbtn" … id="hset">`, de knop
   `<button class="hbtn" id="hthema" type="button" data-thema-knop aria-label="Donkere stand" aria-pressed="false"></button>`
   en laad `<script src="shared/thema.js"></script>` vóór `shared/store.js`. `thema.js` vult het icoon zelf in.
5. `instellingen.html`: geef de knop `id="buiten"` het attribuut `data-thema-knop`, en de tekst "Donkere stand" met de uitleg hierboven. Haal het oude script "Buitenmodus aan/uit" weg (`thema.js` doet het nu) en laad `shared/thema.js`.
6. `paf.html`: laad `shared/thema.js` (onderaan, vóór `</body>`).
7. `sw.js`: zet `shared/thema.js` in `FILES` en hoog de cachenaam op naar `schouw-v100`. `shared/versie.js`: nummer 100 met de datum van vandaag.

`voorbeeld-wijzigingen.diff` laat stap 3 t/m 6 precies zien.

**Klaar als:**
- de app zonder opgeslagen keuze licht opent, en met `sisu.thema = 'licht'` (oude instelling) ook;
- één tik op de maan de app donker maakt, dat na herladen zo blijft, en de schakelaar in Instellingen dan aan staat;
- de schakelaar in Instellingen terugzet naar licht;
- logo en bolletjes er in beide standen precies zo uitzien als nu;
- "3 nog te doen" in beide standen een gele balk met zwarte tekst is;
- bestaande schouwen er nog staan.

Let op: wie de app nu in de donkere standaard gebruikt (zonder opgeslagen keuze), ziet na deze versie de lichte stand. Eén tik op de maan zet hem terug.
