/* Het gegevensscherm van een schouw (één scherm voor alles), op basis van de instellingen (shared/velden.js).
   Gegevens.open(survey, {filter:'todo'|'alles', moment:'vooraf'|'terplekke'|'achteraf', sectie:'klant', onClose, onChange})
     één lange lijst: per sectie een kop (blijft bovenaan staan tijdens scrollen) met daaronder de velden.
     filter 'todo' toont alleen secties waar nog iets open is; sectie = meteen naar die kop scrollen.
     moment 'vooraf' = alleen secties die je vóór het schouwen invult; verplicht = verplicht bij input.
   Gegevens.naKast(photoId, klaar)  vraagt na de eerste serverkast op een foto waar de kast komt.
   Gegevens.bron = id => survey-object dat de pagina al in handen heeft (zodat niets wordt overschreven).
   Vereist store.js, velden.js en (voor foto's) camera.js. */
(function(){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const svg=(d,w)=>`<svg width="${w||22}" height="${w||22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const hoofd=t=>t?t[0].toUpperCase()+t.slice(1):t;
  const TERUG='M15 5l-7 7 7 7',VERDER='M9 5l7 7-7 7';
  const CSS=`
.geg{position:fixed;inset:0;z-index:55;background:var(--bg,#121418);color:var(--ink,#F3F4F6);display:flex;flex-direction:column}
:is(.geg,.gin) .gh{flex:none;display:flex;align-items:center;gap:8px;padding:calc(4px + env(safe-area-inset-top)) calc(14px + env(safe-area-inset-right)) 6px calc(6px + env(safe-area-inset-left));border-bottom:1px solid var(--line,#2E323A)}
:is(.geg,.gin) .gh h2{flex:1;min-width:0;margin:0;font-size:18px;font-weight:800;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
:is(.geg,.gin) .gst{font-weight:800;font-size:15px;white-space:nowrap}
:is(.geg,.gin) .gb{flex:1;overflow-y:auto;padding:12px calc(14px + env(safe-area-inset-right)) 24px calc(14px + env(safe-area-inset-left))}
.sig{display:block;width:14px;height:14px;border-radius:50%;background:#3b82f6;box-shadow:0 0 0 4px rgba(59,130,246,.2)}.sig.ok{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.2)}
:is(.geg,.gin) .gfr{display:flex;gap:8px}:is(.geg,.gin) .gfr .btn{flex:1}
:is(.geg,.gin) .gf{flex:none;padding:10px calc(14px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left));border-top:1px solid var(--line,#2E323A);background:var(--bg,#121418)}
:is(.geg,.gin) .gf .btn{width:100%;min-height:54px}
:is(.geg,.gin) .gdoc{display:flex;align-items:center;gap:10px;color:var(--mute,#A7ADB8);font-size:15px}
:is(.geg,.gin) .gdoc i{flex:1;height:6px;border-radius:3px;background:var(--track);overflow:hidden}:is(.geg,.gin) .gdoc i b{display:block;height:100%;background:var(--prog-doc)}
:is(.geg,.gin) .wrn{color:var(--warn)}:is(.geg,.gin) .okk{color:var(--ok,#22C55E)}
:is(.geg,.gin) .gseg{display:flex;background:var(--card);border:1px solid var(--line);border-radius:var(--r-pill,999px);padding:3px;margin-bottom:12px}
:is(.geg,.gin) .gseg button{flex:1;min-height:44px;border:0;border-radius:var(--r-pill,999px);background:transparent;color:var(--ink);font-weight:600;font-size:15px;cursor:pointer}
:is(.geg,.gin) .gseg button.on{background:var(--acc);color:var(--on-acc);font-weight:800}
:is(.geg,.gin) .gmom{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 10px;color:var(--mute);font-size:15px}
:is(.geg,.gin) .gmom button{border:0;background:none;color:var(--ink);font-weight:700;font-size:15px;min-height:44px;padding:0 4px;cursor:pointer;text-decoration:underline}
:is(.geg,.gin) .gsec{margin-top:22px}:is(.geg,.gin) .gsec.eerst{margin-top:2px}
:is(.geg,.gin) .gsh{position:sticky;top:-12px;z-index:3;display:flex;align-items:center;gap:12px;min-height:60px;margin:0 calc(-14px - env(safe-area-inset-right)) 10px calc(-14px - env(safe-area-inset-left));padding:10px calc(14px + env(safe-area-inset-right)) 10px calc(14px + env(safe-area-inset-left));background:var(--bg,#121418);border-bottom:1px solid var(--line,#2E323A)}
:is(.geg,.gin) .gsh .ic{flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);display:grid;place-items:center;color:var(--mute)}
:is(.geg,.gin) .gsh .nm{flex:1;min-width:0}:is(.geg,.gin) .gsh h3{margin:0;font-size:19px;font-weight:800;line-height:1.2}
:is(.geg,.gin) .gsh small{display:block;color:var(--mute);font-size:14px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
:is(.geg,.gin) .gsh .sx{flex:none;font-weight:800;font-size:15px;white-space:nowrap}
:is(.geg,.gin) .gsec .gopt{margin-top:4px}
:is(.geg,.gin) .gleeg{background:var(--card);border:1px solid var(--line);border-radius:var(--r,20px);padding:18px;text-align:center}
:is(.geg,.gin) .gleeg p{margin:0 0 12px;font-weight:700}:is(.geg,.gin) .gleeg .btn{width:100%}
:is(.geg,.gin) .fr{background:var(--card,#1C1F25);border:1px solid var(--line,#2E323A);border-radius:var(--r,20px);padding:12px 14px;margin-bottom:8px}
:is(.geg,.gin) .mist{border-color:var(--warn)}
:is(.geg,.gin) .info{color:var(--mute,#A7ADB8);font-size:15px}
:is(.geg,.gin) .fl{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px;margin-bottom:6px}
:is(.geg,.gin) .fl span:first-child{flex:1}
:is(.geg,.gin) .vink{flex:none;width:26px;height:26px;border-radius:50%;background:var(--ok,#22C55E);color:#0b1a10;font-style:normal;font-weight:800;font-size:16px;display:grid;place-items:center}
:is(.geg,.gin) .vink[hidden]{display:none}
:is(.geg,.gin) input,:is(.geg,.gin) textarea{display:block;box-sizing:border-box;max-width:100%;min-width:0;-webkit-appearance:none;appearance:none;width:100%;min-height:48px;border-radius:14px;border:1px solid var(--line2);background:var(--well,#121418);color:inherit;padding:0 12px;font-size:16px}
:is(.geg,.gin) textarea{min-height:84px;padding:10px 12px;line-height:1.4;resize:vertical}
:is(.geg,.gin) .ch{display:flex;flex-wrap:wrap;gap:6px}
:is(.geg,.gin) .ch button{min-height:44px;padding:0 16px;border-radius:99px;border:1px solid var(--line2);background:transparent;color:inherit;font-size:16px;font-weight:600;cursor:pointer}
:is(.geg,.gin) .ch button.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc);font-weight:800}
:is(.geg,.gin) .ft{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
:is(.geg,.gin) .ft img{width:120px;height:90px;object-fit:cover;border-radius:var(--r-thumb,14px);border:1px solid var(--line2)}
:is(.geg,.gin) .ft .btn{min-height:44px}
:is(.geg,.gin) .stp{display:flex;align-items:center;gap:10px}:is(.geg,.gin) .stp input{width:90px;flex:none;text-align:center;font-size:20px;font-weight:800}
:is(.geg,.gin) .stp button{flex:none;width:48px;height:48px;border-radius:24px;border:1px solid var(--line2);background:var(--well);color:var(--ink);font-size:24px;font-weight:800;cursor:pointer;padding:0}
:is(.geg,.gin) .zw{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;font-weight:700;font-size:16px}
:is(.geg,.gin) .zw span{flex:1}
:is(.geg,.gin) .sw{flex:none;position:relative;width:56px;height:34px;border-radius:17px;border:1px solid var(--line2);background:var(--well);cursor:pointer;padding:0}
:is(.geg,.gin) .sw i{position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:13px;background:var(--mute);transition:left .15s}
:is(.geg,.gin) .sw[aria-checked="true"]{background:var(--acc);border-color:var(--acc)}:is(.geg,.gin) .sw[aria-checked="true"] i{left:25px;background:var(--on-acc)}
:is(.geg,.gin) .ccard .cr{margin-top:8px}:is(.geg,.gin) .ccard .cr label{display:block;color:var(--mute);font-size:14px;font-weight:600;margin:0 0 4px}
:is(.geg,.gin) .ccard .kies{margin-top:10px;width:100%;min-height:44px}
:is(.geg,.gin) .gopt{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;margin:14px 0 8px;border:1px solid var(--line);border-radius:var(--r-pill,999px);background:transparent;color:var(--ink);font-size:16px;font-weight:600;padding:0 18px;cursor:pointer;text-align:left}
:is(.geg,.gin) .gopt span{flex:1}:is(.geg,.gin) .gopt svg{transition:transform .15s}:is(.geg,.gin) .gopt[aria-expanded="true"] svg{transform:rotate(90deg)}
:is(.geg,.gin) .vgt{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
:is(.geg,.gin) .tile{position:relative;min-height:72px;border-radius:16px;border:1px solid var(--line2);background:var(--card);color:var(--ink);font-size:15px;font-weight:700;line-height:1.25;padding:10px 12px;text-align:left;cursor:pointer;display:flex;flex-direction:column;justify-content:center;gap:4px;overflow-wrap:anywhere;hyphens:auto}
:is(.geg,.gin) .tile.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc)}
:is(.geg,.gin) .tile.voor{border-color:var(--warn);border-style:dashed}
:is(.geg,.gin) .tile small{font-size:12px;font-weight:800;color:var(--warn)}
:is(.geg,.gin) .vx{grid-column:1/-1;display:grid;gap:6px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px 12px}
:is(.geg,.gin) .vx b{font-size:14px}:is(.geg,.gin) .vx input{min-height:44px;font-size:15px}
:is(.geg,.gin) .vgg{margin:12px 0 4px;font-weight:800;color:var(--mute,#A7ADB8)}
:is(.geg,.gin) .vgr{border-top:1px solid var(--track);padding:6px 0}
:is(.geg,.gin) .vgr label{display:flex;gap:10px;align-items:center;min-height:44px;font-size:16px}
:is(.geg,.gin) .vgr input[type=checkbox]{width:24px;height:24px;min-height:0;accent-color:var(--acc)}
:is(.geg,.gin) .vgr .vx{margin:4px 0 4px 34px}
:is(.geg,.gin) .tile.geen{grid-column:1/-1;min-height:56px;text-align:center;align-items:center}
.gbl{position:fixed;inset:0;z-index:72;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.gblb{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--card,#1C1F25);color:var(--ink,#F3F4F6);border:1px solid var(--line,#2E323A);border-radius:var(--r,20px) var(--r,20px) 0 0;padding:18px calc(16px + env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left));display:flex;flex-direction:column;gap:10px}
.gblb h3{margin:0;font-size:21px}.gblb p{margin:0;color:var(--mute)}
.gblb .btn{width:100%}
.gblb label{display:block;font-weight:700;margin:4px 0 4px}
.gblb input{display:block;box-sizing:border-box;width:100%;min-width:0;min-height:48px;border-radius:14px;border:1px solid var(--line2);background:var(--well);color:inherit;padding:0 12px;font-size:16px;-webkit-appearance:none;appearance:none}
.gblb img{width:100%;max-height:160px;object-fit:cover;border-radius:var(--r-thumb,14px)}
.gblb .grnu{display:flex;align-items:center;gap:12px;padding:10px;border:2px solid #4ade80;border-radius:14px;margin:4px 0 10px}
.grnf{position:relative;flex:none;width:96px;height:72px;border-radius:10px;overflow:hidden}.grnf img{width:100%;height:100%;object-fit:cover;display:block}
.grnu b{font-size:16px;color:#4ade80}.grleeg{color:#fdba74!important;font-weight:600}
.grk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.gblb .grk button{position:relative;padding:0;border:2px solid transparent;border-radius:12px;background:none;cursor:pointer;overflow:hidden;aspect-ratio:4/3}
.gblb .grk button.on{border-color:var(--ok,#22C55E)}
.gblb .grk img{width:100%;height:100%;max-height:none;object-fit:cover;border-radius:10px;display:block}
.gblb .grk span{position:absolute;left:6px;bottom:6px;background:var(--overlay,rgba(0,0,0,.6));color:#fff;font-size:13px;font-weight:800;border-radius:99px;padding:2px 8px}
/* gegevensscherm: rustig, één laag (geen kaarten per veld) */
.geg .gtop{flex:none;background:var(--bg)}
.geg .gtb{padding:10px calc(14px + env(safe-area-inset-right)) 8px calc(14px + env(safe-area-inset-left));border-bottom:1px solid var(--line)}
.geg .gtb .gseg{margin:0}
.geg .gpr{display:flex;align-items:center;gap:10px;margin-top:10px}
.geg .gpr i{flex:1;height:4px;border-radius:2px;background:var(--track);overflow:hidden}.geg .gpr i b{display:block;height:100%;background:var(--prog-doc)}
.geg .gpr span{flex:none;font-size:13px;color:var(--mute)}
.geg .gb{padding-top:0}
.geg .gsec{margin-top:24px}
.geg .gsh{position:static;display:flex;align-items:baseline;gap:10px;min-height:0;margin:0 0 12px;padding:0;background:none;border:0}
.geg .gsh h3{flex:1;margin:0;font-size:17px;font-weight:800}
.geg .gsh .sx{flex:none;font-size:13px;font-weight:700;color:var(--warn)}
.geg .fr{background:none;border:0;border-radius:0;padding:0;margin:0 0 14px}
.geg .fl{display:flex;align-items:center;gap:0;font-size:14px;font-weight:400;color:var(--mute);margin:0 0 6px}
.geg .fr .dot{display:none;flex:none;width:6px;height:6px;border-radius:50%;background:var(--warn);margin-right:7px}
.geg .fr.open>.fl .dot{display:inline-block}
.geg input,.geg textarea{border-radius:12px;border:1px solid var(--line2);background:var(--well);text-align:left}
.geg input{height:48px;min-height:48px;line-height:46px;padding:0 12px}
.geg input[type=date]{display:block;height:48px;line-height:46px;text-align:left;padding:0 12px}
.geg input[type=date]::-webkit-date-and-time-value{text-align:left;margin:0}
.geg input[type=date]::-webkit-datetime-edit{padding:0;line-height:46px}
.geg .stp input{height:48px;text-align:center}
.geg .g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.geg .ch button.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc)}
.geg .ging{display:block;width:100%;min-height:44px;margin:-4px 0 4px;padding:0;border:0;background:none;color:var(--mute);font-size:13px;text-align:left;cursor:pointer;line-height:1.35}
.geg .zw{min-height:52px;padding:4px 0;margin:0 0 10px;font-weight:600}
.geg .grs{border-top:1px solid var(--line)}
.geg .grj{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:8px 0;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink);font:inherit;font-size:15px;text-align:left;cursor:pointer}
.geg .grj .l{flex:1 1 50%;min-width:0;color:var(--mute)}
.geg .grj .v{flex:1 1 50%;min-width:0;text-align:right;color:var(--ink);overflow-wrap:anywhere}
.geg .grj>svg{flex:none;color:var(--mute)}
.geg .grj.gopr .l{color:var(--mute)}
.geg .gm{color:var(--mute)}
.geg .gth{width:48px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;border:1px solid var(--line2)}
.geg .fed{padding:12px 0 2px;border-bottom:1px solid var(--line)}
.geg .fed .fr{margin-bottom:8px}
.geg .gf .btn{min-height:48px}
.geg .gleeg{margin-top:32px;background:none;border:0;text-align:center}
@media (prefers-reduced-motion:reduce){:is(.geg,.gin) .gopt svg,:is(.geg,.gin) .sw i{transition:none}}`;
  function css(){if(document.getElementById('gegcss'))return;const s=document.createElement('style');s.id='gegcss';s.textContent=CSS;document.head.appendChild(s);}

  let st=null;
  /* open(survey, opts) — oude aanroep open(survey,'intake'|'alles',opts) werkt ook nog */
  async function open(survey,a,b){
    let opts=a&&typeof a==='object'?{...a}:{...(b||{})};
    if(a==='intake')opts.moment=opts.moment||'vooraf';
    css();close(true);
    if(Velden.migreer(survey))await Store.surveys.put(survey);
    const fotos=await Store.photos.bySurvey(survey.id,true);
    const root=document.createElement('div');root.className='geg';root.setAttribute('role','dialog');root.setAttribute('aria-label','Gegevens');document.body.appendChild(root);
    st={s:survey,opts,root,fotos,urls:[],filter:opts.filter==='alles'?'alles':'todo',moment:opts.moment||null,optOpen:new Set(),vgMeer:false,naar:null,eerst:true,
      vast:new Set(),uit:new Set(),edit:null,cur:null}; // vast: net ingevulde velden blijven staan; uit: uitgeklapte 'ingevuld'-regels; edit: open rij in Alles
    root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();terug();}});
    // terug-gebaar/terugknop van de telefoon: stap terug binnen het scherm
    history.pushState({...(history.state||{}),geg:1},'');st.diepte=1;
    if(opts.sectie&&Velden.SECTIES.some(x=>x.id===opts.sectie))st.naar=opts.sectie;
    // opts.veld: dat veld tonen (open verplicht -> Nog te doen, anders Alles met het veld uitgeklapt); opts.naarLeeg: eerste open veld
    let doel=null;
    if(opts.veld){const f=Velden.VELDEN.find(x=>x.k===opts.veld);if(f){doel=f.k;if(isOpen(f,Velden.cfg()))st.filter='todo';else{st.filter='alles';st.edit=f.k;}}}
    else if(opts.naarLeeg){st.filter='todo';doel=openVolgorde()[0]||null;}
    lijst();
    if(doel){st.eerst=false;focusVeld(doel);}
  }
  function close(silent){if(!st)return;const me=st;clearTimeout(svT);if(svP)Store.surveys.put(me.s);st.urls.forEach(u=>URL.revokeObjectURL(u));st.root.remove();st=null;if(!silent&&me.opts.onClose)me.opts.onClose();}
  function terug(){sluit();}
  function sluit(){if(!st)return;save(true);const d=st.diepte||0;st.diepte=0;close();if(d)history.go(-d);}
  addEventListener('popstate',e=>{if(!st||!st.diepte)return;const g=(e.state&&e.state.geg)||0;
    if(g>=1)return;
    st.diepte=0;save(true);close();});
  let svT=null,svP=false;
  function save(now){clearTimeout(svT);svP=true;const go=async()=>{svP=false;if(!st)return;const me=st;await Store.surveys.put(me.s);if(me.opts.onChange)me.opts.onChange(me.s);};if(now)return go();svT=setTimeout(go,350);}
  const kant=()=>st.moment==='vooraf'?'in':undefined;
  const secties=()=>Velden.secties(st.s,st.fotos,{moment:st.moment,kant:kant(),zonder:st.opts.zonder,zonderK:st.opts.zonderK});
  const docTxt=()=>{const v=Velden.voortgang(st.s,st.fotos,'uit');return `<div class="gdoc"><span>Document ${v.klaar} van ${v.totaal} compleet</span><i><b style="width:${v.pct}%"></b></i></div>`;};
  function sub(x){const s=st.s;
    if(x.sc.id==='klant'&&Velden.zelfdeAan(s,'klant_zelfde'))return 'Adres zelfde als locatie';
    if(x.sc.id==='aanm'&&Velden.zelfdeAan(s,'aanm_zelfde'))return 'Contact zelfde als klant';
    if(x.sc.id==='eig'&&Velden.waarde(s,'eig_klant_is_eigenaar')==='Ja')return 'Klant is eigenaar';
    return x.sc.sub||'';}

  /* ---------- het scherm: vaste kop (filter + voortgang), daaronder alle secties onder elkaar ---------- */
  const PAAR={klant_postcode:'klant_plaats',loc_postcode:'loc_plaats',klant_tel:'klant_mail',eig_tel:'eig_mail',aanm_tel:'aanm_mail'};
  const PH={projectnummer:'5222119-00172403'};
  /* voorbeeldtekst die past: niets tussen haakjes, alleen het eerste deel */
  function vbTekst(f,half){if(PH[f.k])return 'bijv. '+PH[f.k];if(!f.vb)return'';
    let v=String(f.vb).replace(/\s*\(.*?\)/g,'').split(/[;:→]/)[0].trim();
    if(f.t!=='lang'&&v.length>(half?14:30))v=v.split(/,\s*/)[0];
    if(f.t!=='lang'&&v.length>(half?14:30))return '';
    return 'bijv. '+v;}
  const fmtD=v=>{const d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric'});};
  const lijstVelden=x=>x.velden.filter(f=>!f.schakel&&!Velden.verborgen(st.s,f));
  const isOpen=(f,c)=>Velden.nodig(c,f,kant())&&!Velden.gevuld(st.s,f,st.fotos);
  /* alle open verplichte velden in volgorde (voor "Volgende open veld" en Enter) */
  const openVolgorde=()=>{const c=Velden.cfg();return secties().flatMap(x=>lijstVelden(x).filter(f=>isOpen(f,c)).map(f=>f.k));};
  const voortgang=()=>{const v=Velden.voortgang(st.s,st.fotos,'uit');return `<div class="gpr" aria-label="Document ${v.klaar} van ${v.totaal} compleet"><i><b style="width:${v.pct}%"></b></i><span>${v.klaar} van ${v.totaal}</span></div>`;};
  function lijst(){
    const R=st.root,c=Velden.cfg(),L=secties(),n=L.reduce((t,x)=>t+x.open.length,0),gb=R.querySelector('.gb'),y=gb?gb.scrollTop:0;
    st.urls.forEach(u=>URL.revokeObjectURL(u));st.urls=[];
    const todo=st.filter==='todo';
    const blokken=L.map(x=>todo?blokTodo(x,c):blokAlles(x,c)).filter(Boolean);
    R.innerHTML=`<div class="gtop"><div class="gh"><button class="back bpill" id="gX">${svg(TERUG,18)}Terug</button><h2>Gegevens</h2></div>
      <div class="gtb"><div class="gseg" role="group" aria-label="Filter"><button data-f="todo" class="${todo?'on':''}" aria-pressed="${todo}">Nog te doen (${n})</button><button data-f="alles" class="${todo?'':'on'}" aria-pressed="${!todo}">Alles</button></div>
      ${voortgang()}</div></div>
    <div class="gb">
      ${st.moment?`<div class="gmom"><span>Alleen wat je ${esc(Velden.MOMENT[st.moment])} invult</span><button id="gAlle">Alle secties</button></div>`:''}
      ${blokken.length?blokken.join('')+pafHtml()
        :`<div class="gleeg"><p>${st.moment==='vooraf'?'Alles wat je vooraf nodig hebt, is ingevuld.':'Alles wat verplicht is, is ingevuld.'}</p><button class="btn" id="gToon">Bekijk alles</button></div>`}
    </div><div class="gf"${n||st.opts.afrond?'':' hidden'}><div class="gfr"><button class="btn${st.opts.afrond?'':' pri'}" id="gNx"${n?'':' hidden'}>Volgende open veld</button>${st.opts.afrond?`<button class="btn pri" id="gAf">Afgerond</button>`:''}</div></div>`;
    R.querySelector('#gX').onclick=sluit;
    R.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{if(st.filter===b.dataset.f)return;save(true);st.filter=b.dataset.f;st.vast.clear();st.edit=null;lijst();R.querySelector('.gb').scrollTop=0;});
    const al=R.querySelector('#gAlle');if(al)al.onclick=()=>{st.moment=null;lijst();};
    const tn=R.querySelector('#gToon');if(tn)tn.onclick=()=>{st.filter='alles';st.vast.clear();lijst();};
    R.querySelector('#gNx').onclick=()=>volgende();
    const af=R.querySelector('#gAf');if(af)af.onclick=async()=>{save(true);const L=secties(),open=L.flatMap(x=>x.open);
      if(open.length&&!(await bevestigAf(open)))return;const fn=st.opts.afrond;sluit();fn();};
    R.querySelectorAll('[data-ing]').forEach(b=>b.onclick=()=>{const id=b.dataset.ing,aan=!st.uit.has(id);aan?st.uit.add(id):st.uit.delete(id);
      b.setAttribute('aria-expanded',aan);R.querySelector(`[data-ingl="${id}"]`).hidden=!aan;});
    R.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const id=b.dataset.opt,aan=!st.optOpen.has(id);aan?st.optOpen.add(id):st.optOpen.delete(id);
      b.setAttribute('aria-expanded',aan);R.querySelector(`[data-optl="${id}"]`).hidden=!aan;});
    R.querySelectorAll('[data-rij]').forEach(b=>b.onclick=()=>openRij(b.dataset.rij));
    bind();upd();
    const nb=R.querySelector('.gb');if(nb)nb.scrollTop=y;
    if(st.naar){const k=R.querySelector(`[data-gsec="${st.naar}"]`);if(k&&nb)nb.scrollTop=k.offsetTop-nb.offsetTop-8;st.naar=null;}
    if(st.eerst){st.eerst=false;R.querySelector('#gX').focus({preventScroll:true});}
  }
  const kop=(x,open)=>`<div class="gsh"><h3 id="gk_${x.sc.id}">${esc(x.sc.kort)}</h3><span class="sx" data-sh="${x.sc.id}">${open?open+' open':''}</span></div>`;
  const schakels=x=>x.velden.filter(f=>f.schakel).map(f=>{const on=Velden.zelfdeAan(st.s,f.k);
    return `<div class="zw"><span id="l_${f.k}">${esc(f.l)}</span><button class="sw" role="switch" aria-checked="${on}" aria-labelledby="l_${f.k}" data-sw="${f.k}"><i></i></button></div>`;}).join('');
  /* velden onder elkaar; postcode + plaats en telefoon + e-mail naast elkaar */
  function veldenHtml(fs){let out='';
    for(let i=0;i<fs.length;i++){const f=fs[i],n=fs[i+1];
      if(n&&PAAR[f.k]===n.k){out+=`<div class="g2">${veld(f,true)}${veld(n,true)}</div>`;i++;}else out+=veld(f);}
    return out;}
  function veld(f,half){if(f.t==='vg')return `<div class="fr" data-r="vg"><span class="fl"><i class="dot" aria-hidden="true"></i>V&amp;G</span>${vgHtml(f)}</div>`;
    const id='g_'+f.k;
    return `<div class="fr" data-r="${f.k}"><label class="fl" for="${id}"><i class="dot" aria-hidden="true"></i>${esc(f.kort||f.l)}</label>${invoer(f,id,half)}</div>`;}
  /* tabblad Nog te doen: alleen lege verplichte velden; ingevulde in één gedempte regel */
  function blokTodo(x,c){
    const fs=lijstVelden(x).filter(f=>Velden.nodig(c,f,kant()));
    const open=fs.filter(f=>!Velden.gevuld(st.s,f,st.fotos)||st.vast.has(f.k)),vol=fs.filter(f=>!open.includes(f));
    if(!open.length)return'';
    const id=x.sc.id,uit=st.uit.has(id);
    return `<section class="gsec" data-gsec="${id}" aria-labelledby="gk_${id}">${kop(x,x.open.length)}${schakels(x)}
      ${veldenHtml(open)}
      ${vol.length?`<button class="ging" data-ing="${id}" aria-expanded="${uit}">✓ ${vol.length} ingevuld · ${esc(vol.map(f=>f.kort||f.l).join(', '))}</button><div data-ingl="${id}"${uit?'':' hidden'}>${veldenHtml(vol)}</div>`:''}
    </section>`;
  }
  /* tabblad Alles: rijen met label en waarde; tik klapt het invoerveld uit (één tegelijk) */
  function waardeHtml(f,c){const v=Velden.waarde(st.s,f.k),req=Velden.nodig(c,f,kant()),vol=Velden.gevuld(st.s,f,st.fotos);
    if(f.t==='foto'){const b=(st.s.bijlagen||{})[f.k];if(b){const u=URL.createObjectURL(b);st.urls.push(u);return `<img class="gth" src="${u}" alt="">`;}
      if(v==='nvt')return esc(f.nvt||'Niet beschikbaar');}
    else if(f.t==='vg'){const x=vg(),n=Object.values(x.items||{}).filter(i=>i.aan).length;if(x.nagelopen)return n?`${n} ${n===1?'situatie':'situaties'} · nagelopen`:'Geen bijzondere situaties';}
    else if(vol)return esc(f.t==='datum'?fmtD(v):String(v));
    return req?'<span class="wrn">Leeg</span>':'<span class="gm">–</span>';}
  function rij(f,c){if(st.edit===f.k)return `<div class="fed">${veld(f)}</div>`;
    return `<button class="grj" data-rij="${f.k}"><span class="l">${esc(f.kort||f.l)}</span><span class="v">${waardeHtml(f,c)}</span>${svg(VERDER,16)}</button>`;}
  function blokAlles(x,c){
    const fs=lijstVelden(x),req=fs.filter(f=>Velden.nodig(c,f,kant())),opt=fs.filter(f=>!req.includes(f)),id=x.sc.id;
    const optOpen=st.optOpen.has(id)||opt.some(f=>f.k===st.edit);if(optOpen)st.optOpen.add(id);
    return `<section class="gsec" data-gsec="${id}" aria-labelledby="gk_${id}">${kop(x,x.open.length)}${schakels(x)}
      <div class="grs">${req.map(f=>rij(f,c)).join('')}
      ${opt.length?`<button class="grj gopr" data-opt="${id}" aria-expanded="${optOpen}"><span class="l">Optioneel (${opt.length})</span><span class="v"></span>${svg('M6 9l6 6 6-6',16)}</button><div data-optl="${id}"${optOpen?'':' hidden'}>${opt.map(f=>rij(f,c)).join('')}</div>`:''}</div>
    </section>`;
  }
  /* info uit een ingelezen PAF (alleen lezen), onderaan in Alles */
  function pafHtml(){const p=st.s.paf;if(st.filter!=='alles'||!p||!(p.info||[]).length)return'';
    return `<section class="gsec" aria-labelledby="gk_paf"><div class="gsh"><h3 id="gk_paf">Uit PAF</h3><span class="sx" style="color:var(--mute)">${p.info.length}</span></div>${p.bestand?`<p class="gm" style="margin:-6px 0 10px;font-size:13px;overflow-wrap:anywhere">${esc(p.bestand)}</p>`:''}
      <div class="grs">${p.info.map(i=>`<div class="grj" style="cursor:default"><span class="l">${esc(i.label)}<br><small class="gm">${esc(i.groep)} · ${esc(i.sectie)}</small></span><span class="v">${esc(i.waarde)}</span></div>`).join('')}</div></section>`;}
  function openRij(k){if(!st)return;save(true);st.edit=k;lijst();focusVeld(k);}
  function focusVeld(k){const R=st.root,el=R.querySelector(`[data-r="${k}"]`);if(!el)return;st.cur=k;
    el.scrollIntoView({block:'center',behavior:'smooth'});const i=el.querySelector('input:not([type=checkbox]),textarea,button');if(i)i.focus({preventScroll:true});}
  /* naar het volgende lege verplichte veld, ook in een andere sectie */
  function volgende(){if(!st)return;save(true);
    const L=openVolgorde();const na=L.find(k=>k!==st.cur&&L.indexOf(k)>L.indexOf(st.cur))||L.find(k=>k!==st.cur);
    if(!na){st.edit=null;lijst();return;}
    const F=k=>Velden.VELDEN.find(f=>f.k===k);
    if(st.filter==='alles'){st.edit=na;lijst();}
    else if(!st.root.querySelector(`[data-r="${na}"]`)||Velden.groep(F(na))!==Velden.groep(F(st.cur)||{})){
      // naar een andere sectie: wat net is ingevuld mag nu naar de gedempte regel
      st.vast=new Set([...st.vast].filter(k=>Velden.groep(F(k))===Velden.groep(F(na))));lijst();}
    focusVeld(na);
  }
  function invoer(f,id,half){
    const v=Velden.waarde(st.s,f.k);
    switch(f.t){
      case 'lang':return `<textarea id="${id}" data-k="${f.k}" placeholder="${esc(vbTekst(f))}">${esc(v||'')}</textarea>`;
      case 'keuze':return `<div class="ch" role="group">${f.opties.map(o=>`<button data-k="${f.k}" data-v="${esc(o)}" class="${v===o?'on':''}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div>`;
      case 'janee':return `<div class="ch" role="group">${['Ja','Nee'].map(o=>`<button data-k="${f.k}" data-v="${o}" class="${v===o?'on':''}" aria-pressed="${v===o}">${o}</button>`).join('')}</div>`;
      case 'foto':{const b=(st.s.bijlagen||{})[f.k];let u='';if(b){u=URL.createObjectURL(b);st.urls.push(u);}
        if(f.k==='trace_geo'&&window.KaartTrace)return `<div class="ft">${b?`<img src="${u}" alt="${esc(f.kort||f.l)}">`:''}<button class="btn" data-kaart="1">${b?'Tracé aanpassen':'Kaart importeren en tracé intekenen'}</button></div>`;
        return `<div class="ft">${b?`<img src="${u}" alt="${esc(f.l)}">`:''}${v==='nvt'?`<b>${esc(f.nvt||'Niet beschikbaar')}</b>`:''}
          <button class="btn" data-foto="${f.k}" data-g="0">Foto maken</button><button class="btn" data-foto="${f.k}" data-g="1">Uit galerij</button>
          ${f.nvt?`<button class="btn" data-nvt="${f.k}">${v==='nvt'?'Toch beschikbaar':'Niet beschikbaar'}</button>`:''}${b?`<button class="btn" data-weg="${f.k}">Weghalen</button>`:''}</div>`;}
      default:{
        if(f.stap)return `<div class="stp"><button data-stp="${f.k}" data-d="-1" aria-label="Eén minder">−</button><input id="${id}" data-k="${f.k}" data-num="1" inputmode="numeric" enterkeyhint="next" value="${esc(v==null?'':v)}" placeholder="0"><button data-stp="${f.k}" data-d="1" aria-label="Eén meer">+</button></div>`;
        const ty={datum:'date',tel:'tel',mail:'email',getal:'number'}[f.t]||'text';
        return `<input id="${id}" type="${ty}" data-k="${f.k}" value="${esc(v==null?'':v)}" placeholder="${esc(vbTekst(f,half))}" enterkeyhint="next"${f.t==='getal'?' inputmode="numeric"':''}${f.t==='mail'?' autocomplete="email"':''}${f.t==='tel'?' autocomplete="tel"':''}>`;}
    }
  }
  function vg(){const v=Velden.waarde(st.s,'vg');return v&&typeof v==='object'?{items:{},...v}:{items:{}};}
  /* V&G is nagelopen zodra er een situatie gekozen is, of "Geen bijzondere situaties" */
  const vgAan=v=>Object.values(v.items||{}).some(x=>x.aan);
  const vgGeen=v=>!vgAan(v)&&(!!v.geen||!!v.nagelopen);
  function vgHtml(){
    const v=vg(),it=v.items||{},A=Velden.VG,ok=st.fotos.filter(p=>p.status!=='vervallen');
    const voor=new Set();['binnen','buiten'].forEach(sx=>{if(ok.some(p=>(p.sectie||'buiten')===sx))Velden.VG_VOORSTEL[sx].forEach(a=>voor.add(a));});
    const vx=a=>{const x=it[a.id]||{};return `<div class="vx"><b>${esc(hoofd(a.aspect))}</b>
      <input data-vgr="${a.id}" data-f="risico" placeholder="Risico's" value="${esc(x.risico!=null?x.risico:a.risico)}" aria-label="Risico's bij ${esc(a.aspect)}">
      <input data-vgr="${a.id}" data-f="afspraak" placeholder="Afspraken / randvoorwaarden" value="${esc(x.afspraak!=null?x.afspraak:a.afspraak)}" aria-label="Afspraken bij ${esc(a.aspect)}"></div>`;};
    const vaak=Velden.VG_VAAK.map(id=>A.find(a=>a.id===id));let tegels='';
    for(let i=0;i<vaak.length;i+=2){const p=vaak.slice(i,i+2);
      tegels+=p.map(a=>{const on=!!(it[a.id]&&it[a.id].aan),vs=!on&&voor.has(a.aspect);return `<button class="tile${on?' on':''}${vs?' voor':''}" data-vgt="${a.id}" aria-pressed="${on}">${esc(hoofd(a.aspect))}${vs?'<small>Voorgesteld</small>':''}</button>`;}).join('')
        +p.filter(a=>it[a.id]&&it[a.id].aan).map(vx).join('');}
    const rest=A.filter(a=>!Velden.VG_VAAK.includes(a.id)),nAan=rest.filter(a=>it[a.id]&&it[a.id].aan).length;let g='',meer='';
    rest.forEach(a=>{if(a.groep!==g){g=a.groep;meer+=`<div class="vgg">${esc(g)}</div>`;}const x=it[a.id]||{};
      meer+=`<div class="vgr"><label><input type="checkbox" data-vg="${a.id}" ${x.aan?'checked':''}>${esc(hoofd(a.aspect))}</label>${x.aan?vx(a):''}</div>`;});
    return `<div data-r="vg"><p class="info" style="margin:0 2px 10px">Tik op wat hier speelt, of op Geen bijzondere situaties. Risico en afspraak zijn al ingevuld; pas ze aan als het nodig is.</p>
      <div class="vgt">${tegels}<button class="tile geen${vgGeen(v)?' on':''}" data-vggeen aria-pressed="${vgGeen(v)}">Geen bijzondere situaties</button></div>
      <button class="gopt" id="vgMeer" aria-expanded="${st.vgMeer}"><span>Meer situaties (${rest.length})${nAan?' · '+nAan+' gekozen':''}</span>${svg(VERDER,18)}</button>
      <div id="vgMeerL"${st.vgMeer?'':' hidden'}>${meer}</div></div>`;}

  /* bolletjes, tellers en voortgang bijwerken zonder opnieuw te tekenen (niets verspringt tijdens het typen) */
  function upd(){if(!st)return;const R=st.root,s=st.s,c=Velden.cfg(),F=k=>Velden.VELDEN.find(x=>x.k===k);
    R.querySelectorAll('[data-r]').forEach(el=>{const f=F(el.dataset.r);if(f)el.classList.toggle('open',isOpen(f,c));});
    const L=secties(),n=L.reduce((t,x)=>t+x.open.length,0);
    L.forEach(x=>{const g=R.querySelector(`[data-sh="${x.sc.id}"]`);if(g)g.textContent=x.open.length?x.open.length+' open':'';});
    const t=R.querySelector('[data-f="todo"]');if(t)t.textContent=`Nog te doen (${n})`;
    const p=R.querySelector('.gpr');if(p)p.outerHTML=voortgang();
    const f=R.querySelector('.gf');if(f)f.hidden=!n&&!st.opts.afrond;const nx=R.querySelector('#gNx');if(nx)nx.hidden=!n;
  }
  function bind(){
    const R=st.root,s=st.s;
    R.querySelectorAll('[data-r]').forEach(el=>el.addEventListener('focusin',()=>{st.cur=el.dataset.r;}));
    R.querySelectorAll('input[data-k],textarea[data-k]').forEach(e=>{
      e.oninput=()=>{let v=e.value;if(e.dataset.num){const n=parseFloat(v.replace(',','.'));v=v.trim()===''?'':isFinite(n)?n:v;}
        st.vast.add(e.dataset.k);Velden.zet(s,e.dataset.k,v);save();upd();};
      if(e.tagName==='INPUT')e.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();st.cur=e.dataset.k;volgende();}};
      // Alles: bij wegtikken klapt het veld weer in
      if(st.filter==='alles')e.onblur=()=>{const k=e.dataset.k;setTimeout(()=>{if(!st||st.edit!==k)return;const ed=R.querySelector('.fed');if(ed&&ed.contains(document.activeElement))return;st.edit=null;save(true);lijst();},150);};});
    R.querySelectorAll('[data-stp]').forEach(b=>b.onclick=()=>{const k=b.dataset.stp,n=Math.max(0,(parseFloat(Velden.waarde(s,k))||0)+(+b.dataset.d));
      st.vast.add(k);Velden.zet(s,k,n);const i=R.querySelector(`input[data-k="${k}"]`);if(i)i.value=n;save();upd();});
    R.querySelectorAll('.ch button').forEach(b=>b.onclick=()=>{const k=b.dataset.k,on=Velden.waarde(s,k)===b.dataset.v;st.vast.add(k);Velden.zet(s,k,on?'':b.dataset.v);
      if(st.filter==='alles')st.edit=null;save(true).then(()=>herteken());});
    R.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const k=b.dataset.sw,f=Velden.VELDEN.find(x=>x.k===k),aan=Velden.zelfdeAan(s,k);
      if(aan)Object.entries(f.bron).forEach(([doel,bron])=>{const vv=(s.velden||{})[doel];if(vv==null||vv==='')Velden.zet(s,doel,Velden.waarde(s,bron)||'');}); // uitzetten: neem de klantgegevens over om aan te passen
      Velden.zet(s,k,aan?'Nee':'Ja');save(true).then(()=>herteken());});
    R.querySelectorAll('[data-foto]').forEach(b=>b.onclick=()=>{const k=b.dataset.foto;
      Camera.take({galerij:b.dataset.g==='1'}).then(async r=>{if(!r||!r.blob||!st)return;st.vast.add(k);s.bijlagen={...(s.bijlagen||{}),[k]:r.blob};if(Velden.waarde(s,k)==='nvt')Velden.zet(s,k,'');await save(true);herteken();});});
    R.querySelectorAll('[data-kaart]').forEach(b=>b.onclick=()=>KaartTrace.open(s,()=>{st.vast.add('trace_geo');herteken();}));
    R.querySelectorAll('[data-nvt]').forEach(b=>b.onclick=async()=>{const k=b.dataset.nvt;st.vast.add(k);Velden.zet(s,k,Velden.waarde(s,k)==='nvt'?'':'nvt');await save(true);herteken();});
    R.querySelectorAll('[data-weg]').forEach(b=>b.onclick=async()=>{const k=b.dataset.weg;const bl={...(s.bijlagen||{})};delete bl[k];s.bijlagen=bl;await save(true);herteken();});
    // V&G
    const zetVg=async(id,aan)=>{const v=vg(),a=Velden.VG.find(x=>x.id===id);v.items={...v.items,[id]:{risico:a.risico,afspraak:a.afspraak,...(v.items[id]||{}),aan}};
      if(aan)v.geen=false;v.nagelopen=vgAan(v)||!!v.geen;st.vast.add('vg');Velden.zet(s,'vg',v);await save(true);herteken();};
    R.querySelectorAll('[data-vgt]').forEach(b=>b.onclick=()=>{const v=vg();zetVg(b.dataset.vgt,!(v.items[b.dataset.vgt]&&v.items[b.dataset.vgt].aan));});
    R.querySelectorAll('[data-vg]').forEach(c=>c.onchange=()=>zetVg(c.dataset.vg,c.checked));
    R.querySelectorAll('[data-vgr]').forEach(e=>e.oninput=()=>{const v=vg(),id=e.dataset.vgr;v.items={...v.items,[id]:{...(v.items[id]||{}),[e.dataset.f]:e.value}};Velden.zet(s,'vg',v);save();});
    const mr=R.querySelector('#vgMeer');if(mr)mr.onclick=()=>{st.vgMeer=!st.vgMeer;mr.setAttribute('aria-expanded',st.vgMeer);R.querySelector('#vgMeerL').hidden=!st.vgMeer;};
    const gn=R.querySelector('[data-vggeen]');if(gn)gn.onclick=async()=>{const v=vg(),aan=!vgGeen(v);
      // geen bijzondere situaties: gekozen situaties gaan uit (risico en afspraak blijven bewaard)
      if(aan)Object.keys(v.items||{}).forEach(k=>{v.items[k]={...v.items[k],aan:false};});
      v.geen=aan;v.nagelopen=aan;st.vast.add('vg');Velden.zet(s,'vg',v);await save(true);herteken();};
  }
  function herteken(){if(!st)return;lijst();}

  /* ---------- bladen ---------- */
  /* "Afgerond" met nog verplichte punten open: waarschuwen en nog eens laten bevestigen */
  async function bevestigAf(open){const lijst=open.slice(0,8).map(f=>f.kort||f.l).join(', ')+(open.length>8?' en '+(open.length-8)+' meer':'');
    return (await vraag(`Nog ${open.length} verplicht open`,'Nog niet ingevuld: '+lijst+'. Weet je zeker dat dit deel afgerond is?',[['ja','Toch afgerond','pri'],['nee','Verder invullen','']]))==='ja';}
  function vraag(titel,tekst,knoppen){css();return new Promise(res=>{
    const d=document.createElement('div');d.className='gbl';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','gblT');
    d.innerHTML=`<div class="gblb"><h3 id="gblT">${esc(titel)}</h3>${tekst?`<p>${esc(tekst)}</p>`:''}${knoppen.map(([k,l,c])=>`<button class="btn ${c||''}" data-k="${k}">${esc(l)}</button>`).join('')}</div>`;
    document.body.appendChild(d);d.querySelector('[data-k]').focus();
    d.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{d.remove();res(b.dataset.k);});
    d.addEventListener('click',e=>{if(e.target===d){d.remove();res(null);}});});}

  /* na het plaatsen van de eerste serverkast: waar komt de kast? */
  async function naKast(photoId,klaar){
    css();const p=await Store.photos.get(photoId);if(!p)return;
    const s=(Gegevens.bron&&Gegevens.bron(p.surveyId))||await Store.surveys.get(p.surveyId);if(!s||s.kastGevraagd)return;
    s.kastGevraagd=true;
    if(!(s.bijlagen||{}).afw_foto){s.bijlagen={...(s.bijlagen||{}),afw_foto:p.blob};if(Velden.waarde(s,'afw_foto')==='nvt')Velden.zet(s,'afw_foto','');}
    await Store.surveys.put(s);
    const K=['afw_plaats','afw_ruimte','afw_kast','afw_apparatuur'].map(k=>Velden.VELDEN.find(f=>f.k===k));
    const u=URL.createObjectURL(s.bijlagen.afw_foto);
    const d=document.createElement('div');d.className='gbl';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','gkT');
    d.innerHTML=`<div class="gblb"><h3 id="gkT">Waar komt de kast?</h3><p>Deze foto wordt de foto van de kast in het document.</p><img src="${u}" alt="Foto van de plek van de kast">
      ${K.map(f=>`<div><label for="k_${f.k}">${esc(f.l)}</label><input id="k_${f.k}" data-k="${f.k}" value="${esc(Velden.waarde(s,f.k)||'')}" placeholder="${esc(f.vb?'bijv. '+f.vb:'')}"></div>`).join('')}
      <button class="btn pri" data-k2="ok">Opslaan</button><button class="btn" data-k2="later">Later</button></div>`;
    document.body.appendChild(d);
    let t=null;const bewaar=()=>Store.surveys.put(s);
    d.querySelectorAll('input[data-k]').forEach(i=>i.oninput=()=>{Velden.zet(s,i.dataset.k,i.value);clearTimeout(t);t=setTimeout(bewaar,350);});
    const dicht=async()=>{clearTimeout(t);await bewaar();URL.revokeObjectURL(u);d.remove();if(klaar)klaar();};
    d.querySelectorAll('[data-k2]').forEach(b=>b.onclick=dicht);
    d.querySelector('input').focus();
  }
  /* blok "nog te doen": informatie en foto's apart. html(s,fotos,kant) + bind(el,s,klaar) */
  const ICI='M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8v.01',ICF='M4 8h3l2-3h6l2 3h3v11H4z M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z';
  let tdUrls=[];
  function todoHtml(s,fotos,kant){css();const T=Velden.todo(s,fotos,kant);
    tdUrls.forEach(u=>URL.revokeObjectURL(u));tdUrls=[];
    const sec=fs=>[...new Set(fs.map(f=>f.t==='teller'?(f.kort||f.l):(Velden.SECTIES.find(x=>x.id===Velden.groep(f))||{}).kort))].join(' · ');
    const fotoNm=fs=>fs.map(f=>f.kort||f.l).join(' · ');
    const sub=(fs,txt)=>fs.length?`${fs.length} nog te doen · ${esc(txt)}`:'<span class="okk">✓ Compleet</span>';
    // kleine foto's van wat er al is, per sectie (buiten alleen bij OFFNET of als er buitenfoto's zijn)
    const ok=(fotos||[]).filter(p=>p.status!=='vervallen'&&p.blob),on=Velden.onnet(s);
    const groep=x=>ok.filter(p=>(p.sectie||'buiten')===x);
    const strip=x=>{const L=groep(x);if(x==='buiten'&&on&&!L.length)return'';const max=6;
      return `<span class="tdf"><span class="tdl"><i class="dot" style="background:var(--sec-${x})"></i>${x==='buiten'?'Buiten':'Binnen'} · ${L.length}</span><span class="tdth">${L.slice(0,max).map(p=>{const u=URL.createObjectURL(p.blob);tdUrls.push(u);return `<img src="${u}" alt="">`;}).join('')}${L.length>max?`<b>+${L.length-max}</b>`:''}</span></span>`;};
    const pijl=svg('M9 5l7 7-7 7',18);
    return `<div class="tdo">
      <button class="tdr${T.info.length?' wrn':''}" data-td="info" aria-label="Informatie: ${T.info.length?T.info.length+' nog te doen':'compleet'}. Tik om in te vullen."><span class="tdi">${svg(ICI,20)}</span><span class="tdt"><b>Informatie</b><small>${sub(T.info,sec(T.info))}</small></span><span class="tdp">${pijl}</span></button>
      <button class="tdr tdfo${T.fotos.length?' wrn':''}" data-td="foto" aria-label="Foto's: ${T.fotos.length?T.fotos.length+' nog te doen':'compleet'}. Tik om foto's toe te voegen."><span class="tdk"><span class="tdi">${svg(ICF,20)}</span><span class="tdt"><b>Foto's</b><small>${sub(T.fotos,fotoNm(T.fotos))}</small></span><span class="tdp">${pijl}</span></span>
        ${(on?['binnen']:['buiten','binnen']).map(strip).join('')}</button></div>`;}
  /* tik op Informatie: gegevens invullen; tik op Foto's: ontbrekende losse foto (bijv. kast) of de camera */
  function todoBind(el,s,klaar,o={}){
    const inf=el.querySelector('[data-td=info]'),ft=el.querySelector('[data-td=foto]');
    if(inf)inf.onclick=async()=>{const fo=await Store.photos.bySurvey(s.id,true),T=Velden.todo(s,fo,o.kant);open(s,{filter:T.info.length?'todo':'alles',onClose:klaar});};
    if(ft)ft.onclick=async()=>{const fo=await Store.photos.bySurvey(s.id,true),T=Velden.todo(s,fo,o.kant);
      const bijl=T.fotos.find(f=>f.t==='foto'),reeks=T.fotos.find(f=>f.t==='fotos');
      if(bijl&&!reeks){open(s,{filter:'todo',sectie:Velden.groep(bijl),onClose:klaar});return;}
      if(reeks&&!Velden.onnet(s)){s.sectie=reeks.sectie;await Store.surveys.put(s);}
      if(o.camera)o.camera();else if(bijl)open(s,{filter:'todo',sectie:Velden.groep(bijl),onClose:klaar});};
  }
  const TDCSS=`.tdo{display:flex;flex-direction:column;gap:8px}
.tdr{display:flex;align-items:center;gap:12px;width:100%;background:var(--card,#1C1F25);border:1px solid var(--line,#2E323A);border-radius:16px;padding:12px;color:var(--ink,#F3F4F6);font:inherit;text-align:left;cursor:pointer;min-height:64px}
.tdr:active{background:var(--card2)}
.tdr.wrn{border-color:var(--warn)}
.tdfo{flex-direction:column;align-items:stretch;gap:10px}.tdk{display:flex;align-items:center;gap:12px}
.tdi{flex:none;width:36px;height:36px;border-radius:10px;background:var(--well);display:grid;place-items:center;color:var(--mute)}
.tdr.wrn .tdi{color:var(--warn)}
.tdt{flex:1;min-width:0}.tdt b{display:block;font-size:16px;font-weight:800;line-height:1.2}
.tdt small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--mute);font-size:14px;margin-top:2px;line-height:1.3}
.tdt .okk{color:var(--ok,#22C55E);font-weight:700}
.tdp{flex:none;color:var(--mute)}
.tdf{display:flex;align-items:center;gap:10px}
.tdl{flex:none;width:84px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--mute)}
.tdl .dot{width:9px;height:9px;border-radius:50%;flex:none}
.tdth{flex:1;min-width:0;display:flex;gap:4px;align-items:center;overflow:hidden}
.tdth img{flex:none;width:36px;height:36px;object-fit:cover;border-radius:8px;border:1px solid var(--line2)}
.tdth b{font-size:13px;color:var(--mute);margin-left:2px}
.tdti{position:relative;flex:none;width:36px;height:36px;border-radius:8px;overflow:hidden;border:1px solid var(--line2)}.tdti img{display:block;width:100%;height:100%;border:0;border-radius:0}`;
  { const st0=document.createElement('style');st0.textContent=TDCSS;document.head.appendChild(st0); }
  /* ---------- velden direct op een scherm (bijv. gegevens kast, tellers binnen) ---------- */
  function inline(el,s,keys,o={}){css();
    const F=keys.map(k=>Velden.VELDEN.find(f=>f.k===k)).filter(f=>f&&Velden.actief(s,f));
    const c=Velden.cfg();
    const inv=f=>{const v=Velden.waarde(s,f.k),id='gi_'+f.k;
      if(f.t==='keuze'||f.t==='janee')return `<div class="ch" role="group">${(f.t==='janee'?['Ja','Nee']:f.opties).map(x=>`<button data-ik="${f.k}" data-v="${esc(x)}" class="${v===x?'on':''}" aria-pressed="${v===x}">${esc(x)}</button>`).join('')}</div>`;
      if(f.stap)return `<div class="stp"><button data-istp="${f.k}" data-d="-1" aria-label="Eén minder">−</button><input id="${id}" data-ik="${f.k}" data-num="1" inputmode="numeric" value="${esc(v==null?'':v)}" placeholder="0"><button data-istp="${f.k}" data-d="1" aria-label="Eén meer">+</button></div>`;
      if(f.t==='lang')return `<textarea id="${id}" data-ik="${f.k}" placeholder="${esc(f.vb?'bijv. '+f.vb:'')}">${esc(v||'')}</textarea>`;
      if(f.t==='teller')return `<input id="${id}" data-ik="${f.k}" data-num="1" inputmode="decimal" value="${esc(v==null?'':v)}" placeholder="0">`;
      return `<input id="${id}" type="${{getal:'number',tel:'tel',mail:'email',datum:'date'}[f.t]||'text'}" data-ik="${f.k}" value="${esc(v==null?'':v)}" placeholder="${esc(f.vb?'bijv. '+f.vb:'')}">`;};
    el.classList.add('gin');
    el.innerHTML=F.map(f=>`<div class="fr" data-ir="${f.k}"><label class="fl" for="gi_${f.k}"><span>${esc(f.kort||f.l)}</span><i class="vink" role="img" aria-label="ingevuld" hidden>✓</i></label>${inv(f)}</div>`).join('');
    let t=null;const bewaar=now=>{clearTimeout(t);const go=async()=>{await Store.surveys.put(s);if(o.onChange)o.onChange(s);};if(now)go();else t=setTimeout(go,350);};
    const zet=(f,v)=>{if(f.t==='teller')s.tellers={...(s.tellers||{}),[f.teller]:v===''?0:v};else Velden.zet(s,f.k,v);};
    const upd=()=>F.forEach(f=>{const r=el.querySelector(`[data-ir="${f.k}"]`),vol=Velden.gevuld(s,f,[]);r.querySelector('.vink').hidden=!vol;r.classList.toggle('mist',!vol&&Velden.nodig(c,f,o.kant));});
    el.querySelectorAll('input[data-ik],textarea[data-ik]').forEach(e=>e.oninput=()=>{const f=F.find(x=>x.k===e.dataset.ik);let v=e.value;
      if(e.dataset.num){const n=parseFloat(v.replace(',','.'));v=v.trim()===''?'':isFinite(n)?n:v;}zet(f,v);bewaar();upd();});
    el.querySelectorAll('[data-istp]').forEach(b=>b.onclick=()=>{const f=F.find(x=>x.k===b.dataset.istp),n=Math.max(0,(parseFloat(Velden.waarde(s,f.k))||0)+(+b.dataset.d));
      zet(f,n);el.querySelector(`input[data-ik="${f.k}"]`).value=n;bewaar(true);upd();});
    el.querySelectorAll('.ch button').forEach(b=>b.onclick=()=>{const f=F.find(x=>x.k===b.dataset.ik),on=Velden.waarde(s,f.k)===b.dataset.v;zet(f,on?'':b.dataset.v);
      el.querySelectorAll(`.ch button[data-ik="${f.k}"]`).forEach(x=>{const a=!on&&x===b;x.classList.toggle('on',a);x.setAttribute('aria-pressed',a);});bewaar(true);upd();});
    upd();return{bewaar:()=>bewaar(true)};
  }

  /* ---------- vakken op het schouwscherm: Informatie, Foto's buiten (alleen OFFNET), Foto's binnen ---------- */
  let vkUrls=[];
  /* signaalbolletje links in een vak: blauw = nog in te vullen, groen = afgerond */
  const sig=klaar=>`<i class="sig${klaar?' ok':''}" aria-hidden="true"></i>`;
  function vakkenHtml(s,fotos,kant){css();const V=Velden.vakken(s,fotos,kant),on=Velden.onnet(s);
    vkUrls.forEach(u=>URL.revokeObjectURL(u));vkUrls=[];
    const sec=fs=>[...new Set(fs.map(f=>f.t==='teller'||f.t==='foto'||f.t==='fotos'||f.t==='rolfoto'?(f.kort||f.l):(Velden.SECTIES.find(x=>x.id===Velden.groep(f))||{}).kort))].join(' · ');
    const sub=fs=>fs.length?`${fs.length} nog te doen · ${esc(sec(fs))}`:'<span class="okk">✓ Compleet</span>';
    const ok=(fotos||[]).filter(p=>p.status!=='vervallen'&&p.blob);
    const thumbs=x=>{const L=ok.filter(p=>(p.sectie||'buiten')===x),max=7;if(!L.length)return'';
      return `<span class="tdth">${L.slice(0,max).map(p=>{const u=URL.createObjectURL(p.blob);vkUrls.push(u);return `<span class="tdti" data-pid="${p.id}"><img src="${u}" alt=""></span>`;}).join('')}${L.length>max?`<b>+${L.length-max}</b>`:''}</span>`;};
    const n=x=>ok.filter(p=>(p.sectie||'buiten')===x).length;
    const pijl=svg('M9 5l7 7-7 7',18);
    const af=s.afgerond||{};
    const vk=(id,ic,titel,fs,extra)=>`<button class="tdr tdfo${fs.length?' wrn':''}" data-vk="${id}" aria-label="${esc(titel)}: ${af[id]?'afgerond':fs.length?fs.length+' nog te doen':'nog niet afgerond'}"><span class="tdk"><span class="tdi">${sig(af[id])}</span><span class="tdt"><b>${titel}</b><small>${sub(fs)}</small></span><span class="tdp">${pijl}</span></span>${extra||''}</button>`;
    const dot=x=>`<i class="dot" style="background:var(--sec-${x});width:12px;height:12px;border-radius:50%;display:block"></i>`;
    return `<div class="tdo">${vk('info','','Informatie',V.info)}
      ${on?'':vk('buiten',dot('buiten'),`Foto's buiten · ${n('buiten')}`,V.buiten,thumbs('buiten'))}
      ${vk('binnen',dot('binnen'),`Foto's binnen · ${n('binnen')}`,V.binnen,thumbs('binnen'))}</div>`;}
  function vakkenBind(el,s,klaar,o={}){
    el.querySelectorAll('[data-vk]').forEach(b=>b.onclick=async()=>{const x=b.dataset.vk;
      if(x==='info'){const fo=await Store.photos.bySurvey(s.id,true),V=Velden.vakken(s,fo,o.kant);
        open(s,{filter:V.info.length?'todo':'alles',zonder:['buiten','binnen','afw'],zonderK:window.KaartTrace?['trace_geo']:undefined,onClose:klaar,
          afrond:async()=>{s.afgerond={...(s.afgerond||{}),info:true};await Store.surveys.put(s);}});}
      else if(o.naar)o.naar(x);});
  }
  /* ---------- verplichte foto met een rol kiezen (aansluitpunt, invoer pand, beginpunt) ---------- */
  async function zetRol(foto,rol,alle){for(const p of alle)if(p.rol===rol&&p.id!==foto.id){delete p.rol;await Store.photos.put(p);}
    foto.rol=rol;await Store.photos.put(foto);}
  /* f is een foto met een rol (t:'rolfoto') of een losse foto-bijlage (t:'foto', bijv. de kast; die hoort bij binnen) */
  async function rolBlad(s,f,o={}){css();
    const bijl=f.t==='foto',sx=f.sectie||'binnen';
    const alle=await Store.photos.bySurvey(s.id,true),hier=alle.filter(p=>p.status!=='vervallen'&&(p.sectie||'buiten')===sx);
    const nu=bijl?hier.find(p=>p.id===(s.bijlageBron||{})[f.k]):hier.find(p=>p.rol===f.rol),heeft=bijl?!!(s.bijlagen||{})[f.k]:!!nu;
    if(nu&&(o.open||window.Editor)){if(o.open)o.open(nu);else Editor.openEditor(nu.id,{onClose:()=>{if(o.klaar)o.klaar();}});return;} // er is al een foto: meteen bewerken (legenda erop, of verwijderen)
    const us=[];const u=b=>{const x=URL.createObjectURL(b);us.push(x);return x;};
    const d=document.createElement('div');d.className='gbl';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','grT');
    d.innerHTML=`<div class="gblb"><h3 id="grT">${esc(f.kort||f.l)}</h3><p>${esc(f.vb?hoofd(f.vb)+'.':'')}</p>
      ${nu?`<div class="grnu"><span class="grnf"><img src="${u(nu.blob)}" alt="Gekozen foto"></span><b>✓ Gekozen: foto ${hier.indexOf(nu)+1}</b></div>`
        :bijl&&heeft?`<div class="grnu"><span class="grnf"><img src="${u(s.bijlagen[f.k])}" alt="Gekozen foto"></span><b>✓ Foto gekozen</b></div>`:`<p class="grleeg">Nog geen foto gekozen.</p>`}
      ${nu&&window.Editor?`<button class="btn pri" data-r="leg">Legenda toevoegen op deze foto</button>`:''}
      ${o.maak?`<button class="btn${nu?'':' pri'}" data-r="cam">${heeft?'Andere foto maken':'Foto maken'}</button><button class="btn" data-r="gal">Uit galerij</button>`:''}
      ${!nu&&hier.length?`<p>Of kopieer een foto ${sx} die er al is, met de items erop:</p><div class="grk">${hier.map((p,i)=>`<button data-p="${p.id}" aria-label="Foto ${i+1} kopiëren"><img src="${u(p.blob)}" alt=""><span>${i+1}</span></button>`).join('')}</div>`:''}
      ${heeft?`<button class="btn" data-r="weg">${bijl?'Foto weghalen':'Niet meer als verplichte foto'}</button>`:''}
      <button class="btn" data-r="x">Annuleren</button></div>`;
    document.body.appendChild(d);d.querySelector('button').focus();
    if(window.Legend&&Legend.thumb){d.querySelectorAll('[data-p]').forEach(b=>{const p=hier.find(x=>x.id===b.dataset.p);if(p&&p.ann)Legend.thumb(b,p.ann);});if(nu&&nu.ann)Legend.thumb(d.querySelector('.grnf'),nu.ann);}
    const dicht=r=>{us.forEach(x=>URL.revokeObjectURL(x));d.remove();if(r&&o.klaar)o.klaar();};
    d.addEventListener('click',e=>{if(e.target===d)dicht(false);});
    d.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{const r=b.dataset.r;
      if(r==='x')return dicht(false);
      if(r==='leg'){dicht(false);Editor.openEditor(nu.id,{onClose:()=>{if(o.klaar)o.klaar();}});return;}
      if(r==='weg'){if(bijl){const bl={...(s.bijlagen||{})};delete bl[f.k];s.bijlagen=bl;if(s.bijlageBron)delete s.bijlageBron[f.k];await Store.surveys.put(s);}
        else{delete nu.rol;await Store.photos.put(nu);}return dicht(true);}
      dicht(false);if(o.maak)o.maak(r==='gal');}); // camera direct in de tik openen
    /* kopiëren: een nieuwe, losse foto met dezelfde pijlen en items; het origineel blijft gewoon staan */
    d.querySelectorAll('[data-p]').forEach(b=>b.onclick=async()=>{const p=hier.find(x=>x.id===b.dataset.p);if(!p)return;b.disabled=true;
      const c=await Store.photos.put({surveyId:s.id,blob:await Velden.kopie(p.blob),ann:JSON.parse(JSON.stringify(p.ann||{})),bron:p.bron,status:'ok',sectie:sx,kopieVan:p.id});
      if(bijl){s.bijlagen={...(s.bijlagen||{}),[f.k]:await Velden.kopie(c.blob)};s.bijlageBron={...(s.bijlageBron||{}),[f.k]:c.id};if(f.k==='afw_foto')s.kastGevraagd=true;
        if(Velden.waarde(s,f.k)==='nvt')Velden.zet(s,f.k,'');await Store.surveys.put(s);}
      else await zetRol(c,f.rol,alle.concat([c]));
      dicht(true);});
  }
  window.Gegevens={sig,bevestigAf,open,close:()=>close(),naKast,vraag,todoHtml,todoBind,inline,vakkenHtml,vakkenBind,rolBlad,zetRol,bron:null};
})();
