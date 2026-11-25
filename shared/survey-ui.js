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
.sui h2{font-size:22px;font-weight:800;margin:24px 0 10px}
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
.sui .snp .styp{display:block;font-weight:700;margin:0 0 8px}
.sui .snp .tseg{margin-bottom:16px}
.sui .snp .tseg{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sui .snp .tseg button{min-height:60px;border-radius:16px;border:1px solid var(--line2);background:transparent;color:var(--ink);font-size:17px;font-weight:800;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.sui .snp .tseg button small{font-size:13px;font-weight:600;color:var(--mute)}
.sui .snp .tseg button.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc)}.sui .snp .tseg button.on small{color:var(--on-acc)}
.sui .snp .take{display:block;width:100%;margin-top:10px;text-align:left;font-weight:600;min-height:48px;border-radius:14px;padding:12px 16px;line-height:1.3}
.sui .snp .take span{color:var(--mute);font-weight:400;margin-right:4px}
.sui .surv{display:flex;flex-direction:column;gap:12px;margin-top:14px}
.sui .sv{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px 8px;width:100%;padding:16px;border-radius:var(--r);background:var(--card);border:1px solid var(--line);color:var(--ink);text-align:left;cursor:pointer;font:inherit}
.sui .sv:active{background:var(--card2)}
.sui .sv b{display:block;font-size:20px;font-weight:600;line-height:1.15}
.sui .sst{display:flex;align-items:center;gap:7px;color:var(--mute);font-size:15px;margin-top:4px}
.sui .dot{flex:none;display:inline-block;width:10px;height:10px;border-radius:5px}
.sui .sv .go{align-self:start;margin-top:3px;color:var(--mute)}
.sui .sdoc{display:block;color:var(--mute);font-size:15px;margin-top:4px}
.sui .sst .wrn{color:var(--warn);font-weight:700}
.sui .slink{display:flex;justify-content:center;align-items:center;min-height:44px;margin:18px auto 0;color:var(--mute);font-weight:600;font-size:15px;text-decoration:none}
.sui .sleeg{color:var(--mute);margin:14px 2px 0}
/* schouwoverzicht (Glasvezel) */
.sui .fhead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:24px 0 10px}.sui .fhead h2{margin:0}.sui .fhead span{color:var(--mute);font-size:14px}
.sui .strip{display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px}
.sui .th{position:relative;flex:none;width:104px;height:78px;border-radius:var(--r-thumb);overflow:hidden;border:0;background:var(--card);padding:0;cursor:pointer}
.sui .th img{width:100%;height:100%;object-fit:cover;display:block}
.sui .th.vv{outline:1px dashed var(--line2);outline-offset:-1px}.sui .th.vv img{filter:grayscale(1) brightness(.4)}
.sui .th span{position:absolute;left:6px;bottom:6px;height:22px;min-width:22px;border-radius:11px;background:var(--overlay);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0 7px;white-space:nowrap}
.sui .tel{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.sui .tel .r{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);min-height:68px}.sui .tel .r:last-child{border-bottom:0}
.sui .tel .r .l{flex:1;font-weight:600}.sui .tel .r .l small{display:block;color:var(--mute);font-size:14px;font-weight:400}
.sui .tel input{width:92px;min-height:46px;border-radius:14px;border:1px solid var(--line2);background:var(--well);text-align:right;padding:0 12px;font-size:18px;font-weight:800}
.sui .tel .v{min-width:40px;text-align:center;font-size:22px;font-weight:800;white-space:nowrap}
.sui .step{flex:none;width:44px;height:44px;border-radius:22px;border:1px solid var(--line2);background:var(--well);font-size:22px;font-weight:800;cursor:pointer;padding:0}
.sui .step:active{background:var(--card2)}
.sui .sacts{display:flex;gap:8px;margin-top:14px}.sui .sacts .btn.pri{flex:1;min-height:60px;font-size:19px}
.sui .sacts .rnd{flex:none;width:60px;min-height:60px;padding:0;border-radius:30px;background:var(--card);border-color:var(--line)}
.sui .sfoot{display:flex;flex-direction:column;gap:8px;margin-top:22px}.sui .sfoot .btn{width:100%}
.sui button.slink{border:0;background:none;cursor:pointer;margin:0 auto}
.sui .sdel2,.sui .sdelx{border-color:var(--red)}
.sui .sdel2.sure,.sui .sdelx.sure{background:var(--red);border-color:var(--red);color:#fff}
.sui .sfold{display:flex;align-items:center;gap:10px;width:100%;min-height:56px;margin-top:14px;border:1px solid var(--line);border-radius:var(--r-pill);background:transparent;color:var(--ink);font-size:16px;font-weight:600;padding:0 18px;cursor:pointer;text-align:left}
.sui .sfold .n{flex:1;min-width:0;color:var(--mute);font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sui .sfold svg{flex:none;transition:transform .15s}.sui .sfold[aria-expanded="true"] svg{transform:rotate(90deg)}
.sui .sfold+.surv{margin-top:10px}
.sui .sdone{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:14px}
.sui .sdone .sh b{display:block;font-size:18px;font-weight:600;line-height:1.2}
.sui .sdone .sb{display:flex;gap:8px;margin-top:10px}.sui .sdone .sb .btn{flex:1;min-height:48px;padding:0 8px}
@media (prefers-reduced-motion:reduce){.sui .sfold svg{transition:none}}
.sui .shd{margin-top:2px;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation;cursor:default}
.sui .sht{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.sui .sht b{flex:1;min-width:0;font-size:17px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sui .sht span{flex:none;color:var(--mute);font-size:14px}
.sui .sstep{display:flex;list-style:none;margin:8px 0 0;padding:0;gap:4px}
.sui .sstep li{flex:1 1 auto;display:flex;flex-direction:column;gap:5px;font-size:13px;color:var(--mute);line-height:1.15;min-width:0}
.sui .sstep li span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sui .sstep li i{display:block;width:100%;height:4px;border-radius:2px;background:var(--track)}
.sui .sstep li.nu{color:var(--ink);font-weight:800}
.sui .snext{display:flex;align-items:center;gap:12px;margin-top:12px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:12px 12px 12px 16px}
.sui .snext.wrn{border-color:var(--warn)}
.sui .snext .t{flex:1;min-width:0}.sui .snext .t b{display:block;font-size:17px;font-weight:800;line-height:1.2}
.sui .snext.wrn .t b{color:var(--warn)}
.sui .snext .t small{display:block;color:var(--mute);font-size:14px;margin-top:3px;line-height:1.3}
.sui .snext .btn{flex:none;min-height:48px;padding:0 16px;font-size:15px}
.sstat{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.sui .stodo{margin-top:4px}
.sui .sect{display:flex;align-items:center;gap:10px;margin-top:16px}.sui .sect>span{color:var(--mute);font-size:15px;white-space:nowrap}
.sui .sect .seg{flex:1;display:flex;background:var(--card);border:1px solid var(--line);border-radius:var(--r-pill);padding:3px}
.sui .sect button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;border:0;border-radius:var(--r-pill);background:transparent;color:var(--ink);font-weight:600;font-size:15px;cursor:pointer}
.sui .sect button.on{background:var(--acc);color:var(--on-acc);font-weight:800}
.sconf{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.sconfb{width:100%;max-width:560px;max-height:85vh;overflow-y:auto;background:var(--card);border:1px solid var(--line);border-radius:var(--r) var(--r) 0 0;padding:18px calc(16px + env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left));display:flex;flex-direction:column;gap:10px}
.sconfb h3{margin:0;font-size:21px}.sconfb p{margin:0;color:var(--mute)}
.sconfb li small{color:var(--mute)}
.sconfb ul{margin:0 0 6px;padding-left:20px;color:var(--warn);font-size:16px;line-height:1.5}
.sconfb .btn{width:100%}
.sconfb .sdanger{border-color:var(--warn);color:var(--warn)}.sconfb .sdanger.sure{background:var(--warn);color:var(--on-acc)}
.stoast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:90;background:var(--ink);color:#111;font-weight:700;padding:12px 18px;border-radius:14px;max-width:92vw;box-shadow:0 8px 24px #000a}`;
  let cfg=null,survey=null,urls={},main=null,showDone=false,showArch=false,newOpen=false;
  /* "vandaag", "gisteren", "24 nov" of "24 nov 2025" */
  function relD(d){if(!d)return'';const t=new Date(d),n=new Date();if(isNaN(t))return'';
    const dag=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),v=Math.round((dag(n)-dag(t))/864e5);
    if(v===0)return'vandaag';if(v===1)return'gisteren';
    return t.toLocaleDateString('nl-NL',t.getFullYear()===n.getFullYear()?{day:'numeric',month:'short'}:{day:'numeric',month:'short',year:'numeric'});}
  const ICO={
    plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>',
    pijl:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    camera:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.6"/></svg>',
    galerij:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.6"/></svg>'
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
    const arch=all.filter(x=>Velden.gearchiveerd(x)),rest=all.filter(x=>!Velden.gearchiveerd(x));
    const open=rest.filter(x=>st(x)!=='klaar'),done=rest.filter(x=>st(x)==='klaar'),lastOpen=open[0];
    title(cfg.startTitel||cfg.naam);survey=null;if(cfg.onScreen)cfg.onScreen('start');
    const fotos={};for(const x of all)fotos[x.id]=await Store.photos.bySurvey(x.id,true);
    if(!all.length)newOpen=true;
    // statusregel: gekleurd bolletje + "Uitwerking · vandaag" (+ "gemaakt in …" als het uit een andere variant komt);
    // klaar met open velden: "Klaar · 3 open" in waarschuwingskleur
    const sst=x=>{const m=Velden.statusMeta(st(x)),vo=Velden.voortgang(x,fotos[x.id],'uit'),onv=m.id==='klaar'&&x.onvolledig&&vo.mist.length;
      return `<span class="sst"><i class="dot" style="background:${m.kleur}"></i><span>${onv?`<span class="wrn">Klaar · ${vo.mist.length} open</span>`:esc(m.naam)} · ${esc(relD(x.datum))}${x.variant&&x.variant!==cfg.variant?' · gemaakt in '+esc(NAMEN[x.variant]||x.variant):''}</span></span>`;};
    const docr=x=>{const v=Velden.voortgang(x,fotos[x.id],'uit');return `<span class="sdoc">Document ${v.klaar}/${v.totaal}</span>`;};
    const fold=(id,open,label,lijst,kleur)=>`<button class="sfold" id="${id}" aria-expanded="${open}"><i class="dot" style="background:${kleur}"></i>${label}<span class="n">· ${lijst.length===1?esc(lijst[0].adres||'zonder adres'):lijst.length+' schouwen'}</span>${ICO.pijl}</button>`;
    const kaart=(x,knoppen)=>`<div class="sdone"><div class="sh"><b>${esc(x.adres||'zonder adres')}</b>${sst(x)}</div>${knoppen}</div>`;
    main.innerHTML=`
     <div class="shead"><h2>Schouwen</h2>${open.length?`<span>${open.length} bezig</span>`:''}</div>
     <button class="btn pri snew" id="new" aria-expanded="${newOpen}" aria-controls="snp"${newOpen?' hidden':''}>${ICO.plus}Nieuwe schouw</button>
     <div class="snp" id="snp"${newOpen?'':' hidden'}>
       ${cfg.typeKiezen?`<span class="styp" id="stypL">Type aansluiting</span><div class="tseg" role="group" aria-labelledby="stypL"><button data-typ="OFFNET" aria-pressed="false">OFFNET<small>buiten en binnen</small></button><button data-typ="ONNET" aria-pressed="false">ONNET<small>alleen binnen</small></button></div>`:''}
       <label for="adr">Adres van de nieuwe schouw</label>
       <input class="f" id="adr" autocomplete="street-address" placeholder="Straat en huisnummer, plaats">
       ${lastOpen&&lastOpen.adres?`<button class="btn take" id="take"><span>Adres overnemen:</span>${esc(lastOpen.adres)}</button>`:''}
       <div class="row">${all.length?'<button class="btn" id="cancel">Annuleren</button>':''}<button class="btn pri" id="go" style="flex:1.4">Start schouw</button></div>
     </div>
     ${open.length?`<div class="surv">${open.map(x=>`<button class="sv" data-id="${esc(x.id)}"><span><b>${esc(x.adres||'zonder adres')}</b>${sst(x)}${docr(x)}</span><span class="go">${ICO.pijl}</span></button>`).join('')}</div>`
       :(all.length?'<p class="sleeg">Niets bezig. Tik op Nieuwe schouw om te beginnen.</p>':'')}
     ${done.length?fold('fold',showDone,'Klaar',done,'var(--st-klaar)')+(showDone?`<div class="surv">${done.map(x=>kaart(x,`
         <div class="sb"><a class="btn pri" href="shared/document.html?survey=${encodeURIComponent(x.id)}">Document</a><button class="btn" data-share="${esc(x.id)}">Delen (PDF)</button></div>
         <div class="sb"><button class="btn" data-open="${esc(x.id)}">Openen</button><button class="btn" data-arch="${esc(x.id)}">Archiveren</button></div>`)).join('')}</div>`:''):''}
     ${arch.length?fold('foldA',showArch,`Gearchiveerd (${arch.length})`,arch,'var(--st-archief)')+(showArch?`<div class="surv">${arch.map(x=>kaart(x,`
         <div class="sb"><a class="btn" href="shared/document.html?survey=${encodeURIComponent(x.id)}">Document</a><button class="btn" data-share="${esc(x.id)}">Delen (PDF)</button></div>
         <div class="sb"><button class="btn" data-unarch="${esc(x.id)}">Terugzetten</button><button class="btn sdel2" data-del="${esc(x.id)}">Verwijderen</button></div>`)).join('')}</div>`:''):''}
     ${cfg.startExtra||''}`;
    main.querySelectorAll('.sv,[data-open]').forEach(b=>b.onclick=async()=>show(await Store.surveys.get(b.dataset.id||b.dataset.open)));
    main.querySelectorAll('[data-del]').forEach(b=>{let t=null;const lab=b.textContent;b.onclick=async()=>{
      if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent='Zeker? Tik nog eens';t=setTimeout(()=>{b.classList.remove('sure');b.textContent=lab;},3000);return;}
      clearTimeout(t);await Store.surveys.del(b.dataset.del);toast('Schouw verwijderd');start();};});
    main.querySelectorAll('[data-arch]').forEach(b=>b.onclick=async()=>{const x=await Store.surveys.get(b.dataset.arch);x.gearchiveerd=true;x.status=Velden.statusOf(x);await Store.surveys.put(x);toast('Gearchiveerd');start();});
    main.querySelectorAll('[data-unarch]').forEach(b=>b.onclick=async()=>{const x=await Store.surveys.get(b.dataset.unarch);x.gearchiveerd=false;x.status=Velden.statusOf(x);await Store.surveys.put(x);toast('Terug bij Klaar');start();});
    main.querySelectorAll('[data-share]').forEach(b=>{if(window.PdfDoc)PdfDoc.bindShare(b,b.dataset.share,toast);else b.hidden=true;});
    if($('fold'))$('fold').onclick=()=>{showDone=!showDone;start();};
    if($('foldA'))$('foldA').onclick=()=>{showArch=!showArch;start();};
    // Nieuwe schouw: de knop klapt het adresblok open (geen los blad onderin: op de iPhone schuift het toetsenbord daar overheen)
    $('new').onclick=()=>{newOpen=true;$('new').hidden=true;$('new').setAttribute('aria-expanded','true');$('snp').hidden=false;(main.querySelector('[data-typ]')||$('adr')).focus();};
    if($('cancel'))$('cancel').onclick=()=>{newOpen=false;$('adr').value='';$('snp').hidden=true;$('new').hidden=false;$('new').setAttribute('aria-expanded','false');$('new').focus();};
    $('adr').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('go').click();}};
    if($('take'))$('take').onclick=()=>{$('adr').value=lastOpen.adres;};
    let typ=null;main.querySelectorAll('[data-typ]').forEach(b=>b.onclick=()=>{typ=b.dataset.typ;main.querySelectorAll('[data-typ]').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on);});});
    $('go').onclick=async()=>{const a=$('adr').value.trim();if(!a){toast('Vul eerst het adres in');$('adr').focus();return;}
      if(cfg.typeKiezen&&!typ){toast('Kies eerst OFFNET of ONNET');main.querySelector('[data-typ]').focus();return;}
      newOpen=false;
      const x=await Store.surveys.put({adres:a,variant:cfg.variant,status:'uitwerking',...(typ?{velden:{type_aansluiting:typ},sectie:typ==='ONNET'?'binnen':'buiten'}:{})});await show(x);
      // eerst wat je vooraf moet weten (alleen als daar iets verplicht is)
      const i=Velden.voortgang(x,[],'in');if(i.mist.length)Gegevens.open(x,{filter:'todo',moment:'vooraf',onClose:()=>show(x)});};
  }

  /* oude status omzetten (alleen samen met een andere wijziging opslaan) */
  function norm(s){let ch=false;if(s.status==='archief'&&s.gearchiveerd==null){s.gearchiveerd=true;ch=true;}
    const n=Velden.statusOf(s);if(s.status!==n){s.status=n;ch=true;}return ch;}
  /* bij de eerste foto: datum onthouden (datum van de schouw); aantal foto's bijhouden */
  function naFoto(s,n){let ch=false;
    if(n>0&&!s.eersteFoto){s.eersteFoto=new Date().toISOString();ch=true;}
    if(n!==s.nFoto){s.nFoto=n;ch=true;}
    if(ch)norm(s);return ch;}

  /* blad "Status terugzetten naar …" (lang drukken op de statusbalk); bevestigen door twee keer te tikken */
  function terugBlad(s,klaar){
    const cur=Velden.statusOf(s),idx=Velden.STATUS.findIndex(x=>x.id===cur),eerder=Velden.STATUS.slice(0,idx).reverse();
    const d=document.createElement('div');d.className='sconf';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','scT');
    d.innerHTML=`<div class="sconfb"><h3 id="scT">Status terugzetten naar …</h3>
      ${eerder.length?`<p>Nu: ${esc(Velden.statusMeta(cur).naam)}. Tik twee keer om terug te zetten.</p>${eerder.map(x=>`<button class="btn sdanger" data-to="${x.id}">${esc(x.naam)}</button>`).join('')}`:'<p>Dit is de eerste stap. Hier kun je niet verder terug.</p>'}
      <button class="btn" data-x>Annuleren</button></div>`;
    document.body.appendChild(d);(d.querySelector('[data-to]')||d.querySelector('[data-x]')).focus();
    const weg=()=>d.remove();
    d.querySelector('[data-x]').onclick=weg;d.addEventListener('click',e=>{if(e.target===d)weg();});
    d.querySelectorAll('[data-to]').forEach(b=>{const lab=b.textContent;b.onclick=async()=>{
      if(!b.classList.contains('sure')){d.querySelectorAll('.sure').forEach(x=>{x.classList.remove('sure');x.textContent=x.dataset.lab;});b.dataset.lab=lab;b.classList.add('sure');b.textContent=`Zeker? Tik nog eens (${lab})`;return;}
      const ph=await Store.photos.bySurvey(s.id);norm(s);s.status=b.dataset.to;s.nFoto=ph.length;delete s.onvolledig;
      await Store.surveys.put(s);weg();toast('Status: '+lab);klaar();};});
  }
  /* lang drukken (ca. 0,6 s) */
  function langDruk(el,fn){let t=null,x0=0,y0=0,klaar=0;const stop=()=>{clearTimeout(t);t=null;};
    const vuur=()=>{stop();if(Date.now()-klaar<1000)return;klaar=Date.now();if(navigator.vibrate)try{navigator.vibrate(15);}catch(_){}fn();};
    el.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;stop();t=setTimeout(vuur,600);});
    el.addEventListener('pointermove',e=>{if(t&&Math.hypot(e.clientX-x0,e.clientY-y0)>10)stop();});
    ['pointerup','pointercancel','pointerleave'].forEach(k=>el.addEventListener(k,stop));
    // Android/Chrome: lang drukken geeft een contextmenu-event (en breekt de pointer af)
    el.addEventListener('contextmenu',e=>{e.preventDefault();vuur();});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}});}

  /* ---------- status en "volgende stap" van één schouw ---------- */
  async function statusBlock(el,s,na){
    let ch=Velden.migreer(s);
    const ph=await Store.photos.bySurvey(s.id,true),ok=ph.filter(p=>p.status!=='vervallen');
    if(naFoto(s,ok.length))ch=true;
    if(ch){norm(s);await Store.surveys.put(s);}
    const cur=Velden.statusOf(s),idx=Velden.STATUS.findIndex(x=>x.id===cur);
    const reopen=()=>{if(na)na();else show(s);};
    // fase Uitwerking en Afronding: nog te doen, informatie en foto's apart
    let kaart='';
    if(cur==='klaar'){const vo=Velden.voortgang(s,ph,'uit');
      if(vo.mist.length)kaart=`<div class="snext wrn"><div class="t"><b>Klaar · ${vo.mist.length} open</b><small>Document ${vo.klaar} van ${vo.totaal} compleet</small></div><a class="btn" href="shared/storyline.html?survey=${encodeURIComponent(s.id)}">Aanvullen</a></div>`;}
    else{kaart=`<div class="stodo">${Gegevens.todoHtml(s,ph,cur==='afronding'?'uit':undefined)}</div>`;
      if(cur==='afronding'){const vo=Velden.voortgang(s,ph,'uit');kaart+=`<div class="snext"><div class="t"><b>Document ${vo.klaar} van ${vo.totaal} compleet</b></div><a class="btn pri" href="shared/storyline.html?survey=${encodeURIComponent(s.id)}">Naar controle &amp; aanvullen</a></div>`;}}
    el.innerHTML=`<div class="sstat"><div class="shd" id="sbH" tabindex="0" role="group" aria-label="Status ${esc(Velden.statusMeta(cur).naam)}, stap ${idx+1} van ${Velden.STATUS.length}. Lang drukken om de status terug te zetten.">
      <div class="sht"><b>${esc(s.adres||'Schouw')}</b><span>stap ${idx+1} van ${Velden.STATUS.length}</span></div>
      <ol class="sstep" aria-hidden="true">${Velden.STATUS.map((x,i)=>`<li class="${i===idx?'nu':''}"><i style="${i<=idx?'background:'+x.kleur:''}"></i><span>${esc(x.naam)}</span></li>`).join('')}</ol></div>${kaart}</div>`;
    if(!el.isConnected)return;langDruk(el.querySelector('#sbH'),()=>terugBlad(s,reopen));
    const td=el.querySelector('.stodo');if(td)Gegevens.todoBind(td,s,reopen,{kant:cur==='afronding'?'uit':undefined,camera:()=>{const a=(cfg.acties(s,0)||[]).find(x=>x.pri);if(a)a.fn(s);else document.querySelector('.sacts .btn.pri')?.click();}});
  }
  /* knop "Schouw verwijderen" (verhuisd van het startscherm naar de schouw): twee keer tikken */
  function bindDel(btn,s,voor){if(!btn)return;let t=null;const lab=btn.textContent;btn.onclick=async()=>{
    if(!btn.classList.contains('sure')){btn.classList.add('sure');btn.textContent='Zeker? Tik nog eens';t=setTimeout(()=>{btn.classList.remove('sure');btn.textContent=lab;},3000);return;}
    clearTimeout(t);if(voor)voor();await Store.surveys.del(s.id);toast('Schouw verwijderd');survey=null;history.replaceState(null,'',location.pathname);start();};}
  async function recount(){
    if(!survey)return;const ph=await Store.photos.bySurvey(survey.id),t=cfg.tellen(survey,ph)||{};
    const T={meters:0,invoeringen:0,boringen:0,...survey.tellers,...t};let ch=false;
    if(JSON.stringify(T)!==JSON.stringify(survey.tellers)){survey.tellers=T;ch=true;}
    if(naFoto(survey,ph.filter(p=>p.status!=='vervallen').length))ch=true;
    if(ch)await Store.surveys.put(survey);
    {const b=$('stblk');if(b&&b.firstChild&&!cfg.eigenScherm)statusBlock(b,survey);} // nog te doen bijwerken
    const i=$('ti');if(i)i.textContent=T.invoeringen||0;const m=$('tmv');if(m)m.textContent=nl1(T.meters||0)+' m';
    return T;
  }
  async function show(s){
    survey=s;history.replaceState(null,'','?survey='+encodeURIComponent(s.id));title(s.adres||cfg.naam);
    // een schouw uit een andere variant gaat vanaf nu verder in deze variant (terugknoppen en 'Doorgaan met' volgen dat)
    if(s.variant!==cfg.variant){const was=NAMEN[s.variant]||s.variant;s.variant=cfg.variant;await Store.surveys.put(s);if(was)toast(`Deze schouw gaat nu verder in ${cfg.naam} (was ${was})`);}
    // in de hoofdapp (Veeg & Klik) alleen het adres; in de andere varianten met de naam erachter
    title(cfg.variant==='veeg'?(s.adres||cfg.naam):(s.adres||cfg.naam)+' · '+cfg.naam);if(cfg.onScreen)cfg.onScreen('survey');
    if(cfg.eigenScherm)return cfg.eigenScherm(s); // variant met een eigen schouwscherm (Loop-spoor)
    const ph=await Store.photos.bySurvey(s.id,true),ok=ph.filter(p=>p.status!=='vervallen');
    Object.values(urls).forEach(u=>URL.revokeObjectURL(u));urls={};ph.forEach(p=>urls[p.id]=URL.createObjectURL(p.blob));
    let wijz=Velden.migreer(s);const naarBinnen=Velden.onnetFix(s,ph);if(naarBinnen.length||(Velden.onnet(s)&&s.sectie==='binnen'))wijz=true;
    for(const p of naarBinnen)await Store.photos.put(p);
    if(wijz)await Store.surveys.put(s);
    const on=Velden.onnet(s);
    const T=await recount(),acts=cfg.acties(s,ok.length);
    const seg=binnenAan()&&!on?`<div class="sect" role="group" aria-label="Foto's voor"><span>Foto's voor</span><div class="seg">${['buiten','binnen'].map(x=>`<button data-sect="${x}" class="${(s.sectie||'buiten')===x?'on':''}" aria-pressed="${(s.sectie||'buiten')===x}"><i class="dot" style="background:var(--sec-${x})"></i>${x==='buiten'?'Buiten':'Binnen'}</button>`).join('')}</div></div>`:'';
    main.innerHTML=`
     <div id="stblk"></div>
     ${(()=>{ // hoofdactie als grote pil met camera, "uit galerij" als ronde knop ernaast, de rest eronder
        const isGal=a=>/galerij/i.test(a.label),boven=acts.map((a,i)=>({a,i})).filter(x=>x.a.pri||isGal(x.a)),onder=acts.map((a,i)=>({a,i})).filter(x=>!x.a.pri&&!isGal(x.a));
        return (boven.length?`<div class="sacts">${boven.map(({a,i})=>a.pri?`<button class="btn pri" data-a="${i}">${ICO.camera}${esc(a.label)}</button>`:`<button class="btn rnd" data-a="${i}" aria-label="${esc(a.label)}">${ICO.galerij}</button>`).join('')}</div>`:'')
          +onder.map(({a,i})=>`<div class="row"><button class="btn" data-a="${i}">${esc(a.label)}</button></div>`).join('');})()}
     ${seg}
     <div class="fhead"><h2>Foto's</h2>${ph.length?`<span>${ok.length} van ${ph.length} in document</span>`:''}</div>
     ${ph.length?`<div class="strip">${ph.map((p,i)=>`<button class="th${p.status==='vervallen'?' vv':''}" data-id="${p.id}" aria-label="Foto ${i+1}${p.sectie==='binnen'?', binnen':''}${p.status==='vervallen'?', vervalt':''}"><img src="${urls[p.id]}" alt=""><span>${i+1}${p.sectie==='binnen'?' · binnen':''}${p.status==='vervallen'?' · vervalt':''}</span></button>`).join('')}</div>
     <p class="note">Tik om te bewerken. Lang drukken: vervalt (ander tracé) of terugzetten.</p>`:'<p class="note">Nog geen foto\'s. Begin bij de aansluiting op het netwerk.</p>'}
     <h2>Tellers</h2>
     <div class="tel">
       ${on?'':cfg.metersZelf
         ?`<div class="r"><div class="l"><label for="tm" style="margin:0">Meters buiten tracé</label><small>Zelf invullen: deze variant meet niet.</small></div><input id="tm" inputmode="decimal" value="${esc(T.meters||'')}" placeholder="0"></div>`
         :`<div class="r"><div class="l">Meters buiten tracé<small>${esc(T.metersNote||'')}</small></div><span class="v" id="tmv">${nl1(T.meters||0)} m</span></div>`}
       ${on?'':`<div class="r"><div class="l">Invoeringen<small>${esc(cfg.invoerUitleg||'Telt de app.')}</small></div><span class="v" id="ti">${T.invoeringen||0}</span></div>
       <div class="r"><div class="l">Boringen/persingen</div><button class="step" id="bm" aria-label="Eén minder">−</button><span class="v" id="tb">${T.boringen||0}</span><button class="step" id="bp" aria-label="Eén meer">+</button></div>`}
       ${binnenAan()||on?`<div class="r"><div class="l"><label for="tmb" style="margin:0">Meters binnen tracé</label><small>Zelf invullen.</small></div><input id="tmb" inputmode="decimal" value="${esc(T.metersBinnen!=null?T.metersBinnen:'')}" placeholder="0"></div>`:''}
     </div>
     <div class="sfoot">
       <a class="btn pri" href="shared/storyline.html?survey=${encodeURIComponent(s.id)}">Naar controle &amp; aanvullen</a>
       <button class="slink" id="other">Andere schouw</button>
       <button class="btn sdelx" id="sdel">Schouw verwijderen</button>
     </div>`;
    statusBlock($('stblk'),s);
    bindDel($('sdel'),s);
    main.querySelectorAll('[data-sect]').forEach(b=>b.onclick=async()=>{s.sectie=b.dataset.sect;await Store.surveys.put(s);main.querySelectorAll('[data-sect]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});toast("Nieuwe foto's: "+(s.sectie==='binnen'?'binnen':'buiten'));});
    main.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>acts[+b.dataset.a].fn(survey));
    main.querySelectorAll('.th').forEach(b=>Editor.stripBind(b,b.dataset.id,id=>cfg.openFoto(survey,id),()=>ph.find(p=>p.id===b.dataset.id),async p=>{
      await Store.photos.put(p);toast(p.status==='vervallen'?'Foto vervalt: telt niet mee en komt niet in het document':'Foto teruggezet');show(survey);}));
    if($('tmb'))$('tmb').onchange=async()=>{const v=parseFloat($('tmb').value.replace(',','.'));survey.tellers={...survey.tellers,metersBinnen:isFinite(v)?v:0};await Store.surveys.put(survey);toast('Opgeslagen');statusBlock($('stblk'),survey);};
    if($('tm'))$('tm').onchange=async()=>{const v=parseFloat($('tm').value.replace(',','.'));survey.tellers={...survey.tellers,meters:isFinite(v)?v:0};await Store.surveys.put(survey);toast('Opgeslagen');};
    const step=async d=>{const n=Math.max(0,(survey.tellers.boringen||0)+d);survey.tellers={...survey.tellers,boringen:n};$('tb').textContent=n;await Store.surveys.put(survey);};
    if($('bm')){$('bm').onclick=()=>step(-1);$('bp').onclick=()=>step(1);}
    $('other').onclick=()=>{history.replaceState(null,'',location.pathname);start();};
  }
  if(window.Gegevens)Gegevens.bron=id=>survey&&survey.id===id?survey:null;
  window.SurveyUI={init,naFoto,statusBlock,binnenAan,bindDel,show:s=>show(s||survey),start:()=>{history.replaceState(null,'',location.pathname);return start();},recount,toast,current:()=>survey};
})();
