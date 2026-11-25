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
.sui input.f{width:100%;min-height:52px;border-radius:14px;border:2px solid var(--line);background:var(--card);padding:0 14px;font-size:17px}
.sui .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.sui .row .btn{flex:1}
.sui .big{width:100%;min-height:64px;font-size:19px}
.sui .surv{display:flex;flex-direction:column;gap:10px}
.sui .sv{display:flex;align-items:center;gap:12px;min-height:64px;padding:10px 14px;border-radius:var(--r);background:var(--card);border:2px solid var(--line);color:var(--ink);text-align:left;cursor:pointer;width:100%}
.sui .sv b{display:block;font-size:17px}.sui .sv span{display:block;color:var(--mute);font-size:15px}.sui .sv .go{margin-left:auto;font-size:24px;font-weight:900}
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
.sui .svr{display:flex;gap:8px;align-items:stretch}.sui .svr .sv{flex:1;min-width:0}
.sui .sdel{flex:none;min-width:96px;border-radius:var(--r);border:2px solid #7a2a26;background:transparent;color:#ff9b94;font-weight:700;font-size:15px;cursor:pointer;padding:0 10px}
.sui .sdel.sure,.sui .sdel2.sure{background:#D7261E;border-color:#D7261E;color:#fff}.sui .sdel2{border-color:#7a2a26;color:#ff9b94}
.sui .sfold{display:block;width:100%;margin-top:26px;min-height:52px;text-align:left;border:0;border-top:1px solid var(--line);background:none;color:var(--ink);font-size:20px;font-weight:800;padding:12px 0 0;cursor:pointer}
.sui .sdone{background:var(--card);border:2px solid var(--line);border-radius:var(--r);padding:12px}
.sui .sdone .sh b{display:block;font-size:17px}.sui .sdone .sh span{display:block;color:var(--mute);font-size:15px}
.sui .sdone .sb{display:flex;gap:8px;margin-top:10px}.sui .sdone .sb .btn{flex:1;min-height:48px;padding:0 8px}
.sui .schip{font-style:normal;font-size:12px;font-weight:800;color:#fff;border-radius:20px;padding:1px 8px;margin-left:4px;white-space:nowrap}
.sui .sprog{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;align-items:center;margin-top:6px;font-size:13px;color:var(--mute)}
.sui .sprog i,.sui .spb i{display:block;height:6px;border-radius:3px;background:#2a2e35;overflow:hidden}.sui .sprog i b,.sui .spb i b{display:block;height:100%;background:#FF7A1A}
.sui .sblk{background:var(--card);border:2px solid var(--line);border-radius:var(--r);padding:12px;margin-top:4px}
.sui .sstep{display:flex;list-style:none;margin:0 0 10px;padding:0;gap:4px}
.sui .sstep li{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;color:var(--mute);text-align:center;line-height:1.15}
.sui .sstep li i{display:block;width:100%;height:6px;border-radius:3px;background:#2a2e35}
.sui .sstep li.nu{color:var(--ink);font-weight:800}
.sui .spb{display:grid;grid-template-columns:84px 1fr auto;gap:10px;align-items:center;width:100%;min-height:48px;margin-top:6px;border:0;background:#0d0f12;border-radius:12px;color:var(--ink);font-size:16px;font-weight:700;padding:0 12px;cursor:pointer;text-align:left}
.sui .spb i{height:10px;border-radius:5px}
.sui .smist{margin:6px 2px 0;font-size:14px;color:#ffb27a}
.sui .sect{display:flex;align-items:center;gap:6px;margin-top:12px}.sui .sect span{font-weight:700;color:var(--mute);margin-right:4px}
.sui .sect button{flex:1;min-height:44px;border-radius:12px;border:2px solid var(--line);background:var(--card);color:var(--ink);font-weight:800;font-size:16px;cursor:pointer}
.sui .sect button.on{background:#FF7A1A;border-color:#FF7A1A;color:#141414}
.stoast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:90;background:#f5f6f7;color:#111;font-weight:700;padding:12px 18px;border-radius:14px;max-width:92vw;box-shadow:0 8px 24px #000a}`;
  let cfg=null,survey=null,urls={},main=null,showDone=false,showArch=false;
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
    const sub=x=>`${esc(fmtD(x.datum))}${x.variant&&x.variant!==cfg.variant?' · gemaakt in '+esc(NAMEN[x.variant]||x.variant):''}`;
    const chip=x=>{const m=Velden.statusMeta(st(x));return `<em class="schip" style="background:${m.kleur}">${esc(m.naam)}</em>`;};
    const prog=x=>{const i=Velden.voortgang(x,fotos[x.id],'in'),o=Velden.voortgang(x,fotos[x.id],'uit');
      return `<span class="sprog"><span>Intake ${i.klaar}/${i.totaal}</span><i><b style="width:${i.pct}%"></b></i><span>Document ${o.klaar}/${o.totaal}</span><i><b style="width:${o.pct}%"></b></i></span>`;};
    const fold=(id,open,label,n)=>`<button class="sfold" id="${id}" aria-expanded="${open}">${open?'▾':'▸'} ${label} (${n})</button>`;
    const kaart=(x,knoppen)=>`<div class="sdone"><div class="sh"><b>${esc(x.adres||'zonder adres')}</b><span>${sub(x)} ${chip(x)}</span></div>${knoppen}</div>`;
    main.innerHTML=`
     ${open.length?`<h2>Doorgaan</h2><div class="surv">${open.map(x=>`<div class="svr"><button class="sv" data-id="${esc(x.id)}"><div><b>${esc(x.adres||'zonder adres')}</b><span>${sub(x)} ${chip(x)}</span>${prog(x)}</div><span class="go" aria-hidden="true">›</span></button><button class="sdel" data-del="${esc(x.id)}" aria-label="Schouw ${esc(x.adres||'')} verwijderen">Verwijderen</button></div>`).join('')}</div>`:''}
     <h2>Nieuwe schouw</h2>
     <label for="adr">Adres</label>
     <input class="f" id="adr" autocomplete="street-address" placeholder="Straat en huisnummer, plaats">
     ${lastOpen&&lastOpen.adres?`<div class="row"><button class="btn" id="take">Adres overnemen: ${esc(lastOpen.adres)}</button></div>`:''}
     <div class="row"><button class="btn pri big" id="go">Start schouw</button></div>
     ${done.length?fold('fold',showDone,'Klaar',done.length)+(showDone?`<div class="surv">${done.map(x=>kaart(x,`
         <div class="sb"><a class="btn pri" href="shared/document.html?survey=${encodeURIComponent(x.id)}">Document</a><button class="btn" data-share="${esc(x.id)}">Delen (PDF)</button></div>
         <div class="sb"><button class="btn" data-open="${esc(x.id)}">Openen</button><button class="btn" data-arch="${esc(x.id)}">Archiveren</button></div>`)).join('')}</div>`:''):''}
     ${arch.length?fold('foldA',showArch,'Archief',arch.length)+(showArch?`<div class="surv">${arch.map(x=>kaart(x,`
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
    if($('take'))$('take').onclick=()=>{$('adr').value=lastOpen.adres;};
    $('go').onclick=async()=>{const a=$('adr').value.trim();if(!a){toast('Vul eerst het adres in');$('adr').focus();return;}
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
     <div class="row"><button class="btn" id="other">Andere schouw</button></div>`;
    statusBlock($('stblk'),s);
    main.querySelectorAll('[data-sect]').forEach(b=>b.onclick=async()=>{s.sectie=b.dataset.sect;await Store.surveys.put(s);main.querySelectorAll('[data-sect]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});toast("Nieuwe foto's: "+(s.sectie==='binnen'?'binnen':'buiten'));});
    main.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>acts[+b.dataset.a].fn(survey));
    main.querySelectorAll('.th').forEach(b=>Editor.stripBind(b,b.dataset.id,id=>cfg.openFoto(survey,id),()=>ph.find(p=>p.id===b.dataset.id),async p=>{
      await Store.photos.put(p);toast(p.status==='vervallen'?'Foto vervalt: telt niet mee en komt niet in het document':'Foto teruggezet');show(survey);}));
    if($('tm'))$('tm').onchange=async()=>{const v=parseFloat($('tm').value.replace(',','.'));survey.tellers={...survey.tellers,meters:isFinite(v)?v:0};await Store.surveys.put(survey);toast('Opgeslagen');};
    const step=async d=>{const n=Math.max(0,(survey.tellers.boringen||0)+d);survey.tellers={...survey.tellers,boringen:n};$('tb').textContent=n;await Store.surveys.put(survey);};
    $('bm').onclick=()=>step(-1);$('bp').onclick=()=>step(1);
    $('other').onclick=()=>{history.replaceState(null,'',location.pathname);start();};
  }
  window.SurveyUI={init,statusBlock,binnenAan,show:s=>show(s||survey),start:()=>{history.replaceState(null,'',location.pathname);return start();},recount,toast,current:()=>survey};
})();
