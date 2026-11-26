/* Alle velden van het Sisu site survey document (voorbeeld: Oranjelaan 2, Oegstgeest),
   met per veld twee instellingen:
     in  = input (vóór het schouwen):  'verplicht' | 'wenselijk' | 'nee'
     uit = output (in het document):   'verplicht' | 'wenselijk' | 'nee'
   Verplicht bij input = vragen we vóór het schouwen ("Nog X gegevens vooraf").
   Verplicht bij output = nodig voor een compleet document; wenselijk = komt in het document als het is ingevuld.
   s = sectie in het document; g = sectie in het gegevensscherm (als die anders is).
   Ook: statussen van een schouw (uitwerking, afronding, klaar; archief is een vlag) en voortgang. */
(function(){
  const V='verplicht',W='wenselijk',N='nee';
  /* naam = kop in het document, kort = naam in het gegevensscherm, moment = wanneer je het invult,
     ic = icoon (svg-pad, 24x24), sub = korte omschrijving, lijst:false = niet in het gegevensscherm */
  const SECTIES=[
    {id:'alg',naam:'Algemene gegevens',kort:'Algemene gegevens',moment:'vooraf',sub:'Projectnummer, type, datum',ic:'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h5'},
    {id:'aanw',naam:'Aanwezigen',kort:'Aanwezigen',moment:'terplekke',sub:'Organisatie en aannemer',ic:'M9 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 5a3 3 0 0 1 0 6 M18 14.3c1.8.8 3 2.7 3 5.7'},
    {id:'klant',naam:'Gegevens klant',kort:'Klant',moment:'vooraf',sub:'Adres en contactpersoon',ic:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8'},
    {id:'loc',naam:'Gegevens locatie',kort:'Locatie',moment:'vooraf',sub:'Gebouw en adres',ic:'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'},
    {id:'eig',naam:'Eigenaar gebouw',kort:'Eigenaar gebouw',moment:'vooraf',sub:'Eigenaar en akkoord',ic:'M4 21V5l8-3v19 M12 8l8 3v10 M2 21h20 M7.5 8v.01 M7.5 12v.01 M7.5 16v.01'},
    {id:'aanm',naam:'Aanmelden werkzaamheden',kort:'Aanmelden werkzaamheden',moment:'vooraf',sub:'Contact en dagen vooraf',ic:'M4 6h16v15H4z M4 10h16 M8 3v5 M16 3v5'},
    {id:'afw',naam:'Afwerkpunt klantlocatie',kort:'Afwerkpunt klantlocatie',moment:'terplekke',sub:'Kast, ruimte, foto',ic:'M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h6'},
    {id:'trace',naam:'Tracé',kort:'Tracé',moment:'achteraf',sub:'Kaart en plattegrond',ic:'M5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M19 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M7 18h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6'},
    {id:'buiten',naam:'Buiten tracé',kort:'Buiten tracé',moment:'terplekke',lijst:false},
    {id:'binnen',naam:'Binnen tracé',kort:'Binnen tracé',moment:'terplekke',sub:'Kabelgoot, doorvoeren, stroom',ic:'M3 11l9-7 9 7 M5 10v11h14V10 M10 21v-6h4v6'},
    {id:'vg',naam:'V&G ontwerpnota',kort:'V&G',moment:'terplekke',sub:"Situaties, risico's en afspraken",ic:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4'},
    {id:'leg',naam:'Legenda',kort:'Legenda',moment:'achteraf',lijst:false}
  ];
  const MOMENT={vooraf:'vooraf',terplekke:'ter plekke',achteraf:'achteraf'};
  const nietEigenaar={veld:'eig_klant_is_eigenaar',is:'Nee'};
  const geenOnnet={veld:'type_aansluiting',niet:'ONNET'};
  // type: text | lang | datum | tel | mail | getal | keuze | janee | foto | fotos | vg | legenda | teller
  const VELDEN=[
    {k:'projectnummer',s:'alg',l:'Projectnummer',t:'text',in:V,uit:V,vb:'5222119 - 00172403 - 00046005-SID000883900'},
    {k:'type_aansluiting',s:'alg',l:'Type aansluiting',t:'keuze',opties:['OFFNET','ONNET'],streng:true,in:V,uit:V,vb:'OFFNET (buiten en binnen) of ONNET (alleen binnen)'},
    {k:'datum_survey',s:'alg',l:'Datum site survey',t:'datum',in:W,uit:V,vb:'07-11-2025'},
    {k:'aanw_org_naam',s:'alg',g:'aanw',l:'Aanwezig organisatie: naam',t:'text',in:W,uit:W,vb:'Dhr. J. Jansen'},
    {k:'aanw_org_bedrijf',s:'alg',g:'aanw',l:'Aanwezig organisatie: bedrijf',t:'text',in:W,uit:W,vb:'Woningcorporatie'},
    {k:'aanw_org_tel',s:'alg',g:'aanw',l:'Aanwezig organisatie: telefoon',t:'tel',in:W,uit:W,vb:'06-12345678'},
    {k:'aanw_aan_naam',s:'alg',g:'aanw',pre:true,l:'Aanwezig aannemer: naam',t:'text',in:W,uit:W,vb:'Dhr. P. de Vries'},
    {k:'aanw_aan_bedrijf',s:'alg',g:'aanw',pre:true,l:'Aanwezig aannemer: bedrijf',t:'text',in:W,uit:W,vb:'BAM'},
    {k:'aanw_aan_tel',s:'alg',g:'aanw',pre:true,l:'Aanwezig aannemer: telefoon',t:'tel',in:W,uit:W,vb:'06-12345678'},
    {k:'afh_org',s:'alg',l:'Afhankelijkheden organisatie (onderwerp, datum gereed)',t:'lang',in:N,uit:W},
    {k:'afh_aan',s:'alg',l:'Afhankelijkheden aannemer (onderwerp, datum gereed)',t:'lang',in:N,uit:W},

    {k:'klant_org',s:'klant',l:'Organisatie',t:'text',in:W,uit:W},
    {k:'klant_adres',s:'klant',l:'Adres',t:'text',in:V,uit:V,vb:'Oranjelaan 2'},
    {k:'klant_postcode',s:'klant',l:'Postcode',t:'text',in:V,uit:V,vb:'2341CC'},
    {k:'klant_plaats',s:'klant',l:'Plaats',t:'text',in:V,uit:V,vb:'Oegstgeest'},
    {k:'klant_contact',s:'klant',l:'Contactpersoon',t:'text',in:V,uit:V,vb:'Dhr. R. Jansen'},
    {k:'klant_tel',s:'klant',l:'Telefoonnummer',t:'tel',in:V,uit:V,vb:'06-12345678'},
    {k:'klant_mail',s:'klant',l:'E-mail',t:'mail',in:W,uit:W,vb:'naam@bedrijf.nl'},

    {k:'loc_zelfde',s:'loc',l:'Zelfde als klant',t:'janee',schakel:true,std:'Ja',bron:{loc_adres:'klant_adres',loc_postcode:'klant_postcode',loc_plaats:'klant_plaats'},in:N,uit:N},
    {k:'loc_gebouw',s:'loc',l:'Gebouwnaam',t:'text',in:W,uit:W},
    {k:'loc_soort',s:'loc',l:'Soort gebouw',t:'text',in:W,uit:V,vb:'Studentenhuisvesting'},
    {k:'loc_adres',s:'loc',zelfde:{veld:'loc_zelfde',bron:'klant_adres'},l:'Adres',t:'text',in:V,uit:V,vb:'Oranjelaan 2'},
    {k:'loc_postcode',s:'loc',zelfde:{veld:'loc_zelfde',bron:'klant_postcode'},l:'Postcode',t:'text',in:V,uit:V,vb:'2341CC'},
    {k:'loc_plaats',s:'loc',zelfde:{veld:'loc_zelfde',bron:'klant_plaats'},l:'Plaats',t:'text',in:V,uit:V,vb:'Oegstgeest'},

    {k:'eig_klant_is_eigenaar',s:'eig',l:'Is de klant eigenaar van het gebouw?',t:'janee',in:V,uit:V,vb:'Ja'},
    {k:'eig_naam',s:'eig',l:'Naam eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_adres',s:'eig',l:'Adres eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_postcode',s:'eig',l:'Postcode eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_plaats',s:'eig',l:'Plaats eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_contact',s:'eig',l:'Contactpersoon eigenaar (akkoord aanleg)',t:'text',in:V,uit:V,als:nietEigenaar},
    {k:'eig_tel',s:'eig',l:'Telefoon eigenaar',t:'tel',in:V,uit:V,als:nietEigenaar},
    {k:'eig_mail',s:'eig',l:'E-mail eigenaar',t:'mail',in:W,uit:W,als:nietEigenaar},

    {k:'aanm_zelfde',s:'aanm',l:'Zelfde als contactpersoon klant',t:'janee',schakel:true,std:'Ja',bron:{aanm_naam:'klant_contact',aanm_tel:'klant_tel',aanm_mail:'klant_mail'},in:N,uit:N},
    {k:'aanm_naam',s:'aanm',zelfde:{veld:'aanm_zelfde',bron:'klant_contact'},l:'Naam',t:'text',in:W,uit:V,vb:'Dhr. R. Jansen'},
    {k:'aanm_tel',s:'aanm',zelfde:{veld:'aanm_zelfde',bron:'klant_tel'},l:'Telefoon',t:'tel',in:W,uit:V,vb:'06-12345678'},
    {k:'aanm_mail',s:'aanm',zelfde:{veld:'aanm_zelfde',bron:'klant_mail'},l:'E-mail',t:'mail',in:W,uit:W,vb:'naam@bedrijf.nl'},
    {k:'aanm_dagen',s:'aanm',l:'Aantal dagen vooraf',t:'getal',in:W,uit:V,vb:'5'},

    {k:'afw_plaats',s:'afw',l:'Plaatsbepaling 19" kast',t:'text',in:N,uit:V,vb:'Begane grond'},
    {k:'afw_ruimte',s:'afw',l:'Ruimtebenaming',t:'text',in:N,uit:V,vb:'Ruimte onder de trap'},
    {k:'afw_kast',s:'afw',l:'Kastbenaming',t:'text',in:N,uit:V,vb:'Wandmontage'},
    {k:'afw_apparatuur',s:'afw',l:'Type apparatuur',t:'text',in:N,uit:V,vb:'WODF + CPE'},
    {k:'afw_foto',s:'afw',l:'Afbeelding kast',kort:'Afwerkpunt klantlocatie (kast)',t:'foto',in:N,uit:V,vb:'foto van de plek waar de kast komt'},

    {k:'trace_geo',s:'trace',l:'Geografische weergave (kaart met tracé)',t:'foto',in:W,uit:V,vb:'luchtfoto of kaart met het tracé ingetekend'},
    {k:'trace_opm',s:'trace',l:'Opmerking bij tracé',t:'lang',in:N,uit:W,vb:'Invoer ongeveer 3 meter uit rechterhoek'},
    {k:'plattegrond',s:'trace',l:'Plattegrond (indien beschikbaar)',t:'foto',in:W,uit:W,nvt:'NIET BESCHIKBAAR',vb:'NIET BESCHIKBAAR'},

    {k:'buiten_meters',s:'buiten',als:geenOnnet,l:'Aantal meters buiten tracé',t:'teller',teller:'meters',in:N,uit:V,vb:'15 meter'},
    {k:'buiten_invoeringen',s:'buiten',als:geenOnnet,l:'Aantal invoeringen',t:'teller',teller:'invoeringen',in:N,uit:V,vb:'1'},
    {k:'buiten_boringen',s:'buiten',als:geenOnnet,l:'Aantal boringen/persingen',t:'teller',teller:'boringen',in:N,uit:W},
    {k:'foto_aansluit',s:'buiten',als:geenOnnet,l:'Foto aansluitpunt netwerk',kort:'Aansluitpunt netwerk',t:'rolfoto',rol:'aansluit',sectie:'buiten',in:N,uit:V,vb:'eerste foto: waar de kabel op het netwerk aansluit'},
    {k:'foto_invoer',s:'buiten',als:geenOnnet,l:'Foto invoer pand',kort:'Invoer pand',t:'rolfoto',rol:'invoer',sectie:'buiten',in:N,uit:V,vb:'waar de kabel het pand in gaat (buitenkant)'},
    {k:'buiten_fotos',s:'buiten',als:geenOnnet,l:"Foto's buiten tracé",t:'fotos',sectie:'buiten',in:N,uit:V,vb:'7 foto\'s met pijl en bijschrift'},

    {k:'binnen_meters',s:'binnen',l:'Aantal meters binnen tracé',kort:'Meters binnen tracé',t:'teller',teller:'metersBinnen',in:N,uit:V,vb:'12 meter DB2 door de kruipruimte + 2 meter DB1'},
    {k:'binnen_kabelgoot',s:'binnen',l:'Nieuw aan te leggen kabelgoot',t:'getal',stap:true,in:N,uit:W,vb:'0'},
    {k:'binnen_brandwerend',s:'binnen',l:'Brandwerende doorvoeren',t:'getal',stap:true,in:N,uit:W,vb:'0'},
    {k:'foto_begin',s:'binnen',l:'Foto beginpunt / invoer binnen',kort:'Beginpunt / invoer',t:'rolfoto',rol:'begin',sectie:'binnen',in:N,uit:V,vb:'waar de kabel binnenkomt (binnenkant)'},
    {k:'binnen_fotos',s:'binnen',l:"Foto's binnen tracé",t:'fotos',sectie:'binnen',in:N,uit:W,vb:'8 foto\'s met pijl en bijschrift'},
    {k:'binnen_stroom',s:'binnen',l:'Stroomvoorziening',t:'lang',in:N,uit:V,vb:'Stroomvoorziening in de ruimte onder de trap aanwezig'},

    {k:'vg',s:'vg',l:'V&G ontwerpnota (aspecten, risico’s, afspraken)',t:'vg',in:N,uit:V,vb:'werken in kruipruimte: beknelling, verstikking, elektrocutie → mangatwacht, helm, verlichting'},
    {k:'legenda',s:'leg',l:'Legenda',t:'legenda',in:N,uit:W,vast:'in',vb:'nieuw tracé, bestaande buis, koppeling, handhole, invoer'}
  ];
  /* V&G-aspecten zoals in de ontwerpnota, met de gebruikelijke risico's en afspraken */
  const VG=[
    ['Werkzaamheden','civiele werkzaamheden','Stil leggen werkzaamheden',''],
    ['Werkzaamheden','kabelwerkzaamheden','',''],
    ['Werkzaamheden','montage werkzaamheden','Afkeuring door klant',''],
    ['Inpandig','gebouwkenmerk van eigenaar/derden','',''],
    ['Inpandig','exploitatiewerkzaamheden eigenaar/derden','',''],
    ['Inpandig','werken in kruipruimte','Beknelling, verstikking, elektrocutie','Mangatwacht, dragen helm, verlichting'],
    ['Inpandig','werken op hoogten/verdiepingen','Valgevaar','(Rol)steiger e.d. Oplettendheid'],
    ['Inpandig','werken in kabelschacht','Beknelling, snijden',''],
    ['Inpandig','werken in kabelgoot','Snijden, elektrocutie, draagkracht','Gebruik PBM'],
    ['Inpandig','toegang tot gebouw, ruimte','',''],
    ['Inpandig','werken op werkvloeren','',''],
    ['Inpandig','werken met open vuur','',''],
    ['Inpandig','werken met vluchtige stoffen','',''],
    ['Inpandig','type blusinstallatie (argon)','',''],
    ['Inpandig','tillen van zware voorwerpen','Ongelukken',''],
    ['Inpandig','werken in onverlichte ruimten','','Lichtvoorzieningen'],
    ['Inpandig','invloeden derden','',''],
    ['Inpandig','boren, hakken, breken','','PBM gebruiken'],
    ['Inpandig','aanleg elektrische voorzieningen','',''],
    ['Omgeving','toegang tot terrein','Beknelling, aanrijding','Werken volgens CROW'],
    ['Omgeving','werken langs de weg','Aanrijdingen','Werken volgens CROW'],
    ['Omgeving','werken bij water','',''],
    ['Omgeving','werken langs het spoor','',''],
    ['Omgeving','explosieve stoffen','',''],
    ['Omgeving','(hoog)spanning','Elektrocutie','KLIC-melding'],
    ['Omgeving','giftige stoffen vanwege exploitatie derden','',''],
    ['Bodem','bestaande kabels en leidingen','Elektrocutie','KLIC-melding'],
    ['Bodem','oppervlaktewater, grondwaterstand','',''],
    ['Bodem','werken in getijdengebieden','',''],
    ['Bodem','bestaande funderingen','Beknelling','Mangatwacht'],
    ['Bodem','verontreiniging','Geen toestemming grondeigenaar','Werken met een gecertificeerde aannemer'],
    ['Planning','werken op specifieke dagen','','Afstemming met klant en opdrachtgever'],
    ['Planning','overwerk','',''],
    ['Planning',"werken 's nachts",'',''],
    ['Planning','duur bouwtijd','','']
  ].map((r,i)=>({id:'a'+i,groep:r[0],aspect:r[1],risico:r[2],afspraak:r[3]}));

  /* V&G: de 8 situaties die het vaakst voorkomen (grote tegels) */
  const VG_VAAK=['werken in kruipruimte','werken op hoogten/verdiepingen','werken in kabelschacht','werken in kabelgoot','boren, hakken, breken','toegang tot gebouw, ruimte','werken langs de weg','bestaande kabels en leidingen']
    .map(a=>VG.find(x=>x.aspect===a).id);
  /* voorgesteld (niet automatisch aangevinkt): bij foto's binnen of buiten */
  const VG_VOORSTEL={binnen:['boren, hakken, breken','toegang tot gebouw, ruimte'],buiten:['bestaande kabels en leidingen','werken langs de weg']};
  /* contactkaarten: velden die bij elkaar horen */
  const CONTACTEN=[
    {id:'c_org',titel:'Organisatie',naam:'aanw_org_naam',bedrijf:'aanw_org_bedrijf',tel:'aanw_org_tel'},
    {id:'c_aan',titel:'Aannemer',naam:'aanw_aan_naam',bedrijf:'aanw_aan_bedrijf',tel:'aanw_aan_tel'},
    {id:'c_klant',titel:'Contactpersoon klant',naam:'klant_contact',bedrijf:'klant_org',tel:'klant_tel',mail:'klant_mail'},
    {id:'c_eig',titel:'Contactpersoon eigenaar',naam:'eig_contact',tel:'eig_tel',mail:'eig_mail'}
  ];

  const STATUS=[
    {id:'uitwerking',naam:'Uitwerking',kleur:'var(--st-intake)'},
    {id:'afronding',naam:'Afronding',kleur:'var(--st-gelopen)'},
    {id:'klaar',naam:'Klaar',kleur:'var(--st-klaar)'}
  ];
  /* oude statussen omzetten (de nieuwe waarde wordt pas bij de volgende keer opslaan geschreven):
     open/new/leeg/intake/voorbereiden/schouwen -> uitwerking, gelopen/controleren -> afronding,
     klaar en archief -> klaar (archief = vlag gearchiveerd) */
  const OUD={open:'uitwerking',new:'uitwerking',intake:'uitwerking',voorbereiden:'uitwerking',schouwen:'uitwerking',gelopen:'afronding',controleren:'afronding',archief:'klaar'};
  const statusOf=s=>{const v=s&&s.status;if(!v)return'uitwerking';if(STATUS.some(x=>x.id===v))return v;return OUD[v]||'uitwerking';};
  const statusMeta=id=>STATUS.find(x=>x.id===id)||STATUS[0];
  const gearchiveerd=s=>!!s&&(s.gearchiveerd===true||(s.status==='archief'&&s.gearchiveerd!==false));

  /* ---- instellingen ---- */
  const KEY='sisu.velden';
  function cfg(){let c={};try{c=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
    const out={};VELDEN.forEach(f=>{const o=c[f.k]||{};out[f.k]=f.schakel?{in:N,uit:N}:{in:f.vast==='in'?N:(o.in||f.in),uit:o.uit||f.uit};});return out;}
  function setCfg(k,kant,v){let c={};try{c=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}c[k]={...(c[k]||{}),[kant]:v};try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}}
  function resetCfg(){try{localStorage.removeItem(KEY);}catch(e){}}

  /* ---- waarden ---- */
  // het startadres van de schouw ("Oranjelaan 2, Oegstgeest") als voorstel voor adres en plaats
  function adresDelen(s){const a=(s.adres||'').split(',').map(x=>x.trim());return{adres:a[0]||'',plaats:a.slice(1).join(', ')};}
  const leeg=v=>v==null||String(v).trim()==='';
  function waarde(s,k){
    const f=VELDEN.find(x=>x.k===k),v=(s.velden||{})[k];
    if(f&&f.t==='teller'){const t=(s.tellers||{})[f.teller];if(t==null&&f.teller==='metersBinnen')return binnenOud(s).m;return t;}
    // "zelfde als": waarde komt van de bron zolang de schakelaar aan staat
    if(f&&f.zelfde&&zelfdeAan(s,f.zelfde.veld))return waarde(s,f.zelfde.bron);
    if(!leeg(v))return v;
    if(f&&f.pre){const d=standaard()[k];if(!leeg(d))return d;}
    if(f&&f.schakel)return zelfdeAan(s,k)?'Ja':'Nee';
    const ad=adresDelen(s);
    if(k==='loc_adres'||k==='klant_adres')return ad.adres||'';
    if(k==='loc_plaats'||k==='klant_plaats')return ad.plaats||'';
    if(k==='datum_survey'){const d=s.eersteFoto||s.gelopenOp;if(d)return d.slice(0,10);}
    return v;
  }
  /* schakelaar "zelfde als": standaard aan; bij oude schouwen met een eigen (andere) waarde uit */
  function zelfdeAan(s,k){
    const v=(s.velden||{})[k];if(v==='Ja')return true;if(v==='Nee')return false;
    const f=VELDEN.find(x=>x.k===k),vv=s.velden||{};
    return !Object.entries(f.bron).some(([doel,bron])=>!leeg(vv[doel])&&String(vv[doel]).trim()!==String(waarde(s,bron)||'').trim());
  }
  function verborgen(s,f){return !!(f.zelfde&&zelfdeAan(s,f.zelfde.veld));}
  /* oude tekst bij meters binnen ("12 meter DB2 …"): eerste getal = meters, de rest gaat naar de opmerking bij tracé */
  function binnenOud(s){const v=(s.velden||{}).binnen_meters;if(v==null||typeof v==='number')return{m:v,rest:''};
    const t=String(v),m=t.match(/\d+(?:[.,]\d+)?/);if(!m)return{m:undefined,rest:t.trim()};
    return{m:parseFloat(m[0].replace(',','.')),rest:(t.slice(0,m.index)+t.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim()};}
  /* oude waarden omzetten; geeft true als er iets veranderd is (opslaan doet de aanroeper) */
  function migreer(s){let ch=false;const vv={...(s.velden||{})};
    if(typeof vv.binnen_meters==='string'){const o=binnenOud(s);
      if((s.tellers||{}).metersBinnen==null&&o.m!=null)s.tellers={...(s.tellers||{}),metersBinnen:o.m};
      const rest=o.m==null?vv.binnen_meters.trim():o.rest.replace(/^(meter|m)\b\s*/i,'').trim();
      if(rest)vv.trace_opm=vv.trace_opm?vv.trace_opm+'\n'+rest:rest;
      delete vv.binnen_meters;ch=true;}
    ['binnen_kabelgoot','binnen_brandwerend'].forEach(k=>{if(typeof vv[k]==='string'){const n=parseFloat(vv[k].replace(',','.'));
      if(isFinite(n)){vv[k]=n;}else if(vv[k].trim()){vv.trace_opm=(vv.trace_opm?vv.trace_opm+'\n':'')+vv[k].trim();delete vv[k];}else delete vv[k];ch=true;}});
    if(ch)s.velden=vv;return ch;}
  function zet(s,k,v){s.velden={...(s.velden||{}),[k]:v};}
  /* telt een veld mee? (bijv. eigenaar-velden alleen als de klant geen eigenaar is) */
  function actief(s,f){if(!f.als)return true;const v=waarde(s,f.als.veld)||'';return f.als.niet!=null?v!==f.als.niet:v===f.als.is;}
  /* ONNET: geen buiten tracé; foto's horen dan bij binnen */
  const onnet=s=>(waarde(s,'type_aansluiting')||'')==='ONNET';
  /* bij ONNET: schouw en foto's naar binnen zetten; geeft de gewijzigde foto's terug (opslaan doet de aanroeper) */
  function onnetFix(s,fotos){if(!onnet(s))return[];if(s.sectie!=='binnen')s.sectie='binnen';
    return (fotos||[]).filter(p=>(p.sectie||'buiten')!=='binnen').map(p=>{p.sectie='binnen';return p;});}
  /* standaardwaarden uit de instellingen (bijv. de vaste aannemer); per schouw aan te passen */
  const STD_KEY='sisu.standaard';
  function standaard(){try{return JSON.parse(localStorage.getItem(STD_KEY)||'{}')||{};}catch(e){return{};}}
  function setStandaard(k,v){const o=standaard();if(v==null||String(v).trim()==='')delete o[k];else o[k]=v;localStorage.setItem(STD_KEY,JSON.stringify(o));}
  const groep=f=>f.g||f.s;
  /* staat dit veld in het gegevensscherm? (tellers, foto-reeksen en de legenda niet) */
  const inLijst=f=>!['teller','fotos','rolfoto','legenda'].includes(f.t);
  /* verplichte foto's met een rol (aansluitpunt, invoer pand, beginpunt binnen) per sectie */
  /* naam van de schouw (s.adres) uit het klantadres als die nog leeg is of de bestandsnaam van een PAF; geeft true als hij veranderd is */
  function adresNaam(s){const vv=s.velden||{},bn=s.paf&&s.paf.bestand?s.paf.bestand.replace(/\.pdf$/i,''):null;
    if(s.adres&&s.adres!==bn)return false;
    const a=String(vv.klant_adres||'').trim(),pl=String(vv.klant_plaats||'').trim(),n=a?a+(pl?', '+pl:''):'';
    if(n){if(s.adres===n)return false;s.adres=n;return true;}
    if(s.adres&&s.adres===bn){s.adres='';return true;}return false;}
  const ROLLEN=s=>VELDEN.filter(f=>f.t==='rolfoto'&&actief(s,f)&&cfg()[f.k].uit!=='nee');
  /* verplicht voor het scherm: kant 'in' (vooraf), 'uit' (document) of beide */
  function nodig(c,f,kant){const x=c[f.k];return kant?x[kant]==='verplicht':(x.in==='verplicht'||x.uit==='verplicht');}
  function zichtbaar(c,f){const x=c[f.k];return f.schakel||x.in!=='nee'||x.uit!=='nee';}
  /* nog te doen, gesplitst in informatie en foto's (foto-velden en foto-reeksen); kant 'uit' = voor het document */
  function todo(s,fotos,kant){const c=cfg(),info=[],ft=[];
    VELDEN.forEach(f=>{if(f.schakel||f.t==='legenda'||!actief(s,f)||verborgen(s,f)||!nodig(c,f,kant)||gevuld(s,f,fotos))return;
      (f.t==='foto'||f.t==='fotos'?ft:info).push(f);});
    return{info,fotos:ft};}
  /* vakken op het schouwscherm: informatie, foto's buiten (tracé buiten) en foto's binnen (binnen tracé + afwerkpunt/kast) */
  const vak=f=>f.s==='buiten'?'buiten':(f.s==='binnen'||f.s==='afw')?'binnen':'info';
  const VAK_SECTIES={buiten:['buiten'],binnen:['binnen','afw']};
  function vakken(s,fotos,kant){const c=cfg(),o={info:[],buiten:[],binnen:[]};
    VELDEN.forEach(f=>{if(f.schakel||f.t==='legenda'||!actief(s,f)||verborgen(s,f)||!nodig(c,f,kant)||gevuld(s,f,fotos))return;o[vak(f)].push(f);});
    return o;}
  /* open verplichte velden per sectie van het gegevensscherm: [{sc, velden, open}] */
  function secties(s,fotos,o={}){
    const c=cfg();
    // bij moment 'vooraf' met kant 'in' tellen ook andere secties mee als daar iets verplicht is bij input
    return SECTIES.filter(sc=>sc.lijst!==false).map(sc=>{
      const fs=VELDEN.filter(f=>groep(f)===sc.id&&inLijst(f)&&zichtbaar(c,f)&&actief(s,f));
      const open=fs.filter(f=>!f.schakel&&!verborgen(s,f)&&nodig(c,f,o.kant)&&!gevuld(s,f,fotos));
      return{sc,velden:fs,open};}).filter(x=>x.velden.length&&!(o.zonder||[]).includes(x.sc.id)&&(!o.moment||x.sc.moment===o.moment||(o.kant==='in'&&x.open.length)));
  }
  function gevuld(s,f,fotos){
    const v=waarde(s,f.k);
    switch(f.t){
      case 'teller':return f.teller==='meters'||f.teller==='metersBinnen'?(+v>0):(v!=null&&v!=='');
      case 'rolfoto':return (fotos||[]).some(p=>p.status!=='vervallen'&&p.rol===f.rol);
      case 'fotos':return (fotos||[]).some(p=>p.status!=='vervallen'&&(p.sectie||'buiten')===f.sectie);
      case 'foto':return !!((s.bijlagen||{})[f.k])||v==='nvt';
      case 'vg':return !!(v&&v.nagelopen);
      case 'legenda':return true;
      case 'keuze':if(f.streng)return f.opties.includes(v); // oude waarde (FTTS, Anders) telt als leeg: opnieuw kiezen
      default:return v!=null&&String(v).trim()!=='';
    }
  }
  /* voortgang: kant = 'in' of 'uit' */
  function voortgang(s,fotos,kant){
    const c=cfg(),fs=VELDEN.filter(f=>c[f.k][kant]==='verplicht'&&actief(s,f));
    const mis=fs.filter(f=>!gevuld(s,f,fotos));
    return{klaar:fs.length-mis.length,totaal:fs.length,mist:mis,pct:fs.length?Math.round((fs.length-mis.length)/fs.length*100):100};
  }
  window.Velden={VELDEN,SECTIES,MOMENT,VG,VG_VAAK,VG_VOORSTEL,CONTACTEN,STATUS,V,W,N,cfg,setCfg,resetCfg,waarde,zet,actief,gevuld,voortgang,
    ROLLEN,todo,vak,vakken,VAK_SECTIES,onnet,onnetFix,adresNaam,standaard,setStandaard,statusOf,statusMeta,gearchiveerd,groep,inLijst,nodig,secties,verborgen,zelfdeAan,migreer};
})();
