/* Gedeelde schermen voor een variant: startscherm (nieuw / doorgaan) en het schouwoverzicht
   (fotostrook met "Vervalt", tellers, naar document). Gebruikt door Veeg & Klik en Richt & Zet.
   SurveyUI.init({
     variant:'veeg', naam:'Veeg & Klik',
     acties:(survey,aantal)=>[{label,pri,fn}],   // knoppen bovenaan het overzicht
     tellen:(survey,fotos)=>({meters?,metersNote?,invoeringen}),  // tellers die de app zelf bepaalt
     metersZelf:true,                             // meters zelf invullen (anders telt de app)
     openFoto:(survey,photoId)=>{},              // tik op een foto in de strook
     eigenScherm:(survey)=>{}                    // optioneel: eigen scherm in plaats van het overzicht
   })  Vereist store.js en editor.js (voor stripBind). */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmtD=d=>d?new Date(d).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'}):'';
  const nl1=v=>(Math.round(v*10)/10).toLocaleString('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1});
  const CSS=`
.sui h2{font-size:22px;margin:22px 0 10px}
.sui label{display:block;font-weight:700;margin:14px 0 6px}
.sui input.f{width:100%;min-height:54px;border-radius:14px;border:1px solid var(--line2);background:var(--well);padding:0 16px;font-size:17px}
.sui .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.sui .row .btn{flex:1}
.sui .big{width:100%;min-height:64px;font-size:19px}
/* startscherm (Glasvezel) */
.sui .shead{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:8px 0 14px}
.sui .shead h2{margin:0;font-size:36px;line-height:1;font-weight:800;letter-spacing:-.02em}
.sui .shead span{color:var(--mute);font-size:15px;white-space:nowrap}
.sui .snew{width:100%;min-height:60px;font-size:19px}
.sui .snp{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px}
.sui .snp label{margin:0 0 8px}
.sui .snp .take{display:block;width:100%;margin-top:10px;text-align:left;font-weight:600;min-height:48px;border-radius:14px;padding:12px 16px;line-height:1.3}
.sui .snp .take span{color:var(--mute);font-weight:400;margin-right:4px}
.sui .surv{display:flex;flex-direction:column;gap:12px;margin-top:14px}
.sui .sv{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px 8px;width:100%;padding:16px;border-radius:var(--r);background:var(--card);border:1px solid var(--line);color:var(--ink);text-align:left;cursor:pointer;font:inherit}
.sui .sv:active{background:var(--card2)}
.sui .sv b{display:block;font-size:20px;font-weight:600;line-height:1.15}
.sui .sst{display:flex;align-items:center;gap:7px;color:var(--mute);font-size:15px;margin-top:4px}
.sui .dot{flex:none;display:inline-block;width:10px;height:10px;border-radius:5px}
.sui .sv .go{align-self:start;margin-top:3px;color:var(--mute)}
.sui .srings{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sui .ring{display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.25;color:var(--mute)}
.sui .ring svg{flex:none}.sui .ring b{display:block;color:var(--ink);font-size:16px;font-weight:800}
.sui .slink{display:flex;justify-content:center;align-items:center;min-height:44px;margin:18px auto 0;color:var(--mute);font-weight:600;font-size:15px;text-decoration:none}
.sui .sleeg{color:var(--mute);margin:14px 2px 0}
.sui .strip{display:flex;gap:8px;overflow-x:auto;padding:4px 0 8px}
.sui .th{position:relative;flex:none;width:96px;height:72px;border-radius:12px;overflow:hidden;border:2px solid var(--line);background:#000;padding:0;cursor:pointer}
.sui .th img{width:100%;height:100%;object-fit:cover;display:block}.sui .th.vv img{filter:grayscale(1) brightness(.45)}
.sui .th span{position:absolute;left:5px;bottom:3px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000}
.sui .th em{position:absolute;inset:auto 0 0 0;font-style:normal;font-size:12px;font-weight:800;background:#000b;color:#fff;text-align:center}
.sui .tel{display:flex;flex-direction:column;border:2px solid var(--line);border-radius:var(--r);overflow:hidden}
.sui .tel .r{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);min-height:64px}.sui .tel .r:last-child{border-bottom:0}
.sui .tel .r .l{flex:1}.sui .tel .r .l small{display:block;color:var(--mute);font-size:14px}
.sui .tel input{width:96px;min-height:48px;border-radius:12px;border:2px solid var(--line);background:var(--card);text-align:right;padding:0 10px;font-size:18px}
.sui .tel .v{min-width:48px;text-align:center;font-size:22px;font-weight:800;white-space:nowrap}
.sui .step{width:48px;height:48px;border-radius:12px;border:2px solid var(--line);background:var(--card);font-size:24px;font-weight:800;cursor:pointer}
.sui .sdel2,.sui .sdelx{border-color:var(--red)}
.sui .sdel2.sure,.sui .sdelx.sure{background:var(--red);border-color:var(--red);color:#fff}
.sui .sfold{display:flex;align-items:center;gap:10px;width:100%;min-height:56px;margin-top:14px;border:1px solid var(--line);border-radius:var(--r-pill);background:transparent;color:var(--ink);font-size:16px;font-weight:600;padding:0 18px;cursor:pointer;text-align:left}
.sui .sfold .n{flex:1;min-width:0;color:var(--mute);font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sui .sfold svg{flex:none;transition:transform .15s}.sui .sfold[aria-expanded="true"] svg{transform:rotate(90deg)}
.sui .sfold+.surv{margin-top:10px}
.sui .sdone{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:14px}
.sui .sdone .sh b{display:block;font-size:18px;font-weight:600;line-height:1.2}
.sui .sdone .sb{display:flex;gap:8px;margin-top:10px}.sui .sdone .sb .btn{flex:1;min-height:48px;padding:0 8px}
.sui .spb i{display:block;height:6px;border-radius:3px;background:var(--track);overflow:hidden}.sui .spb i b{display:block;height:100%;background:var(--prog-in)}
@media (prefers-reduced-motion:reduce){.sui .sfold svg{transition:none}}
.sui .sblk{background:var(--card);border:2px solid var(--line);border-radius:var(--r);padding:12px;margin-top:4px}
.sui .sstep{display:flex;list-style:none;margin:0 0 10px;padding:0;gap:4px}
.sui .sstep li{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;color:var(--mute);text-align:center;line-height:1.15}
.sui .sstep li i{display:block;width:100%;height:6px;border-radius:3px;background:var(--track)}
.sui .sstep li.nu{color:var(--ink);font-weight:800}
.sui .spb{display:grid;grid-template-columns:84px 1fr auto;gap:10px;align-items:center;width:100%;min-height:48px;margin-top:6px;border:0;background:var(--bg);border-radius:12px;color:var(--ink);font-size:16px;font-weight:700;padding:0 12px;cursor:pointer;text-align:left}
.sui .spb i{height:10px;border-radius:5px}
.sui .smist{margin:6px 2px 0;font-size:14px;color:var(--warn)}
.sui .sect{display:flex;align-items:center;gap:6px;margin-top:12px}.sui .sect span{font-weight:700;color:var(--mute);margin-right:4px}
.sui .sect button{flex:1;min-height:44px;border-radius:12px;border:2px solid var(--line);background:var(--card);color:var(--ink);font-weight:800;font-size:16px;cursor:pointer}
.sui .sect button.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc)}
.stoast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:90;background:var(--ink);color:#111;font-weight:700;padding:12px 18px;border-radius:14px;max-width:92vw;box-shadow:0 8px 24px #000a}`;
  let cfg=null,survey=null,urls={},main=null,showDone=false,showArch=false,newOpen=false;
  /* "vandaag", "gisteren", "24 nov" of "24 nov 2025" */
  function relD(d){if(!d)return'';const t=new Date(d),n=new Date();if(isNaN(t))return'';
    const dag=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),v=Math.round((dag(n)-dag(t))/864e5);
    if(v===0)return'vandaag';if(v===1)return'gisteren';
    return t.toLocaleDateString('nl-NL',t.getFullYear()===n.getFullYear()?{day:'numeric',month:'short'}:{day:'numeric',month:'short',year:'numeric'});}
  /* voortgangsring (Intake / Document) */
  function ring(lab,v,kleur){const len=v.totaal?v.pct/100*125.66:0;
    return `<span class="ring"><svg width="44" height="44" viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="20" fill="none" style="stroke:var(--track)" stroke-width="6"/>${len>0?`<circle cx="25" cy="25" r="20" fill="none" style="stroke:${kleur}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} 200" transform="rotate(-90 25 25)"/>`:''}</svg><span>${lab}<b>${v.totaal?v.klaar+'/'+v.totaal:'–'}</b></span></span>`;}
  const ICO={
    plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>',
    pijl:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };
  function css(){if($('suicss'))return;const s=document.createElement('style');s.id='suicss';s.textContent=CSS;document.head.appendChild(s);}
  let tT=null;
  function toast(t){let e=$('stoast');if(!e){e=document.createElement('div');e.id='stoast';e.className='stoast';e.setAttribute('role','status');document.body.appendChild(e);}
    e.textContent=t;e.hidden=false;clearTimeout(tT);tT=setTimeout(()=>e.hidden=true,2600);}
  const NAMEN={origineel:'Origineel',veeg:'Veeg & Klik',richt:'Richt & Zet',loop:'Loop-spoor'};
  function binnenAan(){const c=Velden.cfg().binnen_fotos;return c.in!=='nee'||c.uit!=='nee';}
  function title(t){const h=$('ttl');if(h)h.textContent=t;}

  async function init(c){
    cfg=c;css();main=$('main');main.classList.add('sui');
    try{localStorage.setItem('sisu.lastVariant',cfg.variant);}catch(e){}
    try{await start();}catch(e){main.innerHTML=`<p class="note">Kon de opslag niet openen: ${esc(e.message||e)}</p>`;}
  }
  async function start(){
    const want=new URLSearchParams(location.search).get('survey');
    if(want){const s=await Store.surveys.get(want);if(s)return show(s);}
    const all=await Store.surveys.list(),st=x=>Velden.statusOf(x);
    const open=all.filter(x=>['new','intake','gelopen'].includes(st(x))),done=all.filter(x=>st(x)==='klaar'),arch=all.filter(x=>st(x)==='archief'),lastOpen=open[0];
    title(cfg.startTitel||cfg.naam);survey=null;if(cfg.onScreen)cfg.onScreen('start');
    const fotos={};for(const x of all)fotos[x.id]=await Store.photos.bySurvey(x.id,true);
    if(!all.length)newOpen=true;
    // statusregel: gekleurd bolletje + "Gelopen · vandaag" (+ "gemaakt in …" als het uit een andere variant komt)
    const sst=x=>{const m=Velden.statusMeta(st(x));return `<span class="sst"><i class="dot" style="background:var(--st-${m.id})"></i><span>${esc(m.naam)} · ${esc(relD(x.datum))}${x.variant&&x.variant!==cfg.variant?' · gemaakt in '+esc(NAMEN[x.variant]||x.variant):''}</span></span>`;};
    const rings=x=>`<span class="srings">${ring('Intake',Velden.voortgang(x,fotos[x.id],'in'),'var(--prog-in)')}${ring('Document',Velden.voortgang(x,fotos[x.id],'uit'),'var(--prog-doc)')}</span>`;
    const fold=(id,open,label,lijst,status)=>`<button class="sfold" id="${id}" aria-expanded="${open}"><i class="dot" style="background:var(--st-${status})"></i>${label}<span class="n">· ${lijst.length===1?esc(lijst[0].adres||'zonder adres'):lijst.length+' schouwen'}</span>${ICO.pijl}</button>`;
    const kaart=(x,knoppen)=>`<div class="sdone"><div class="sh"><b>${esc(x.adres||'zonder adres')}</b>${sst(x)}</div>${knoppen}</div>`;
    main.innerHTML=`
     <div class="shead"><h2>Schouwen</h2>${open.length?`<span>${open.length} bezig</span>`:''}</div>
     <button class="btn pri snew" id="new" aria-expanded="${newOpen}" aria-controls="snp"${newOpen?' hidden':''}>${ICO.plus}Nieuwe schouw</button>
     <div class="snp" id="snp"${newOpen?'':' hidden'}>
       <label for="adr">Adres van de nieuwe schouw</label>
       <input class="f" id="adr" autocomplete="street-address" placeholder="Straat en huisnummer, plaats">
       ${lastOpen&&lastOpen.adres?`<button class="btn take" id="take"><span>Adres overnemen:</span>${esc(lastOpen.adres)}</button>`:''}
       <div class="row">${all.length?'<button class="btn" id="cancel">Annuleren</button>':''}<button class="btn pri" id="go" style="flex:1.4">Start schouw</button></div>
     </div>
     ${open.length?`<div class="surv">${open.map(x=>`<button class="sv" data-id="${esc(x.id)}"><span><b>${esc(x.adres||'zonder adres')}</b>${sst(x)}</span><span class="go">${ICO.pijl}</span>${rings(x)}</button>`).join('')}</div>`
       :(all.length?'<p class="sleeg">Niets bezig. Tik op Nieuwe schouw om te beginnen.</p>':'')}
     ${done.length?fold('fold',showDone,'Klaar',done,'klaar')+(showDone?`<div class="surv">${done.map(x=>kaart(x,`
         <div class="sb"><a class="btn pri" href="shared/document.html?survey=${encodeURIComponent(x.id)}">Document</a><button class="btn" data-share="${esc(x.id)}">Delen (PDF)</button></div>
         <div class="sb"><button class="btn" data-open="${esc(x.id)}">Openen</button><button class="btn" data-arch="${esc(x.id)}">Archiveren</button></div>`)).join('')}</div>`:''):''}
     ${arch.length?fold('foldA',showArch,'Archief',arch,'archief')+(showArch?`<div class="surv">${arch.map(x=>kaart(x,`
         <div class="sb"><a class="btn" href="shared/document.html?survey=${encodeURIComponent(x.id)}">Document</a><button class="btn" data-share="${esc(x.id)}">Delen (PDF)</button></div>
         <div class="sb"><button class="btn" data-unarch="${esc(x.id)}">Terugzetten</button><button class="btn sdel2" data-del="${esc(x.id)}">Verwijderen</button></div>`)).join('')}</div>`:''):''}
     ${cfg.startExtra||''}`;
    main.querySelectorAll('.sv,[data-open]').forEach(b=>b.onclick=async()=>show(await Store.surveys.get(b.dataset.id||b.dataset.open)));
    main.querySelectorAll('[data-del]').forEach(b=>{let t=null;const lab=b.textContent;b.onclick=async()=>{
      if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent='Zeker? Tik nog eens';t=setTimeout(()=>{b.classList.remove('sure');b.textContent=lab;},3000);return;}
      clearTimeout(t);await Store.surveys.del(b.dataset.del);toast('Schouw verwijderd');start();};});
    main.querySelectorAll('[data-arch]').forEach(b=>b.onclick=async()=>{const x=await Store.surveys.get(b.dataset.arch);x.status='archief';await Store.surveys.put(x);toast('Naar het archief');start();});
    main.querySelectorAll('[data-unarch]').forEach(b=>b.onclick=async()=>{const x=await Store.surveys.get(b.dataset.unarch);x.status='klaar';await Store.surveys.put(x);toast('Terug bij Klaar');start();});
    main.querySelectorAll('[data-share]').forEach(b=>{if(window.PdfDoc)PdfDoc.bindShare(b,b.dataset.share,toast);else b.hidden=true;});
    if($('fold'))$('fold').onclick=()=>{showDone=!showDone;start();};
    if($('foldA'))$('foldA').onclick=()=>{showArch=!showArch;start();};
    // Nieuwe schouw: de knop klapt het adresblok open (geen los blad onderin: op de iPhone schuift het toetsenbord daar overheen)
    $('new').onclick=()=>{newOpen=true;$('new').hidden=true;$('new').setAttribute('aria-expanded','true');$('snp').hidden=false;$('adr').focus();};
    if($('cancel'))$('cancel').onclick=()=>{newOpen=false;$('adr').value='';$('snp').hidden=true;$('new').hidden=false;$('new').setAttribute('aria-expanded','false');$('new').focus();};
    $('adr').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('go').click();}};
    if($('take'))$('take').onclick=()=>{$('adr').value=lastOpen.adres;};
    $('go').onclick=async()=>{const a=$('adr').value.trim();if(!a){toast('Vul eerst het adres in');$('adr').focus();return;}
      newOpen=false;
      const x=await Store.surveys.put({adres:a,variant:cfg.variant,status:'new'});await show(x);
      const i=Velden.voortgang(x,[],'in');if(i.totaal)Gegevens.open(x,'intake',{onClose:()=>show(x)});};
  }

  /* ---------- status en voortgang van één schouw ---------- */
  async function statusBlock(el,s,na){
    const ph=await Store.photos.bySurvey(s.id,true),cur=Velden.statusOf(s);
    // automatisch: new -> intake compleet zodra alle verplichte intake-velden er zijn
    const vi=Velden.voortgang(s,ph,'in'),vo=Velden.voortgang(s,ph,'uit');
    if(cur==='new'&&vi.totaal&&vi.mist.length===0){s.status='intake';await Store.surveys.put(s);toast('Intake compleet');return statusBlock(el,s,na);}
    const idx=Velden.STATUS.findIndex(x=>x.id===cur);
    const knop={new:{l:'Intake afronden',to:'intake',check:'in'},intake:{l:'Schouw gelopen',to:'gelopen'},gelopen:{l:'Schouw afronden (klaar)',to:'klaar',check:'uit'},klaar:{l:'Archiveren',to:'archief'},archief:{l:'Terugzetten naar Klaar',to:'klaar'}}[cur];
    const terug={intake:'new',gelopen:'intake',klaar:'gelopen'}[cur];
    const mist=v=>v.mist.length?`<p class="smist">Nog verplicht: ${v.mist.slice(0,6).map(f=>esc(f.l)).join(', ')}${v.mist.length>6?' en '+(v.mist.length-6)+' meer':''}</p>`:'';
    el.innerHTML=`<div class="sblk">
      <ol class="sstep" aria-label="Status">${Velden.STATUS.map((x,i)=>`<li class="${i<idx?'af':i===idx?'nu':''}" ${i===idx?'aria-current="step"':''}><i style="${i<=idx?'background:'+x.kleur:''}"></i><span>${esc(x.naam)}</span></li>`).join('')}</ol>
      <button class="spb" id="sbI"><span>Intake</span><i><b style="width:${vi.pct}%"></b></i><span>${vi.klaar}/${vi.totaal}</span></button>
      ${cur==='new'?mist(vi):''}
      <button class="spb" id="sbO"><span>Document</span><i><b style="width:${vo.pct}%"></b></i><span>${vo.klaar}/${vo.totaal}</span></button>
      ${cur==='gelopen'?mist(vo):''}
      <div class="row">${terug?`<button class="btn" id="sbB">‹ ${esc(Velden.statusMeta(terug).naam)}</button>`:''}<button class="btn pri" id="sbN">${esc(knop.l)}</button></div></div>`;
    const reopen=()=>{if(na)na();else show(s);};
    $('sbI').onclick=()=>Gegevens.open(s,'intake',{onClose:reopen});
    $('sbO').onclick=()=>Gegevens.open(s,'alles',{onClose:reopen});
    if($('sbB'))$('sbB').onclick=async()=>{s.status=terug;await Store.surveys.put(s);reopen();};
    $('sbN').onclick=async()=>{
      const v=knop.check==='in'?vi:knop.check==='uit'?vo:null;
      if(v&&v.mist.length){toast(`Nog ${v.mist.length} verplicht${v.mist.length===1?' veld':'e velden'} leeg`);Gegevens.open(s,knop.check==='in'?'intake':'alles',{onClose:reopen});return;}
      if(knop.to==='gelopen'&&!ph.some(p=>p.status!=='vervallen'))toast("Let op: er zijn nog geen foto's");
      s.status=knop.to;if(knop.to==='gelopen'&&!s.gelopenOp)s.gelopenOp=new Date().toISOString();
      await Store.surveys.put(s);toast('Status: '+Velden.statusMeta(knop.to).naam);
      if(knop.to==='klaar'||knop.to==='archief'){history.replaceState(null,'',location.pathname);start();}else reopen();};
  }
  /* knop "Schouw verwijderen" (verhuisd van het startscherm naar de schouw): twee keer tikken */
  function bindDel(btn,s,voor){if(!btn)return;let t=null;const lab=btn.textContent;btn.onclick=async()=>{
    if(!btn.classList.contains('sure')){btn.classList.add('sure');btn.textContent='Zeker? Tik nog eens';t=setTimeout(()=>{btn.classList.remove('sure');btn.textContent=lab;},3000);return;}
    clearTimeout(t);if(voor)voor();await Store.surveys.del(s.id);toast('Schouw verwijderd');survey=null;history.replaceState(null,'',location.pathname);start();};}
  async function recount(){
    if(!survey)return;const ph=await Store.photos.bySurvey(survey.id),t=cfg.tellen(survey,ph)||{};
    const T={meters:0,invoeringen:0,boringen:0,...survey.tellers,...t};
    if(JSON.stringify(T)!==JSON.stringify(survey.tellers)){survey.tellers=T;await Store.surveys.put(survey);}
    const i=$('ti');if(i)i.textContent=T.invoeringen||0;const m=$('tmv');if(m)m.textContent=nl1(T.meters||0)+' m';
    return T;
  }
  async function show(s){
    survey=s;history.replaceState(null,'','?survey='+encodeURIComponent(s.id));title(s.adres||cfg.naam);
    // een schouw uit een andere variant gaat vanaf nu verder in deze variant (terugknoppen en 'Doorgaan met' volgen dat)
    if(s.variant!==cfg.variant){const was=NAMEN[s.variant]||s.variant;s.variant=cfg.variant;await Store.surveys.put(s);if(was)toast(`Deze schouw gaat nu verder in ${cfg.naam} (was ${was})`);}
    title((s.adres||cfg.naam)+' · '+cfg.naam);if(cfg.onScreen)cfg.onScreen('survey');
    if(cfg.eigenScherm)return cfg.eigenScherm(s); // variant met een eigen schouwscherm (Loop-spoor)
    const ph=await Store.photos.bySurvey(s.id,true),ok=ph.filter(p=>p.status!=='vervallen');
    Object.values(urls).forEach(u=>URL.revokeObjectURL(u));urls={};ph.forEach(p=>urls[p.id]=URL.createObjectURL(p.blob));
    const T=await recount(),acts=cfg.acties(s,ok.length);
    main.innerHTML=`
     <div id="stblk"></div>
     ${binnenAan()?`<div class="sect" role="group" aria-label="Foto's voor"><span>Foto's voor</span>${['buiten','binnen'].map(x=>`<button data-sect="${x}" class="${(s.sectie||'buiten')===x?'on':''}" aria-pressed="${(s.sectie||'buiten')===x}">${x==='buiten'?'Buiten':'Binnen'}</button>`).join('')}</div>`:''}
     ${acts.map((a,i)=>`<div class="row"${i?'':' style="margin-top:4px"'}><button class="btn${a.pri?' pri big':''}" data-a="${i}">${esc(a.label)}</button></div>`).join('')}
     <h2>Foto's</h2>
     ${ph.length?`<div class="strip">${ph.map((p,i)=>`<button class="th${p.status==='vervallen'?' vv':''}" data-id="${p.id}" aria-label="Foto ${i+1}${p.status==='vervallen'?', vervalt':''}"><img src="${urls[p.id]}" alt=""><span>${i+1}${p.sectie==='binnen'?' · binnen':''}</span>${p.status==='vervallen'?'<em>vervalt</em>':''}</button>`).join('')}</div>
     <p class="note">Tik om te bewerken. Lang drukken: vervalt (ander tracé) of terugzetten.</p>`:'<p class="note">Nog geen foto\'s. Begin bij de aansluiting op het netwerk.</p>'}
     <h2>Tellers</h2>
     <div class="tel">
       ${cfg.metersZelf
         ?`<div class="r"><div class="l"><label for="tm" style="margin:0">Meters buiten tracé</label><small>Zelf invullen: deze variant meet niet.</small></div><input id="tm" inputmode="decimal" value="${esc(T.meters||'')}" placeholder="0"></div>`
         :`<div class="r"><div class="l">Meters buiten tracé<small>${esc(T.metersNote||'')}</small></div><span class="v" id="tmv">${nl1(T.meters||0)} m</span></div>`}
       <div class="r"><div class="l">Invoeringen<small>${esc(cfg.invoerUitleg||'Telt de app.')}</small></div><span class="v" id="ti">${T.invoeringen||0}</span></div>
       <div class="r"><div class="l">Boringen/persingen</div><button class="step" id="bm" aria-label="Eén minder">−</button><span class="v" id="tb">${T.boringen||0}</span><button class="step" id="bp" aria-label="Eén meer">+</button></div>
     </div>
     <div class="row" style="margin-top:20px"><a class="btn pri" href="shared/storyline.html?survey=${encodeURIComponent(s.id)}">Naar document</a></div>
     <div class="row"><button class="btn" id="other">Andere schouw</button></div>
     <div class="row"><button class="btn sdelx" id="sdel">Schouw verwijderen</button></div>`;
    statusBlock($('stblk'),s);
    bindDel($('sdel'),s);
    main.querySelectorAll('[data-sect]').forEach(b=>b.onclick=async()=>{s.sectie=b.dataset.sect;await Store.surveys.put(s);main.querySelectorAll('[data-sect]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});toast("Nieuwe foto's: "+(s.sectie==='binnen'?'binnen':'buiten'));});
    main.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>acts[+b.dataset.a].fn(survey));
    main.querySelectorAll('.th').forEach(b=>Editor.stripBind(b,b.dataset.id,id=>cfg.openFoto(survey,id),()=>ph.find(p=>p.id===b.dataset.id),async p=>{
      await Store.photos.put(p);toast(p.status==='vervallen'?'Foto vervalt: telt niet mee en komt niet in het document':'Foto teruggezet');show(survey);}));
    if($('tm'))$('tm').onchange=async()=>{const v=parseFloat($('tm').value.replace(',','.'));survey.tellers={...survey.tellers,meters:isFinite(v)?v:0};await Store.surveys.put(survey);toast('Opgeslagen');};
    const step=async d=>{const n=Math.max(0,(survey.tellers.boringen||0)+d);survey.tellers={...survey.tellers,boringen:n};$('tb').textContent=n;await Store.surveys.put(survey);};
    $('bm').onclick=()=>step(-1);$('bp').onclick=()=>step(1);
    $('other').onclick=()=>{history.replaceState(null,'',location.pathname);start();};
  }
  window.SurveyUI={init,statusBlock,binnenAan,bindDel,show:s=>show(s||survey),start:()=>{history.replaceState(null,'',location.pathname);return start();},recount,toast,current:()=>survey};
})();
