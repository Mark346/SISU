/* Alle velden van het Sisu site survey document (voorbeeld: Oranjelaan 2, Oegstgeest),
   met per veld twee instellingen:
     in  = intake (vóór het lopen):   'verplicht' | 'wenselijk' | 'nee'
     uit = output (in het document):  'verplicht' | 'wenselijk' | 'nee'
   Verplicht bij intake = nodig voor status "intake compleet".
   Verplicht bij output = nodig voor status "klaar"; wenselijk = komt in het document als het is ingevuld.
   Ook: statussen van een schouw en voortgang. */
(function(){
  const V='verplicht',W='wenselijk',N='nee';
  const SECTIES=[
    {id:'alg',naam:'Algemene gegevens'},
    {id:'klant',naam:'Gegevens klant'},
    {id:'loc',naam:'Gegevens locatie'},
    {id:'eig',naam:'Eigenaar gebouw'},
    {id:'aanm',naam:'Aanmelden werkzaamheden'},
    {id:'afw',naam:'Afwerkpunt klantlocatie'},
    {id:'trace',naam:'Tracé'},
    {id:'buiten',naam:'Buiten tracé'},
    {id:'binnen',naam:'Binnen tracé'},
    {id:'vg',naam:'V&G ontwerpnota'},
    {id:'leg',naam:'Legenda'}
  ];
  const nietEigenaar={veld:'eig_klant_is_eigenaar',is:'Nee'};
  // type: text | lang | datum | tel | mail | getal | keuze | janee | foto | fotos | vg | legenda | teller
  const VELDEN=[
    {k:'projectnummer',s:'alg',l:'Projectnummer',t:'text',in:V,uit:V,vb:'5222119 - 00172403 - 00046005-SID000883900'},
    {k:'type_aansluiting',s:'alg',l:'Type aansluiting',t:'keuze',opties:['OFFNET','ONNET','FTTS','Anders'],in:V,uit:V,vb:'OFFNET'},
    {k:'datum_survey',s:'alg',l:'Datum site survey',t:'datum',in:W,uit:V,vb:'07-11-2025'},
    {k:'aanw_org_naam',s:'alg',l:'Aanwezig organisatie: naam',t:'text',in:W,uit:W,vb:'Dhr. J. Jansen'},
    {k:'aanw_org_bedrijf',s:'alg',l:'Aanwezig organisatie: bedrijf',t:'text',in:W,uit:W,vb:'Duwo'},
    {k:'aanw_org_tel',s:'alg',l:'Aanwezig organisatie: telefoon',t:'tel',in:W,uit:W,vb:'06-12345678'},
    {k:'aanw_aan_naam',s:'alg',l:'Aanwezig aannemer: naam',t:'text',in:W,uit:W,vb:'Dhr. P. de Vries'},
    {k:'aanw_aan_bedrijf',s:'alg',l:'Aanwezig aannemer: bedrijf',t:'text',in:W,uit:W,vb:'BAM'},
    {k:'aanw_aan_tel',s:'alg',l:'Aanwezig aannemer: telefoon',t:'tel',in:W,uit:W,vb:'06-12345678'},
    {k:'afh_org',s:'alg',l:'Afhankelijkheden organisatie (onderwerp, datum gereed)',t:'lang',in:N,uit:W},
    {k:'afh_aan',s:'alg',l:'Afhankelijkheden aannemer (onderwerp, datum gereed)',t:'lang',in:N,uit:W},

    {k:'klant_org',s:'klant',l:'Organisatie',t:'text',in:W,uit:W},
    {k:'klant_adres',s:'klant',l:'Adres',t:'text',in:V,uit:V,vb:'Oranjelaan 2'},
    {k:'klant_postcode',s:'klant',l:'Postcode',t:'text',in:V,uit:V,vb:'2341CC'},
    {k:'klant_plaats',s:'klant',l:'Plaats',t:'text',in:V,uit:V,vb:'Oegstgeest'},
    {k:'klant_contact',s:'klant',l:'Contactpersoon',t:'text',in:V,uit:V,vb:'Dhr. R. Jansen'},
    {k:'klant_tel',s:'klant',l:'Telefoonnummer',t:'tel',in:V,uit:V,vb:'06-12345678'},
    {k:'klant_mail',s:'klant',l:'E-mail',t:'mail',in:W,uit:W,vb:'naam@duwo.nl'},

    {k:'loc_gebouw',s:'loc',l:'Gebouwnaam',t:'text',in:W,uit:W},
    {k:'loc_soort',s:'loc',l:'Soort gebouw',t:'text',in:W,uit:V,vb:'Studentenhuisvesting'},
    {k:'loc_adres',s:'loc',l:'Adres',t:'text',in:V,uit:V,vb:'Oranjelaan 2'},
    {k:'loc_postcode',s:'loc',l:'Postcode',t:'text',in:V,uit:V,vb:'2341CC'},
    {k:'loc_plaats',s:'loc',l:'Plaats',t:'text',in:V,uit:V,vb:'Oegstgeest'},

    {k:'eig_klant_is_eigenaar',s:'eig',l:'Is de klant eigenaar van het gebouw?',t:'janee',in:V,uit:V,vb:'Ja'},
    {k:'eig_naam',s:'eig',l:'Naam eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_adres',s:'eig',l:'Adres eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_postcode',s:'eig',l:'Postcode eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_plaats',s:'eig',l:'Plaats eigenaar',t:'text',in:W,uit:W,als:nietEigenaar},
    {k:'eig_contact',s:'eig',l:'Contactpersoon eigenaar (akkoord aanleg)',t:'text',in:V,uit:V,als:nietEigenaar},
    {k:'eig_tel',s:'eig',l:'Telefoon eigenaar',t:'tel',in:V,uit:V,als:nietEigenaar},
    {k:'eig_mail',s:'eig',l:'E-mail eigenaar',t:'mail',in:W,uit:W,als:nietEigenaar},

    {k:'aanm_naam',s:'aanm',l:'Naam',t:'text',in:W,uit:V,vb:'Dhr. R. Jansen'},
    {k:'aanm_tel',s:'aanm',l:'Telefoon',t:'tel',in:W,uit:V,vb:'06-12345678'},
    {k:'aanm_mail',s:'aanm',l:'E-mail',t:'mail',in:W,uit:W,vb:'naam@duwo.nl'},
    {k:'aanm_dagen',s:'aanm',l:'Aantal dagen vooraf',t:'getal',in:W,uit:V,vb:'5'},

    {k:'afw_plaats',s:'afw',l:'Plaatsbepaling 19" kast',t:'text',in:N,uit:V,vb:'Begane grond'},
    {k:'afw_ruimte',s:'afw',l:'Ruimtebenaming',t:'text',in:N,uit:V,vb:'Ruimte onder de trap'},
    {k:'afw_kast',s:'afw',l:'Kastbenaming',t:'text',in:N,uit:V,vb:'Wandmontage'},
    {k:'afw_apparatuur',s:'afw',l:'Type apparatuur',t:'text',in:N,uit:V,vb:'WODF + CPE'},
    {k:'afw_foto',s:'afw',l:'Afbeelding kast',t:'foto',in:N,uit:V,vb:'foto van de plek waar de kast komt'},

    {k:'trace_geo',s:'trace',l:'Geografische weergave (kaart met tracé)',t:'foto',in:W,uit:V,vb:'luchtfoto of kaart met het tracé ingetekend'},
    {k:'trace_opm',s:'trace',l:'Opmerking bij tracé',t:'lang',in:N,uit:W,vb:'Invoer ongeveer 3 meter uit rechterhoek'},
    {k:'plattegrond',s:'trace',l:'Plattegrond (indien beschikbaar)',t:'foto',in:W,uit:W,nvt:'NIET BESCHIKBAAR',vb:'NIET BESCHIKBAAR'},

    {k:'buiten_meters',s:'buiten',l:'Aantal meters buiten tracé',t:'teller',teller:'meters',in:N,uit:V,vb:'15 meter'},
    {k:'buiten_invoeringen',s:'buiten',l:'Aantal invoeringen',t:'teller',teller:'invoeringen',in:N,uit:V,vb:'1'},
    {k:'buiten_boringen',s:'buiten',l:'Aantal boringen/persingen',t:'teller',teller:'boringen',in:N,uit:W},
    {k:'buiten_fotos',s:'buiten',l:"Foto's buiten tracé",t:'fotos',sectie:'buiten',in:N,uit:V,vb:'7 foto\'s met pijl en bijschrift'},

    {k:'binnen_meters',s:'binnen',l:'Aantal meters binnen tracé',t:'text',in:N,uit:V,vb:'12 meter DB2 door de kruipruimte + 2 meter DB1'},
    {k:'binnen_kabelgoot',s:'binnen',l:'Nieuw aan te leggen kabelgoot',t:'text',in:N,uit:W,vb:'0'},
    {k:'binnen_brandwerend',s:'binnen',l:'Brandwerende doorvoeren',t:'text',in:N,uit:W,vb:'0'},
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

  const STATUS=[
    {id:'new',naam:'New',kleur:'var(--st-new)'},
    {id:'intake',naam:'Intake compleet',kleur:'var(--st-intake)'},
    {id:'gelopen',naam:'Gelopen',kleur:'var(--st-gelopen)'},
    {id:'klaar',naam:'Klaar',kleur:'var(--st-klaar)'},
    {id:'archief',naam:'Archief',kleur:'var(--st-archief)'}
  ];
  /* oude statussen omzetten: 'open' -> 'new' */
  const statusOf=s=>{const v=s&&s.status;return v==='open'||!v?'new':STATUS.some(x=>x.id===v)?v:'new';};
  const statusMeta=id=>STATUS.find(x=>x.id===id)||STATUS[0];

  /* ---- instellingen ---- */
  const KEY='sisu.velden';
  function cfg(){let c={};try{c=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
    const out={};VELDEN.forEach(f=>{const o=c[f.k]||{};out[f.k]={in:f.vast==='in'?N:(o.in||f.in),uit:o.uit||f.uit};});return out;}
  function setCfg(k,kant,v){let c={};try{c=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}c[k]={...(c[k]||{}),[kant]:v};try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}}
  function resetCfg(){try{localStorage.removeItem(KEY);}catch(e){}}

  /* ---- waarden ---- */
  // het startadres van de schouw ("Oranjelaan 2, Oegstgeest") als voorstel voor adres en plaats
  function adresDelen(s){const a=(s.adres||'').split(',').map(x=>x.trim());return{adres:a[0]||'',plaats:a.slice(1).join(', ')};}
  function waarde(s,k){
    const f=VELDEN.find(x=>x.k===k),v=(s.velden||{})[k];
    if(f&&f.t==='teller')return(s.tellers||{})[f.teller];
    if(v!=null&&v!=='')return v;
    const ad=adresDelen(s);
    if(k==='loc_adres'||k==='klant_adres')return ad.adres||'';
    if(k==='loc_plaats'||k==='klant_plaats')return ad.plaats||'';
    if(k==='datum_survey'&&s.gelopenOp)return s.gelopenOp.slice(0,10);
    return v;
  }
  function zet(s,k,v){s.velden={...(s.velden||{}),[k]:v};}
  /* telt een veld mee? (bijv. eigenaar-velden alleen als de klant geen eigenaar is) */
  function actief(s,f){if(!f.als)return true;return (waarde(s,f.als.veld)||'')===f.als.is;}
  function gevuld(s,f,fotos){
    const v=waarde(s,f.k);
    switch(f.t){
      case 'teller':return f.teller==='meters'?(+v>0):(v!=null&&v!=='');
      case 'fotos':return (fotos||[]).some(p=>p.status!=='vervallen'&&(p.sectie||'buiten')===f.sectie);
      case 'foto':return !!((s.bijlagen||{})[f.k])||v==='nvt';
      case 'vg':return !!(v&&v.nagelopen);
      case 'legenda':return true;
      default:return v!=null&&String(v).trim()!=='';
    }
  }
  /* voortgang: kant = 'in' of 'uit' */
  function voortgang(s,fotos,kant){
    const c=cfg(),fs=VELDEN.filter(f=>c[f.k][kant]==='verplicht'&&actief(s,f));
    const mis=fs.filter(f=>!gevuld(s,f,fotos));
    return{klaar:fs.length-mis.length,totaal:fs.length,mist:mis,pct:fs.length?Math.round((fs.length-mis.length)/fs.length*100):100};
  }
  window.Velden={VELDEN,SECTIES,VG,STATUS,V,W,N,cfg,setCfg,resetCfg,waarde,zet,actief,gevuld,voortgang,statusOf,statusMeta};
})();
