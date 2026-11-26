/* PAF-import: een PAF (Eurofiber aannemersportaal, "Work Order Approval Request Detail" als pdf) inlezen
   en de items invullen in de velden van een schouw.
   - Paf.lees(file)            -> {items:[{key,groep,sectie,label,waarde}]}   (pdf.js, alles op het toestel)
   - Paf.koppeling(key)        -> veldsleutel | '@adres_klant' | '@adres_loc' | 'info' | 'nee'
   - Paf.toepassen(s,items,o)  -> vult de schouw; {gevuld:[labels], bestond:[labels], info:n}
   - Paf.bekend()              -> alle bekende items (standaardlijst + items uit ingelezen PAF's)
   Instellingen per item (localStorage 'sisu.paf'): koppelen aan een veld, alleen bewaren als info, of niet importeren.
   Vereist velden.js. */
(function(){
  const KEY='sisu.paf',ITEMS_KEY='sisu.paf.items';
  const norm=t=>String(t||'').toLowerCase().replace(/\s+/g,' ').trim();
  /* groepnaam zonder nummers: "ORD00062355: Partner Portal …" -> "Order", "EVC Leg (SID001058788)" -> "EVC Leg" */
  const groepNaam=t=>{t=String(t||'').replace(/[▼▶►▸]/g,'').replace(/\b(Add|Related Product|Exporteren naar CSV)\b/g,'').trim();
    if(/^ORD\d+/.test(t))return 'Order';return t.replace(/\s*\(SID\d+\)\s*/g,'').trim();};
  const sleutel=(g,s,l)=>[g,s,l].map(norm).join('|');

  /* items die in een PAF voorkomen (alleen de namen; zo kun je ze koppelen voordat je een PAF hebt ingelezen) */
  const LIJST=[
    ['Order','Hoofdgegevens',['Ordernummer','Order Manager','Account','Projectmanager','Ordernaam','Orderbegindatum','Contractnummer']],
    ['Active Network Connection','Algemeen',['Product','Itemnaam','Service identificatiecode','Service Account']],
    ['Active Network Connection','Site Survey contactpersonen',['Naam','Telefoonnummer','Email']],
    ['Demarc','Algemeen',['Product','Itemnaam','Service identificatiecode','PAF overige informatie','Local Tail Design door aannemer','Total Design door aannemer','Indicatie On Net','Expedite Service Type','VLAN Range']],
    ['Demarc','Locatie',['Order productreferentie','Nieuwe locatie','Datacenter','Details over nieuwe locatie','Verdieping','Verwachte opleverdatum nieuwe locatie','Ruimte','Externe partij / aannemer','Kastnummer','Contactpersoon externe partij','Kastruimte','Telefoonnummer externe partij','Eindklant','Eindklant (2)','Beschikbare kamer datum','Ruimte wind en waterdicht?','Rack aanwezig?','Additional Comments on Location','Ruimte stofvrij?','Stroomvoorziening aanwezig?','MDF Tray']],
    ['Demarc','Patchgegevens',['Kastnaam','Eindklant','Kastnummer','Kastruimte','Eigenaar kast']],
    ['Demarc','Ontwerp',['Lijnbenaming','PoP-locatie','Glasvezelafstand','ODF','Design opmerkingen','Designer']],
    ['Demarc','Pre-Provisioning',['Type CPE','Network Element (PoP)','CPE nummer','Poort positie (PoP)','Uplinkpoort','Transceiver','Interface']]
  ];
  /* standaard koppelingen (aan te passen in Instellingen › PAF-import) */
  const STD={
    'order|hoofdgegevens|account':'klant_org',
    'active network connection|algemeen|itemnaam':'@adres_klant',
    'active network connection|site survey contactpersonen|naam':'klant_contact',
    'active network connection|site survey contactpersonen|telefoonnummer':'klant_tel',
    'active network connection|site survey contactpersonen|email':'klant_mail',
    'demarc|algemeen|indicatie on net':'type_aansluiting',
    'demarc|locatie|order productreferentie':'projectnummer',
    'demarc|locatie|verdieping':'afw_plaats',
    'demarc|locatie|ruimte':'afw_ruimte',
    'demarc|locatie|kastnummer':'afw_kast',
    'demarc|locatie|externe partij / aannemer':'aanw_aan_bedrijf',
    'demarc|locatie|contactpersoon externe partij':'aanw_aan_naam',
    'demarc|locatie|telefoonnummer externe partij':'aanw_aan_tel',
    'demarc|locatie|stroomvoorziening aanwezig?':'binnen_stroom',
    'demarc|pre-provisioning|type cpe':'afw_apparatuur'
  };
  const cfg=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return{};}};
  const setCfg=c=>localStorage.setItem(KEY,JSON.stringify(c));
  const koppeling=k=>{const c=cfg();return c[k]||STD[k]||'info';};
  function zetKoppeling(k,v){const c=cfg();if(v===(STD[k]||'info'))delete c[k];else c[k]=v;setCfg(c);}
  function resetKoppelingen(){localStorage.removeItem(KEY);}
  /* bekende items: standaardlijst + wat uit ingelezen PAF's kwam (met een voorbeeldwaarde, alleen op dit toestel) */
  function bekend(){
    const uit=[],gezien=new Set(),add=(g,s,l,vb)=>{const k=sleutel(g,s,l);if(gezien.has(k)){if(vb){const x=uit.find(i=>i.key===k);if(x&&!x.vb)x.vb=vb;}return;}gezien.add(k);uit.push({key:k,groep:g,sectie:s,label:l,vb:vb||''});};
    LIJST.forEach(([g,s,ls])=>ls.forEach(l=>add(g,s,l)));
    let eigen=[];try{eigen=JSON.parse(localStorage.getItem(ITEMS_KEY)||'[]');}catch(e){}
    eigen.forEach(i=>add(i.groep,i.sectie,i.label,i.vb));
    return uit;}
  function onthoud(items){let eigen=[];try{eigen=JSON.parse(localStorage.getItem(ITEMS_KEY)||'[]');}catch(e){}
    items.forEach(i=>{const x=eigen.find(e=>e.key===i.key);if(x){if(i.waarde)x.vb=i.waarde;}else eigen.push({key:i.key,groep:i.groep,sectie:i.sectie,label:i.label,vb:i.waarde||''});});
    localStorage.setItem(ITEMS_KEY,JSON.stringify(eigen));}

  /* ---------- pdf lezen ---------- */
  let pdfjs=null;
  async function laad(){if(pdfjs)return pdfjs;
    const base=new URL('vendor/pdfjs/',document.currentScript?document.currentScript.src:location.href);
    const bron=[...document.scripts].find(s=>/shared\/paf\.js/.test(s.src));const dir=bron?new URL('vendor/pdfjs/',bron.src):base;
    pdfjs=await import(new URL('pdf.min.mjs',dir).href);pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdf.worker.min.mjs',dir).href;return pdfjs;}
  const SKIP=/^(https?:\/\/|\d+\/\d+$|Work Order Approval Request Detail|\d{2}-\d{2}-\d{4}, \d{2}:\d{2}$)|Alle rechten voorbehouden|^Exporteren naar CSV$|^(Add|Related Product)$/;
  /* tekst opschonen: links naar het portaal en losse symbolen weg */
  const schoon=t=>String(t||'').replace(/\(\/contractor[^)]*\)?/g,'').replace(/\b(?=[0-9A-Za-z]*[a-z])(?=[0-9A-Za-z]*\d)[0-9A-Za-z]{12,}\)/g,'').replace(/[▼▶►▸☐☑✓✔]/g,'').replace(/\s+/g,' ').trim();
  async function lees(file){
    const lib=await laad(),data=new Uint8Array(await file.arrayBuffer());
    const doc=await lib.getDocument({data,isEvalSupported:false,useSystemFonts:true}).promise;
    // alle tekststukken met positie en lettergrootte
    const runs=[];
    for(let n=1;n<=doc.numPages;n++){const pg=await doc.getPage(n),vp=pg.getViewport({scale:1}),tc=await pg.getTextContent();
      tc.items.forEach(it=>{const t=(it.str||'').trim();if(!t)return;const m=it.transform,size=Math.round(Math.hypot(m[2],m[3])*10)/10;
        runs.push({p:n,x:m[4],y:vp.height-m[5],size,t,w:it.width,pw:vp.width});});}
    // regels: stukken op dezelfde hoogte, in dezelfde kolom en even groot samenvoegen
    runs.sort((a,b)=>a.p-b.p||a.y-b.y||a.x-b.x);
    const regels=[];
    runs.forEach(r=>{const l=regels[regels.length-1];
      if(l&&l.p===r.p&&Math.abs(l.y-r.y)<2&&l.size===r.size&&r.x-(l.x2)<12&&r.x>=l.x){l.t+=(r.x-l.x2>0.8?' ':'')+r.t;l.x2=r.x+r.w;}
      else regels.push({p:r.p,x:r.x,x2:r.x+r.w,y:r.y,size:r.size,t:r.t,pw:r.pw});});
    const items=[];let groep=null,sectie='',kol={},tabel=null;
    const kolom=r=>r.x<r.pw*0.47?'L':'R';
    for(const r of regels){
      const t=r.t.replace(/[▼▶►▸]/g,'').trim();if(!t||SKIP.test(t))continue;
      if(r.size>=11){groep=groepNaam(t);sectie='';kol={};tabel=null;continue;}   // product/groep
      if(!groep)continue;                                                      // kop van de aanvraag overslaan
      if(r.size>=7.3&&r.size<=8.2){sectie=t;kol={};tabel=null;continue;}         // sectiekop
      if(r.size>=6.8&&r.size<7.3){                                             // tabel (bijv. contactpersonen)
        if(!tabel){tabel={kop:[],rij:null,n:0};}
        if(!tabel.rij&&(!tabel.kop.length||Math.abs(tabel.kop[0].y-r.y)<2)){tabel.kop.push({x:r.x,y:r.y,t});continue;}
        if(!tabel.rij||Math.abs(tabel.rij.y-r.y)>=2){tabel.rij={y:r.y};tabel.n++;}
        const k=tabel.kop.reduce((a,b)=>Math.abs(b.x-r.x)<Math.abs(a.x-r.x)?b:a,tabel.kop[0]);
        const label=k.t+(tabel.n>1?' ('+tabel.n+')':'');
        items.push({groep,sectie,label,waarde:schoon(t)});continue;}
      if(r.size>=5.8&&r.size<6.25){tabel=null;const it={groep,sectie,label:t,waarde:''};items.push(it);kol[kolom(r)]=it;continue;} // label
      if(r.size>=6.25&&r.size<6.8){const it=kol[kolom(r)];if(it){const v=schoon(t);if(v)it.waarde=it.waarde?it.waarde+' '+v:v;}}       // waarde
    }
    // zelfde naam twee keer in één sectie (bijv. Eindklant): de tweede heet "Eindklant (2)"
    const tel={};items.forEach(i=>{const k=sleutel(i.groep,i.sectie,i.label);tel[k]=(tel[k]||0)+1;if(tel[k]>1)i.label+=` (${tel[k]})`;});
    items.forEach(i=>{i.key=sleutel(i.groep,i.sectie,i.label);i.waarde=schoon(i.waarde);});
    onthoud(items);
    return{items,bestand:file.name};
  }

  /* ---------- waarden omzetten ---------- */
  const hoofdletters=t=>t.toLowerCase().replace(/(^|[\s\-'])([a-zà-ÿ])/g,(m,a,b)=>a+b.toUpperCase());
  /* "… NL 2665MT Hollandweg 36 BLEISWIJK" of "…-2665MT-Hollandweg-36-BLEISWIJK" -> straat + nummer, postcode, plaats */
  function adres(t){const m=String(t).match(/(\d{4})\s?([A-Z]{2})[\s\-]+(.+?)[\s\-]+(\d+(?:\s?[A-Za-z]{1,2})?(?:[\-\s]\d+)?)[\s\-]+([A-Za-zÀ-ÿ'\- ]+?)\s*$/);
    if(!m)return null;return{adres:`${m[3].replace(/-/g,' ')} ${m[4].replace(/\s+/g,'')}`.trim(),postcode:m[1]+m[2],plaats:hoofdletters(m[5].replace(/-/g,' ').trim())};}
  function omzetten(f,v){v=String(v).trim();if(!v)return'';
    if(f.t==='keuze'){const n=v.toLowerCase().replace(/[^a-z]/g,'');return f.opties.find(o=>n.includes(o.toLowerCase()))||f.opties.find(o=>o.toLowerCase().includes(n))||'';}
    if(f.t==='janee'){if(/^(ja|yes|true|waar|aanwezig)/i.test(v))return'Ja';if(/^(nee|no|false|onwaar|niet)/i.test(v))return'Nee';return'';}
    if(f.t==='getal'){const n=parseFloat(v.replace(',','.'));return isFinite(n)?n:'';}
    if(f.t==='datum'){const m=v.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:'';}
    return v;}
  const leeg=v=>v==null||String(v).trim()==='';

  /* de items invullen in schouw s; bestaande waarden blijven staan tenzij o.vervang */
  function toepassen(s,items,o={}){
    const res={gevuld:[],bestond:[],info:0};s.velden={...(s.velden||{})};
    const info=[];
    const zet=(k,v,label)=>{if(leeg(v))return;const f=Velden.VELDEN.find(x=>x.k===k);if(!f)return;
      const nu=(s.velden||{})[k];
      if(!leeg(nu)&&String(nu)!==String(v)&&!o.vervang){res.bestond.push(f.kort||f.l);return;}
      if(String(nu)===String(v))return;s.velden[k]=v;res.gevuld.push(f.kort||f.l);};
    for(const i of items){if(leeg(i.waarde))continue;const doel=koppeling(i.key);
      if(doel==='nee')continue;
      if(doel==='info'){info.push({groep:i.groep,sectie:i.sectie,label:i.label,waarde:i.waarde});continue;}
      if(doel==='@adres_klant'||doel==='@adres_loc'){const a=adres(i.waarde);if(!a){info.push({groep:i.groep,sectie:i.sectie,label:i.label,waarde:i.waarde});continue;}
        const p=doel==='@adres_klant'?'klant':'loc';zet(p+'_adres',a.adres);zet(p+'_postcode',a.postcode);zet(p+'_plaats',a.plaats);
        if(p==='loc'&&(a.adres!==Velden.waarde(s,'klant_adres')))s.velden.loc_zelfde='Nee';continue;}
      const f=Velden.VELDEN.find(x=>x.k===doel);if(!f)continue;
      // een hele adresregel gekoppeld aan één adresveld: alleen het juiste deel nemen
      const ad=/^(klant|loc)_(adres|postcode|plaats)$/.exec(doel),a=ad&&adres(i.waarde);
      zet(doel,a?a[ad[2]]:omzetten(f,i.waarde));}
    s.paf={bestand:o.bestand||'',op:new Date().toISOString(),info};res.info=info.length;
    if(o.adres)s.adres='';Velden.adresNaam(s); // naam van de schouw = adres en plaats van de klant
    return res;
  }
  /* waar een item aan gekoppeld kan worden */
  function doelen(){
    const ok=f=>!f.schakel&&!['foto','fotos','rolfoto','vg','legenda','teller'].includes(f.t);
    return Velden.SECTIES.map(sc=>({sc,velden:Velden.VELDEN.filter(f=>Velden.groep(f)===sc.id&&ok(f))})).filter(x=>x.velden.length);
  }
  /* bestand kiezen (in de tik openen, zodat iOS het toestaat) */
  function kies(){return new Promise((res,rej)=>{const i=document.createElement('input');i.type='file';i.accept='application/pdf,.pdf';i.style.display='none';
    document.body.appendChild(i);i.onchange=()=>{const f=i.files&&i.files[0];i.remove();f?res(f):rej(new Error('geen bestand'));};i.click();});}
  window.Paf={lees,kies,toepassen,koppeling,zetKoppeling,resetKoppelingen,bekend,doelen,sleutel,adres,STD};
})();
