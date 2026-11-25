/* Het gegevensscherm van een schouw (één scherm voor alles), op basis van de instellingen (shared/velden.js).
   Gegevens.open(survey, {filter:'todo'|'alles', moment:'vooraf'|'terplekke'|'achteraf', sectie:'klant', onClose, onChange})
     niveau 1: lijst met secties ("Nog te doen" of "Alles"), niveau 2: de velden van één sectie.
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
:is(.geg,.gin) .glist{background:var(--card);border:1px solid var(--line);border-radius:var(--r,20px);overflow:hidden}
:is(.geg,.gin) .gsr{display:flex;align-items:center;gap:12px;width:100%;min-height:68px;padding:10px 14px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);text-align:left;cursor:pointer;font:inherit}
:is(.geg,.gin) .gsr:last-child{border-bottom:0}:is(.geg,.gin) .gsr:active{background:var(--card2)}
:is(.geg,.gin) .gsr .ic{flex:none;width:40px;height:40px;border-radius:12px;background:var(--well);display:grid;place-items:center;color:var(--mute)}
:is(.geg,.gin) .gsr .nm{flex:1;min-width:0}:is(.geg,.gin) .gsr .nm b{display:block;font-size:17px;font-weight:700;line-height:1.2}
:is(.geg,.gin) .gsr .nm small{display:block;color:var(--mute);font-size:14px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
:is(.geg,.gin) .gsr .sx{flex:none;font-weight:800;font-size:15px;white-space:nowrap}:is(.geg,.gin) .gsr .ch2{flex:none;color:var(--mute)}
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
:is(.geg,.gin) .vgok{width:100%;min-height:60px;font-size:18px;margin-top:16px}
:is(.geg,.gin) .vgok.af{background:var(--ok,#22C55E);border-color:var(--ok,#22C55E);color:#0b1a10}
.gbl{position:fixed;inset:0;z-index:72;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.gblb{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--card,#1C1F25);color:var(--ink,#F3F4F6);border:1px solid var(--line,#2E323A);border-radius:var(--r,20px) var(--r,20px) 0 0;padding:18px calc(16px + env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left));display:flex;flex-direction:column;gap:10px}
.gblb h3{margin:0;font-size:21px}.gblb p{margin:0;color:var(--mute)}
.gblb .btn{width:100%}
.gblb label{display:block;font-weight:700;margin:4px 0 4px}
.gblb input{display:block;box-sizing:border-box;width:100%;min-width:0;min-height:48px;border-radius:14px;border:1px solid var(--line2);background:var(--well);color:inherit;padding:0 12px;font-size:16px;-webkit-appearance:none;appearance:none}
.gblb img{width:100%;max-height:160px;object-fit:cover;border-radius:var(--r-thumb,14px)}
.gblb .grk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.gblb .grk button{position:relative;padding:0;border:2px solid transparent;border-radius:12px;background:none;cursor:pointer;overflow:hidden;aspect-ratio:4/3}
.gblb .grk button.on{border-color:var(--ok,#22C55E)}
.gblb .grk img{width:100%;height:100%;max-height:none;object-fit:cover;border-radius:10px;display:block}
.gblb .grk span{position:absolute;left:6px;bottom:6px;background:var(--overlay,rgba(0,0,0,.6));color:#fff;font-size:13px;font-weight:800;border-radius:99px;padding:2px 8px}
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
    st={s:survey,opts,root,fotos,urls:[],filter:opts.filter==='alles'?'alles':'todo',moment:opts.moment||null,sec:null,optOpen:false,vgMeer:false};
    root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();terug();}});
    // terug-gebaar/terugknop van de telefoon: stap terug binnen het scherm
    history.pushState({...(history.state||{}),geg:1},'');st.diepte=1;
    if(opts.sectie&&Velden.SECTIES.some(x=>x.id===opts.sectie))openSectie(opts.sectie);else lijst();
  }
  function close(silent){if(!st)return;const me=st;clearTimeout(svT);if(svP)Store.surveys.put(me.s);st.urls.forEach(u=>URL.revokeObjectURL(u));st.root.remove();st=null;if(!silent&&me.opts.onClose)me.opts.onClose();}
  function terug(){if(!st)return;if(st.sec)naarLijst();else sluit();}
  function naarLijst(){if(!st)return;save(true);if(st.diepte===2)history.back();else lijst();}
  function sluit(){if(!st)return;save(true);const d=st.diepte||0;st.diepte=0;close();if(d)history.go(-d);}
  addEventListener('popstate',e=>{if(!st||!st.diepte)return;const g=(e.state&&e.state.geg)||0;
    if(g>=2)return;if(g===1){st.diepte=1;save(true);lijst();return;}
    st.diepte=0;save(true);close();});
  let svT=null,svP=false;
  function save(now){clearTimeout(svT);svP=true;const go=async()=>{svP=false;if(!st)return;const me=st;await Store.surveys.put(me.s);if(me.opts.onChange)me.opts.onChange(me.s);};if(now)return go();svT=setTimeout(go,350);}
  const kant=()=>st.moment==='vooraf'?'in':undefined;
  const secties=()=>Velden.secties(st.s,st.fotos,{moment:st.moment,kant:kant(),zonder:st.opts.zonder});
  const docTxt=()=>{const v=Velden.voortgang(st.s,st.fotos,'uit');return `<div class="gdoc"><span>Document ${v.klaar} van ${v.totaal} compleet</span><i><b style="width:${v.pct}%"></b></i></div>`;};
  function sub(x){const s=st.s;
    if(x.sc.id==='loc'&&Velden.zelfdeAan(s,'loc_zelfde'))return 'Zelfde als klant'+(Velden.waarde(s,'loc_gebouw')?' · '+Velden.waarde(s,'loc_gebouw'):'');
    if(x.sc.id==='aanm'&&Velden.zelfdeAan(s,'aanm_zelfde'))return 'Contact zelfde als klant';
    if(x.sc.id==='eig'&&Velden.waarde(s,'eig_klant_is_eigenaar')==='Ja')return 'Klant is eigenaar';
    return x.sc.sub||'';}

  /* ---------- niveau 1: secties ---------- */
  function lijst(){
    st.sec=null;const R=st.root,L=secties(),n=L.reduce((t,x)=>t+x.open.length,0);
    const toon=st.filter==='todo'?L.filter(x=>x.open.length):L;
    R.innerHTML=`<div class="gh"><button class="back bpill" id="gX">${svg(TERUG,18)}Terug</button><h2>Gegevens</h2></div>
    <div class="gb">
      <div class="gseg" role="group" aria-label="Filter"><button data-f="todo" class="${st.filter==='todo'?'on':''}" aria-pressed="${st.filter==='todo'}">Nog te doen (${n})</button><button data-f="alles" class="${st.filter==='alles'?'on':''}" aria-pressed="${st.filter==='alles'}">Alles</button></div>
      ${st.moment?`<div class="gmom"><span>Alleen wat je ${esc(Velden.MOMENT[st.moment])} invult</span><button id="gAlle">Alle secties</button></div>`:''}
      ${toon.length?`<div class="glist">${toon.map(x=>`<button class="gsr" data-sc="${x.sc.id}"><span class="ic">${svg(x.sc.ic||'')}</span><span class="nm"><b>${esc(x.sc.kort)}</b><small>${esc(sub(x))}</small></span>${x.open.length?`<span class="sx wrn">${x.open.length} open</span>`:'<span class="sx okk" aria-label="compleet">✓</span>'}<span class="ch2">${svg(VERDER,18)}</span></button>`).join('')}</div>`
        :`<div class="gleeg"><p>${st.moment==='vooraf'?'Alles wat je vooraf nodig hebt, is ingevuld.':'Alles wat nodig is, is ingevuld.'}</p><button class="btn" id="gToon">Alles bekijken</button></div>`}
    </div><div class="gf">${docTxt()}</div>`;
    R.querySelector('#gX').onclick=sluit;
    R.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{st.filter=b.dataset.f;lijst();});
    R.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>openSectie(b.dataset.sc));
    const al=R.querySelector('#gAlle');if(al)al.onclick=()=>{st.moment=null;lijst();};
    const tn=R.querySelector('#gToon');if(tn)tn.onclick=()=>{st.filter='alles';lijst();};
    R.querySelector('#gX').focus({preventScroll:true});
  }

  /* ---------- niveau 2: één sectie ---------- */
  function openSectie(id){if(st.diepte===1){history.pushState({...(history.state||{}),geg:2},'');st.diepte=2;}st.sec=id;st.optOpen=false;st.vgMeer=false;sectie();const b=st.root.querySelector('.gb');if(b)b.scrollTop=0;}
  function items(x){ // velden van de sectie, met contactkaarten samengevoegd; verborgen "zelfde als"-velden weg
    const c=Velden.cfg(),s=st.s,gezien={},out=[];
    x.velden.forEach(f=>{if(f.schakel||Velden.verborgen(s,f))return;
      const ct=Velden.CONTACTEN.find(y=>['naam','bedrijf','tel','mail'].some(r=>y[r]===f.k));
      if(ct){if(gezien[ct.id]||(f.k!==ct.naam&&x.velden.some(g=>g.k===ct.naam)))return;gezien[ct.id]=1; // kaart op de plek van de naam
        const leden=['naam','bedrijf','tel','mail'].map(r=>ct[r]&&x.velden.find(g=>g.k===ct[r])).filter(g=>g&&!Velden.verborgen(s,g));
        out.push({ct,leden,req:leden.some(g=>Velden.nodig(c,g,kant()))});return;}
      out.push({f,req:Velden.nodig(c,f,kant())});});
    return out;
  }
  function volgende(){const L=secties(),i=L.findIndex(x=>x.sc.id===st.sec);
    const rest=L.slice(i+1).concat(L.slice(0,Math.max(i,0)));return rest.find(x=>x.open.length&&x.sc.id!==st.sec)||null;}
  function sectie(){
    const R=st.root,x=secties().find(y=>y.sc.id===st.sec);
    if(!x){naarLijst();return;}
    st.urls.forEach(u=>URL.revokeObjectURL(u));st.urls=[];
    const it=items(x),req=it.filter(i=>i.req),opt=it.filter(i=>!i.req),sch=x.velden.filter(f=>f.schakel),nx=volgende();
    const html=i=>i.ct?contact(i):i.f.t==='vg'?vgHtml(i.f):row(i.f);
    R.innerHTML=`<div class="gh"><button class="back bpill" id="gX">${svg(TERUG,18)}Gegevens</button><h2>${esc(x.sc.kort)}</h2><span class="gst"></span></div>
    <div class="gb">
      ${sch.map(f=>{const on=Velden.zelfdeAan(st.s,f.k);return `<div class="fr zw"><span id="l_${f.k}">${esc(f.l)}</span><button class="sw" role="switch" aria-checked="${on}" aria-labelledby="l_${f.k}" data-sw="${f.k}"><i></i></button></div>`;}).join('')}
      ${req.map(html).join('')}
      ${opt.length?`<button class="gopt" id="gOpt" aria-expanded="${st.optOpen}"><span>Optioneel (${opt.length})</span>${svg(VERDER,18)}</button><div id="gOptL"${st.optOpen?'':' hidden'}>${opt.map(html).join('')}</div>`:''}
      ${!req.length&&!opt.length?'<p class="info">Hier hoef je nu niets in te vullen.</p>':''}
    </div><div class="gf"><button class="btn pri" id="gNx">${nx?'Volgende sectie: '+esc(nx.sc.kort):'Terug naar gegevens'}</button></div>`;
    R.querySelector('#gX').onclick=naarLijst;
    R.querySelector('#gNx').onclick=()=>{save(true);const n=volgende();if(n)openSectie(n.sc.id);else naarLijst();};
    const go=R.querySelector('#gOpt');if(go)go.onclick=()=>{st.optOpen=!st.optOpen;go.setAttribute('aria-expanded',st.optOpen);R.querySelector('#gOptL').hidden=!st.optOpen;};
    bind();upd();
  }
  function invoer(f,id){
    const v=Velden.waarde(st.s,f.k);
    switch(f.t){
      case 'lang':return `<textarea id="${id}" data-k="${f.k}" placeholder="${esc(f.vb?'bijv. '+f.vb:'')}">${esc(v||'')}</textarea>`;
      case 'keuze':return `<div class="ch" role="group">${f.opties.map(o=>`<button data-k="${f.k}" data-v="${esc(o)}" class="${v===o?'on':''}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div>`;
      case 'janee':return `<div class="ch" role="group">${['Ja','Nee'].map(o=>`<button data-k="${f.k}" data-v="${o}" class="${v===o?'on':''}" aria-pressed="${v===o}">${o}</button>`).join('')}</div>`;
      case 'foto':{const b=(st.s.bijlagen||{})[f.k];let u='';if(b){u=URL.createObjectURL(b);st.urls.push(u);}
        return `<div class="ft">${b?`<img src="${u}" alt="${esc(f.l)}">`:''}${v==='nvt'?`<b>${esc(f.nvt||'Niet beschikbaar')}</b>`:''}
          <button class="btn" data-foto="${f.k}" data-g="0">Foto maken</button><button class="btn" data-foto="${f.k}" data-g="1">Uit galerij</button>
          ${f.nvt?`<button class="btn" data-nvt="${f.k}">${v==='nvt'?'Toch beschikbaar':'Niet beschikbaar'}</button>`:''}${b?`<button class="btn" data-weg="${f.k}">Weghalen</button>`:''}</div>`;}
      default:{
        if(f.stap)return `<div class="stp"><button data-stp="${f.k}" data-d="-1" aria-label="Eén minder">−</button><input id="${id}" data-k="${f.k}" data-num="1" inputmode="numeric" value="${esc(v==null?'':v)}" placeholder="0"><button data-stp="${f.k}" data-d="1" aria-label="Eén meer">+</button></div>`;
        const ty={datum:'date',tel:'tel',mail:'email',getal:'number'}[f.t]||'text';
        return `<input id="${id}" type="${ty}" data-k="${f.k}" value="${esc(v==null?'':v)}" placeholder="${esc(f.vb?'bijv. '+f.vb:'')}"${f.t==='getal'?' inputmode="numeric"':''}${f.t==='mail'?' autocomplete="email"':''}${f.t==='tel'?' autocomplete="tel"':''}>`;}
    }
  }
  function row(f){const id='g_'+f.k;
    return `<div class="fr" data-r="${f.k}"><label class="fl" for="${id}"><span>${esc(f.kort||f.l)}</span><i class="vink" role="img" aria-label="ingevuld" hidden>✓</i></label>${invoer(f,id)}</div>`;}
  const ROL={naam:'Naam',bedrijf:'Bedrijf',tel:'Telefoon',mail:'E-mail'};
  const kanKiezen=()=>'contacts' in navigator&&navigator.contacts&&'select' in navigator.contacts;
  function contact(i){
    const ct=i.ct,rol=k=>Object.keys(ROL).find(r=>ct[r]===k);
    return `<div class="fr ccard" data-c="${ct.id}"><div class="fl"><span>${esc(ct.titel)}</span><i class="vink" role="img" aria-label="ingevuld" hidden>✓</i></div>
      ${i.leden.map(f=>`<div class="cr"><label for="g_${f.k}">${esc(f.k==='klant_org'?'Organisatie':f.k==='eig_contact'?'Naam (akkoord aanleg)':ROL[rol(f.k)])}</label>${invoer(f,'g_'+f.k)}</div>`).join('')}
      ${kanKiezen()?`<button class="btn kies" data-kies="${ct.id}">Kies uit contacten</button>`:''}</div>`;}
  function vg(){const v=Velden.waarde(st.s,'vg');return v&&typeof v==='object'?{items:{},...v}:{items:{}};}
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
    return `<div data-r="vg"><p class="info" style="margin:0 2px 10px">Tik op wat hier speelt. Risico en afspraak zijn al ingevuld; pas ze aan als het nodig is.</p>
      <div class="vgt">${tegels}</div>
      <button class="gopt" id="vgMeer" aria-expanded="${st.vgMeer}"><span>Meer situaties (${rest.length})${nAan?' · '+nAan+' gekozen':''}</span>${svg(VERDER,18)}</button>
      <div id="vgMeerL"${st.vgMeer?'':' hidden'}>${meer}</div>
      <button class="btn vgok${v.nagelopen?' af':' pri'}" id="vgOk" aria-pressed="${!!v.nagelopen}">${v.nagelopen?'✓ V&amp;G nagelopen':'V&amp;G nagelopen'}</button></div>`;}

  /* vinkjes, gele randen en tellers bijwerken zonder opnieuw te tekenen */
  function upd(){if(!st||!st.sec)return;const R=st.root,s=st.s,c=Velden.cfg(),K=kant();
    const F=k=>Velden.VELDEN.find(x=>x.k===k);
    R.querySelectorAll('[data-r]').forEach(el=>{const f=F(el.dataset.r);if(!f)return;const vol=Velden.gevuld(s,f,st.fotos);
      el.classList.toggle('mist',!vol&&Velden.nodig(c,f,K)&&f.t!=='vg');const v=el.querySelector('.vink');if(v)v.hidden=!vol;});
    R.querySelectorAll('.ccard').forEach(el=>{const ct=Velden.CONTACTEN.find(y=>y.id===el.dataset.c);let alles=true,iets=false;
      el.querySelectorAll('[data-k]').forEach(i=>{const f=F(i.dataset.k),vol=Velden.gevuld(s,f,st.fotos),nd=Velden.nodig(c,f,K);if(vol)iets=true;if(nd&&!vol)alles=false;i.classList.toggle('mist',nd&&!vol);});
      const v=el.querySelector('.vink');if(v)v.hidden=!(alles&&iets);});
    const x=secties().find(y=>y.sc.id===st.sec),g=R.querySelector('.gst');
    if(g&&x){g.textContent=x.open.length?x.open.length+' open':'✓';g.className='gst '+(x.open.length?'wrn':'okk');}
  }
  function bind(){
    const R=st.root,s=st.s;
    R.querySelectorAll('input[data-k],textarea[data-k]').forEach(e=>e.oninput=()=>{let v=e.value;
      if(e.dataset.num){const n=parseFloat(v.replace(',','.'));v=v.trim()===''?'':isFinite(n)?n:v;}
      Velden.zet(s,e.dataset.k,v);save();upd();});
    R.querySelectorAll('[data-stp]').forEach(b=>b.onclick=()=>{const k=b.dataset.stp,n=Math.max(0,(parseFloat(Velden.waarde(s,k))||0)+(+b.dataset.d));
      Velden.zet(s,k,n);const i=R.querySelector(`input[data-k="${k}"]`);if(i)i.value=n;save();upd();});
    R.querySelectorAll('.ch button').forEach(b=>b.onclick=()=>{const k=b.dataset.k,on=Velden.waarde(s,k)===b.dataset.v;Velden.zet(s,k,on?'':b.dataset.v);save(true).then(()=>herteken());});
    R.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const k=b.dataset.sw,f=Velden.VELDEN.find(x=>x.k===k),aan=Velden.zelfdeAan(s,k);
      if(aan)Object.entries(f.bron).forEach(([doel,bron])=>{const vv=(s.velden||{})[doel];if(vv==null||vv==='')Velden.zet(s,doel,Velden.waarde(s,bron)||'');}); // uitzetten: neem de klantgegevens over om aan te passen
      Velden.zet(s,k,aan?'Nee':'Ja');save(true).then(()=>herteken());});
    R.querySelectorAll('[data-foto]').forEach(b=>b.onclick=()=>{const k=b.dataset.foto;
      Camera.take({galerij:b.dataset.g==='1'}).then(async r=>{if(!r||!r.blob||!st)return;s.bijlagen={...(s.bijlagen||{}),[k]:r.blob};if(Velden.waarde(s,k)==='nvt')Velden.zet(s,k,'');await save(true);herteken();});});
    R.querySelectorAll('[data-nvt]').forEach(b=>b.onclick=async()=>{const k=b.dataset.nvt;Velden.zet(s,k,Velden.waarde(s,k)==='nvt'?'':'nvt');await save(true);herteken();});
    R.querySelectorAll('[data-weg]').forEach(b=>b.onclick=async()=>{const k=b.dataset.weg;const bl={...(s.bijlagen||{})};delete bl[k];s.bijlagen=bl;await save(true);herteken();});
    R.querySelectorAll('[data-kies]').forEach(b=>b.onclick=async()=>{const ct=Velden.CONTACTEN.find(y=>y.id===b.dataset.kies);
      try{const r=await navigator.contacts.select(['name','tel','email'],{multiple:false}),x=r&&r[0];if(!x)return;
        if(x.name&&x.name[0])Velden.zet(s,ct.naam,x.name[0]);if(x.tel&&x.tel[0]&&ct.tel)Velden.zet(s,ct.tel,x.tel[0]);if(x.email&&x.email[0]&&ct.mail)Velden.zet(s,ct.mail,x.email[0]);
        await save(true);herteken();}catch(e){}});
    // V&G
    const zetVg=async(id,aan)=>{const v=vg(),a=Velden.VG.find(x=>x.id===id);v.items={...v.items,[id]:{risico:a.risico,afspraak:a.afspraak,...(v.items[id]||{}),aan}};Velden.zet(s,'vg',v);await save(true);herteken();};
    R.querySelectorAll('[data-vgt]').forEach(b=>b.onclick=()=>{const v=vg();zetVg(b.dataset.vgt,!(v.items[b.dataset.vgt]&&v.items[b.dataset.vgt].aan));});
    R.querySelectorAll('[data-vg]').forEach(c=>c.onchange=()=>zetVg(c.dataset.vg,c.checked));
    R.querySelectorAll('[data-vgr]').forEach(e=>e.oninput=()=>{const v=vg(),id=e.dataset.vgr;v.items={...v.items,[id]:{...(v.items[id]||{}),[e.dataset.f]:e.value}};Velden.zet(s,'vg',v);save();});
    const mr=R.querySelector('#vgMeer');if(mr)mr.onclick=()=>{st.vgMeer=!st.vgMeer;mr.setAttribute('aria-expanded',st.vgMeer);R.querySelector('#vgMeerL').hidden=!st.vgMeer;};
    const ok=R.querySelector('#vgOk');if(ok)ok.onclick=async()=>{const v=vg();
      if(!v.nagelopen&&!Object.values(v.items||{}).some(x=>x.aan)){
        const k=await vraag('Geen enkele situatie gekozen. Klopt dat?','',[['klopt','Klopt','pri'],['terug','Terug','']]);if(k!=='klopt')return;}
      v.nagelopen=!v.nagelopen;Velden.zet(s,'vg',v);await save(true);herteken();};
  }
  function herteken(){if(!st)return;const b=st.root.querySelector('.gb'),y=b?b.scrollTop:0;if(st.sec)sectie();else lijst();const n=st.root.querySelector('.gb');if(n)n.scrollTop=y;}

  /* ---------- bladen ---------- */
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
.tdth b{font-size:13px;color:var(--mute);margin-left:2px}`;
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
  function vakkenHtml(s,fotos,kant){css();const V=Velden.vakken(s,fotos,kant),on=Velden.onnet(s);
    vkUrls.forEach(u=>URL.revokeObjectURL(u));vkUrls=[];
    const sec=fs=>[...new Set(fs.map(f=>f.t==='teller'||f.t==='foto'||f.t==='fotos'||f.t==='rolfoto'?(f.kort||f.l):(Velden.SECTIES.find(x=>x.id===Velden.groep(f))||{}).kort))].join(' · ');
    const sub=fs=>fs.length?`${fs.length} nog te doen · ${esc(sec(fs))}`:'<span class="okk">✓ Compleet</span>';
    const ok=(fotos||[]).filter(p=>p.status!=='vervallen'&&p.blob);
    const thumbs=x=>{const L=ok.filter(p=>(p.sectie||'buiten')===x),max=7;if(!L.length)return'';
      return `<span class="tdth">${L.slice(0,max).map(p=>{const u=URL.createObjectURL(p.blob);vkUrls.push(u);return `<img src="${u}" alt="">`;}).join('')}${L.length>max?`<b>+${L.length-max}</b>`:''}</span>`;};
    const n=x=>ok.filter(p=>(p.sectie||'buiten')===x).length;
    const pijl=svg('M9 5l7 7-7 7',18);
    const vk=(id,ic,titel,fs,extra)=>`<button class="tdr tdfo${fs.length?' wrn':''}" data-vk="${id}" aria-label="${esc(titel)}: ${fs.length?fs.length+' nog te doen':'compleet'}"><span class="tdk"><span class="tdi">${ic}</span><span class="tdt"><b>${titel}</b><small>${sub(fs)}</small></span><span class="tdp">${pijl}</span></span>${extra||''}</button>`;
    const dot=x=>`<i class="dot" style="background:var(--sec-${x});width:12px;height:12px;border-radius:50%;display:block"></i>`;
    return `<div class="tdo">${vk('info',svg(ICI,20),'Informatie',V.info)}
      ${on?'':vk('buiten',dot('buiten'),`Foto's buiten · ${n('buiten')}`,V.buiten,thumbs('buiten'))}
      ${vk('binnen',dot('binnen'),`Foto's binnen · ${n('binnen')}`,V.binnen,thumbs('binnen'))}</div>`;}
  function vakkenBind(el,s,klaar,o={}){
    el.querySelectorAll('[data-vk]').forEach(b=>b.onclick=async()=>{const x=b.dataset.vk;
      if(x==='info'){const fo=await Store.photos.bySurvey(s.id,true),V=Velden.vakken(s,fo,o.kant);
        open(s,{filter:V.info.length?'todo':'alles',zonder:['buiten','binnen','afw'],onClose:klaar});}
      else if(o.naar)o.naar(x);});
  }
  /* ---------- verplichte foto met een rol kiezen (aansluitpunt, invoer pand, beginpunt) ---------- */
  async function zetRol(foto,rol,alle){for(const p of alle)if(p.rol===rol&&p.id!==foto.id){delete p.rol;await Store.photos.put(p);}
    foto.rol=rol;await Store.photos.put(foto);}
  async function rolBlad(s,f,o={}){css();
    const alle=await Store.photos.bySurvey(s.id,true),hier=alle.filter(p=>p.status!=='vervallen'&&(p.sectie||'buiten')===f.sectie),nu=hier.find(p=>p.rol===f.rol);
    const us=[];const u=b=>{const x=URL.createObjectURL(b);us.push(x);return x;};
    const d=document.createElement('div');d.className='gbl';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','grT');
    d.innerHTML=`<div class="gblb"><h3 id="grT">${esc(f.kort||f.l)}</h3><p>${esc(f.vb?hoofd(f.vb)+'.':'')}</p>
      ${o.maak?`<button class="btn pri" data-r="cam">Foto maken</button><button class="btn" data-r="gal">Uit galerij</button>`:''}
      ${hier.length?`<p>${o.maak?'Of kies':'Kies'} een foto die er al is:</p><div class="grk">${hier.map(p=>`<button data-p="${p.id}" class="${p===nu?'on':''}" aria-pressed="${p===nu}" aria-label="Foto ${hier.indexOf(p)+1}${p.rol&&p!==nu?' (al gebruikt als andere verplichte foto)':''}"><img src="${u(p.blob)}" alt=""><span>${hier.indexOf(p)+1}${p===nu?' ✓':''}</span></button>`).join('')}</div>`:`<p>Er zijn nog geen foto's ${esc(f.sectie)}.</p>`}
      ${nu?'<button class="btn" data-r="weg">Niet meer als verplichte foto</button>':''}
      <button class="btn" data-r="x">Annuleren</button></div>`;
    document.body.appendChild(d);d.querySelector('button').focus();
    const dicht=r=>{us.forEach(x=>URL.revokeObjectURL(x));d.remove();if(r&&o.klaar)o.klaar();};
    d.addEventListener('click',e=>{if(e.target===d)dicht(false);});
    d.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{const r=b.dataset.r;
      if(r==='x')return dicht(false);
      if(r==='weg'){delete nu.rol;await Store.photos.put(nu);return dicht(true);}
      dicht(false);if(o.maak)o.maak(r==='gal');});
    d.querySelectorAll('[data-p]').forEach(b=>b.onclick=async()=>{const p=hier.find(x=>x.id===b.dataset.p);await zetRol(p,f.rol,alle);dicht(true);});
  }
  window.Gegevens={open,close:()=>close(),naKast,vraag,todoHtml,todoBind,inline,vakkenHtml,vakkenBind,rolBlad,zetRol,bron:null};
})();
