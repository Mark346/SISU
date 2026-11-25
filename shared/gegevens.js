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
.geg .gh{flex:none;display:flex;align-items:center;gap:8px;padding:calc(4px + env(safe-area-inset-top)) calc(14px + env(safe-area-inset-right)) 6px calc(6px + env(safe-area-inset-left));border-bottom:1px solid var(--line,#2E323A)}
.geg .gh h2{flex:1;min-width:0;margin:0;font-size:18px;font-weight:800;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.geg .gst{font-weight:800;font-size:15px;white-space:nowrap}
.geg .gb{flex:1;overflow-y:auto;padding:12px calc(14px + env(safe-area-inset-right)) 24px calc(14px + env(safe-area-inset-left))}
.geg .gf{flex:none;padding:10px calc(14px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left));border-top:1px solid var(--line,#2E323A);background:var(--bg,#121418)}
.geg .gf .btn{width:100%;min-height:54px}
.geg .gdoc{display:flex;align-items:center;gap:10px;color:var(--mute,#A7ADB8);font-size:15px}
.geg .gdoc i{flex:1;height:6px;border-radius:3px;background:var(--track);overflow:hidden}.geg .gdoc i b{display:block;height:100%;background:var(--prog-doc)}
.geg .wrn{color:var(--warn)}.geg .okk{color:var(--ok,#22C55E)}
.geg .gseg{display:flex;background:var(--card);border:1px solid var(--line);border-radius:var(--r-pill,999px);padding:3px;margin-bottom:12px}
.geg .gseg button{flex:1;min-height:44px;border:0;border-radius:var(--r-pill,999px);background:transparent;color:var(--ink);font-weight:600;font-size:15px;cursor:pointer}
.geg .gseg button.on{background:var(--acc);color:var(--on-acc);font-weight:800}
.geg .gmom{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 10px;color:var(--mute);font-size:15px}
.geg .gmom button{border:0;background:none;color:var(--ink);font-weight:700;font-size:15px;min-height:44px;padding:0 4px;cursor:pointer;text-decoration:underline}
.geg .glist{background:var(--card);border:1px solid var(--line);border-radius:var(--r,20px);overflow:hidden}
.geg .gsr{display:flex;align-items:center;gap:12px;width:100%;min-height:68px;padding:10px 14px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);text-align:left;cursor:pointer;font:inherit}
.geg .gsr:last-child{border-bottom:0}.geg .gsr:active{background:var(--card2)}
.geg .gsr .ic{flex:none;width:40px;height:40px;border-radius:12px;background:var(--well);display:grid;place-items:center;color:var(--mute)}
.geg .gsr .nm{flex:1;min-width:0}.geg .gsr .nm b{display:block;font-size:17px;font-weight:700;line-height:1.2}
.geg .gsr .nm small{display:block;color:var(--mute);font-size:14px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.geg .gsr .sx{flex:none;font-weight:800;font-size:15px;white-space:nowrap}.geg .gsr .ch2{flex:none;color:var(--mute)}
.geg .gleeg{background:var(--card);border:1px solid var(--line);border-radius:var(--r,20px);padding:18px;text-align:center}
.geg .gleeg p{margin:0 0 12px;font-weight:700}.geg .gleeg .btn{width:100%}
.geg .fr{background:var(--card,#1C1F25);border:1px solid var(--line,#2E323A);border-radius:var(--r,20px);padding:12px 14px;margin-bottom:8px}
.geg .mist{border-color:var(--warn)}
.geg .info{color:var(--mute,#A7ADB8);font-size:15px}
.geg .fl{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px;margin-bottom:6px}
.geg .fl span:first-child{flex:1}
.geg .vink{flex:none;width:26px;height:26px;border-radius:50%;background:var(--ok,#22C55E);color:#0b1a10;font-style:normal;font-weight:800;font-size:16px;display:grid;place-items:center}
.geg .vink[hidden]{display:none}
.geg input,.geg textarea{display:block;box-sizing:border-box;max-width:100%;min-width:0;-webkit-appearance:none;appearance:none;width:100%;min-height:48px;border-radius:14px;border:1px solid var(--line2);background:var(--well,#121418);color:inherit;padding:0 12px;font-size:16px}
.geg textarea{min-height:84px;padding:10px 12px;line-height:1.4;resize:vertical}
.geg .ch{display:flex;flex-wrap:wrap;gap:6px}
.geg .ch button{min-height:44px;padding:0 16px;border-radius:99px;border:1px solid var(--line2);background:transparent;color:inherit;font-size:16px;font-weight:600;cursor:pointer}
.geg .ch button.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc);font-weight:800}
.geg .ft{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.geg .ft img{width:120px;height:90px;object-fit:cover;border-radius:var(--r-thumb,14px);border:1px solid var(--line2)}
.geg .ft .btn{min-height:44px}
.geg .stp{display:flex;align-items:center;gap:10px}.geg .stp input{width:90px;flex:none;text-align:center;font-size:20px;font-weight:800}
.geg .stp button{flex:none;width:48px;height:48px;border-radius:24px;border:1px solid var(--line2);background:var(--well);color:var(--ink);font-size:24px;font-weight:800;cursor:pointer;padding:0}
.geg .zw{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;font-weight:700;font-size:16px}
.geg .zw span{flex:1}
.geg .sw{flex:none;position:relative;width:56px;height:34px;border-radius:17px;border:1px solid var(--line2);background:var(--well);cursor:pointer;padding:0}
.geg .sw i{position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:13px;background:var(--mute);transition:left .15s}
.geg .sw[aria-checked="true"]{background:var(--acc);border-color:var(--acc)}.geg .sw[aria-checked="true"] i{left:25px;background:var(--on-acc)}
.geg .ccard .cr{margin-top:8px}.geg .ccard .cr label{display:block;color:var(--mute);font-size:14px;font-weight:600;margin:0 0 4px}
.geg .ccard .kies{margin-top:10px;width:100%;min-height:44px}
.geg .gopt{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;margin:14px 0 8px;border:1px solid var(--line);border-radius:var(--r-pill,999px);background:transparent;color:var(--ink);font-size:16px;font-weight:600;padding:0 18px;cursor:pointer;text-align:left}
.geg .gopt span{flex:1}.geg .gopt svg{transition:transform .15s}.geg .gopt[aria-expanded="true"] svg{transform:rotate(90deg)}
.geg .vgt{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.geg .tile{position:relative;min-height:72px;border-radius:16px;border:1px solid var(--line2);background:var(--card);color:var(--ink);font-size:15px;font-weight:700;line-height:1.25;padding:10px 12px;text-align:left;cursor:pointer;display:flex;flex-direction:column;justify-content:center;gap:4px;overflow-wrap:anywhere;hyphens:auto}
.geg .tile.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc)}
.geg .tile.voor{border-color:var(--warn);border-style:dashed}
.geg .tile small{font-size:12px;font-weight:800;color:var(--warn)}
.geg .vx{grid-column:1/-1;display:grid;gap:6px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px 12px}
.geg .vx b{font-size:14px}.geg .vx input{min-height:44px;font-size:15px}
.geg .vgg{margin:12px 0 4px;font-weight:800;color:var(--mute,#A7ADB8)}
.geg .vgr{border-top:1px solid var(--track);padding:6px 0}
.geg .vgr label{display:flex;gap:10px;align-items:center;min-height:44px;font-size:16px}
.geg .vgr input[type=checkbox]{width:24px;height:24px;min-height:0;accent-color:var(--acc)}
.geg .vgr .vx{margin:4px 0 4px 34px}
.geg .vgok{width:100%;min-height:60px;font-size:18px;margin-top:16px}
.geg .vgok.af{background:var(--ok,#22C55E);border-color:var(--ok,#22C55E);color:#0b1a10}
.gbl{position:fixed;inset:0;z-index:72;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.gblb{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--card,#1C1F25);color:var(--ink,#F3F4F6);border:1px solid var(--line,#2E323A);border-radius:var(--r,20px) var(--r,20px) 0 0;padding:18px calc(16px + env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left));display:flex;flex-direction:column;gap:10px}
.gblb h3{margin:0;font-size:21px}.gblb p{margin:0;color:var(--mute)}
.gblb .btn{width:100%}
.gblb label{display:block;font-weight:700;margin:4px 0 4px}
.gblb input{display:block;box-sizing:border-box;width:100%;min-width:0;min-height:48px;border-radius:14px;border:1px solid var(--line2);background:var(--well);color:inherit;padding:0 12px;font-size:16px;-webkit-appearance:none;appearance:none}
.gblb img{width:100%;max-height:160px;object-fit:cover;border-radius:var(--r-thumb,14px)}
@media (prefers-reduced-motion:reduce){.geg .gopt svg,.geg .sw i{transition:none}}`;
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
    if(opts.sectie&&Velden.SECTIES.some(x=>x.id===opts.sectie))openSectie(opts.sectie);else lijst();
  }
  function close(silent){if(!st)return;const me=st;clearTimeout(svT);if(svP)Store.surveys.put(me.s);st.urls.forEach(u=>URL.revokeObjectURL(u));st.root.remove();st=null;if(!silent&&me.opts.onClose)me.opts.onClose();}
  function terug(){if(!st)return;if(st.sec)lijst();else{save(true);close();}}
  let svT=null,svP=false;
  function save(now){clearTimeout(svT);svP=true;const go=async()=>{svP=false;if(!st)return;const me=st;await Store.surveys.put(me.s);if(me.opts.onChange)me.opts.onChange(me.s);};if(now)return go();svT=setTimeout(go,350);}
  const kant=()=>st.moment==='vooraf'?'in':undefined;
  const secties=()=>Velden.secties(st.s,st.fotos,{moment:st.moment,kant:kant()});
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
    R.innerHTML=`<div class="gh"><button class="back bpill" id="gX">${svg(TERUG,18)}Klaar</button><h2>Gegevens</h2></div>
    <div class="gb">
      <div class="gseg" role="group" aria-label="Filter"><button data-f="todo" class="${st.filter==='todo'?'on':''}" aria-pressed="${st.filter==='todo'}">Nog te doen (${n})</button><button data-f="alles" class="${st.filter==='alles'?'on':''}" aria-pressed="${st.filter==='alles'}">Alles</button></div>
      ${st.moment?`<div class="gmom"><span>Alleen wat je ${esc(Velden.MOMENT[st.moment])} invult</span><button id="gAlle">Alle secties</button></div>`:''}
      ${toon.length?`<div class="glist">${toon.map(x=>`<button class="gsr" data-sc="${x.sc.id}"><span class="ic">${svg(x.sc.ic||'')}</span><span class="nm"><b>${esc(x.sc.kort)}</b><small>${esc(sub(x))}</small></span>${x.open.length?`<span class="sx wrn">${x.open.length} open</span>`:'<span class="sx okk" aria-label="compleet">✓</span>'}<span class="ch2">${svg(VERDER,18)}</span></button>`).join('')}</div>`
        :`<div class="gleeg"><p>${st.moment==='vooraf'?'Alles wat je vooraf nodig hebt, is ingevuld.':'Alles wat nodig is, is ingevuld.'}</p><button class="btn" id="gToon">Alles bekijken</button></div>`}
    </div><div class="gf">${docTxt()}</div>`;
    R.querySelector('#gX').onclick=()=>{save(true);close();};
    R.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{st.filter=b.dataset.f;lijst();});
    R.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>openSectie(b.dataset.sc));
    const al=R.querySelector('#gAlle');if(al)al.onclick=()=>{st.moment=null;lijst();};
    const tn=R.querySelector('#gToon');if(tn)tn.onclick=()=>{st.filter='alles';lijst();};
    R.querySelector('#gX').focus({preventScroll:true});
  }

  /* ---------- niveau 2: één sectie ---------- */
  function openSectie(id){st.sec=id;st.optOpen=false;st.vgMeer=false;sectie();const b=st.root.querySelector('.gb');if(b)b.scrollTop=0;}
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
    if(!x){lijst();return;}
    st.urls.forEach(u=>URL.revokeObjectURL(u));st.urls=[];
    const it=items(x),req=it.filter(i=>i.req),opt=it.filter(i=>!i.req),sch=x.velden.filter(f=>f.schakel),nx=volgende();
    const html=i=>i.ct?contact(i):i.f.t==='vg'?vgHtml(i.f):row(i.f);
    R.innerHTML=`<div class="gh"><button class="back bpill" id="gX">${svg(TERUG,18)}Overzicht</button><h2>${esc(x.sc.kort)}</h2><span class="gst"></span></div>
    <div class="gb">
      ${sch.map(f=>{const on=Velden.zelfdeAan(st.s,f.k);return `<div class="fr zw"><span id="l_${f.k}">${esc(f.l)}</span><button class="sw" role="switch" aria-checked="${on}" aria-labelledby="l_${f.k}" data-sw="${f.k}"><i></i></button></div>`;}).join('')}
      ${req.map(html).join('')}
      ${opt.length?`<button class="gopt" id="gOpt" aria-expanded="${st.optOpen}"><span>Optioneel (${opt.length})</span>${svg(VERDER,18)}</button><div id="gOptL"${st.optOpen?'':' hidden'}>${opt.map(html).join('')}</div>`:''}
      ${!req.length&&!opt.length?'<p class="info">Hier hoef je nu niets in te vullen.</p>':''}
    </div><div class="gf"><button class="btn pri" id="gNx">${nx?'Volgende sectie: '+esc(nx.sc.kort):'Terug naar overzicht'}</button></div>`;
    R.querySelector('#gX').onclick=()=>{save(true);lijst();};
    R.querySelector('#gNx').onclick=()=>{save(true);const n=volgende();if(n)openSectie(n.sc.id);else lijst();};
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
  window.Gegevens={open,close:()=>close(),naKast,vraag,bron:null};
})();
