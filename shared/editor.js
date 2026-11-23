/* Foto-editor van Veeg & Klik, ook los te gebruiken door Richt & Zet en Loop-spoor als correctie.
   Gebruik: Editor.openEditor(photoId, {onClose, onNext, onDoc, onChange, nextLabel})
   Vereist shared/store.js en shared/legend.js. Alles wordt direct opgeslagen via Store. */
(function(){
  const CH=[
    {k:'pijl',short:'Nieuw tracé',text:'Nieuw te leggen tracé via de aangegeven route'},
    {k:'kn',short:'Nieuwe koppeling',text:'Plaatsen nieuwe koppeling op bestaande buis'},
    {k:'hn',short:'Nieuwe handhole',text:'Plaatsen nieuwe handhole'},
    {k:'dv',short:'Invoer gevel',text:'Nieuwe invoer in de gevel'},
    {k:'best',short:'Bestaand tracé',text:'Vervolg in bestaand tracé'},
    {k:'lo',short:'Let op',text:'Let op: '},
    {k:'r1',short:'Door bestrating',text:'Door bestrating',route:1},
    {k:'r2',short:'Door groen',text:'Door groen',route:1},
    {k:'r3',short:'Langs parkeervakken',text:'Langs parkeervakken',route:1},
    {k:'r4',short:'Onder zebrapad',text:'Onder zebrapad',route:1},
    {k:'r5',short:'Langs de gevel',text:'Langs de gevel',route:1},
    {k:'r6',short:'Gemeentegrond',text:'Gemeentegrond',route:1}
  ];
  const TOOLS=[
    {id:'nieuw',name:'Nieuw tracé',draw:1},
    {id:'buis',name:'Bestaande buis',draw:1},
    {id:'k',name:'Koppeling',nb:1},
    {id:'h',name:'Handhole',nb:1},
    {id:'dv',name:'Invoer'},
    {id:'lo',name:'Let op'}
  ];
  const C={green:'#2BB24C',red:'#D7261E',teal:'#0E7C86',yellow:'#F2D024',brown:'#8B2E16'};
  const mini={
    nieuw:`<svg width="40" height="16" viewBox="0 0 40 16" aria-hidden="true"><path d="M3 8H28" stroke="${C.green}" stroke-width="8" stroke-linecap="round"/><path d="M3 8H28" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/><path d="M38 8L27 1.5V14.5Z" fill="${C.red}" stroke="${C.green}" stroke-width="2" stroke-linejoin="round"/></svg>`,
    buis:`<svg width="40" height="16" viewBox="0 0 40 16" aria-hidden="true"><path d="M4 8H36" stroke="${C.yellow}" stroke-width="8" stroke-linecap="round"/><path d="M4 8H36" stroke="${C.teal}" stroke-width="4" stroke-linecap="round"/></svg>`,
    k:nb=>`<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8.5" fill="${nb?C.teal:C.brown}" stroke="${nb?C.yellow:C.green}" stroke-width="3"/></svg>`,
    h:nb=>`<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect x="2.5" y="2.5" width="17" height="17" rx="1.5" fill="${nb?C.teal:C.brown}" stroke="${nb?C.yellow:C.green}" stroke-width="3"/></svg>`,
    dv:`<svg width="38" height="22" viewBox="0 0 38 22" aria-hidden="true"><rect x="1.5" y="1.5" width="35" height="19" rx="9.5" fill="${C.brown}" stroke="${C.green}" stroke-width="3"/><text x="19" y="15" font-size="11" font-weight="800" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">IN</text></svg>`,
    lo:`<svg width="52" height="22" viewBox="0 0 52 22" aria-hidden="true"><rect x="1.5" y="1.5" width="49" height="19" rx="9.5" fill="#F2B705" stroke="#1a1a1a" stroke-width="3"/><text x="26" y="15" font-size="10" font-weight="800" text-anchor="middle" fill="#1a1a1a" font-family="system-ui,sans-serif">LET OP</text></svg>`
  };
  const CSS=`
.ved{position:fixed;inset:0;z-index:50;background:var(--bg,#0d0f12);color:var(--ink,#f5f6f7);display:flex;flex-direction:column;overflow:hidden}
.ved .vbar{flex:none;display:flex;align-items:center;gap:8px;padding:calc(4px + env(safe-area-inset-top)) calc(10px + env(safe-area-inset-right)) 4px calc(6px + env(safe-area-inset-left));border-bottom:1px solid var(--line,#33383f)}
.ved .vbar h2{flex:1;font-size:18px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ved .vscroll{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:8px}
.ved .vph{position:relative;margin:0 auto;background:#000;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.ved .vph img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block;pointer-events:none}
.ved .vph svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.ved .vph.grey img{filter:grayscale(1) brightness(.6)}
.ved .vhint{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 14px;min-height:64px;border-bottom:1px solid var(--line,#33383f)}
.ved .vhint p{flex:1;margin:0;font-size:16px;line-height:1.3;color:var(--mute,#b9bec6)}
.ved .vhint p.t{color:#FF9A4D;font-weight:700}
.ved .sm{min-height:44px;padding:0 12px;border-radius:12px;border:2px solid var(--line,#33383f);background:transparent;color:inherit;font-weight:700;font-size:16px;cursor:pointer}
.ved .vtools{display:flex;gap:8px;padding:10px 12px;overflow-x:auto;scrollbar-width:none}
.ved .vtools::-webkit-scrollbar{display:none}
.ved .tl{flex:none;min-width:88px;min-height:64px;border-radius:14px;border:2px solid var(--line,#33383f);background:var(--card,#181b20);color:inherit;font-size:15px;font-weight:700;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:6px 8px;cursor:pointer}
.ved .tl.on{border-color:var(--acc,#FF7A1A);background:var(--card2,#22262d)}
.ved .nbsw{display:flex;gap:4px;margin:0 12px 6px;padding:3px;border-radius:14px;background:var(--card,#181b20);width:max-content}
.ved .nbsw button{min-height:44px;padding:0 16px;border-radius:11px;border:0;background:transparent;color:var(--mute,#b9bec6);font-weight:700;font-size:16px;cursor:pointer}
.ved .nbsw button.on{background:var(--ink,#f5f6f7);color:#111}
.ved .vlab{padding:8px 14px 0;font-size:14px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mute,#b9bec6)}
.ved .chips{display:flex;flex-wrap:wrap;gap:8px;padding:8px 12px}
.ved .chip{min-height:44px;padding:0 14px;border-radius:99px;border:2px solid #3c434c;background:var(--card,#181b20);color:inherit;font-size:16px;font-weight:600;cursor:pointer}
.ved .chip.on{background:var(--acc,#FF7A1A);border-color:var(--acc,#FF7A1A);color:#141414}
.ved .vin{display:block;width:calc(100% - 24px);margin:4px 12px;min-height:48px;border-radius:12px;border:2px solid #3c434c;background:var(--card,#181b20);color:inherit;padding:0 12px;font-size:16px}
.ved .cap{margin:6px 12px 0;padding:10px 12px;border-radius:12px;background:#f5f4f0;color:#16191d;font-size:16px;line-height:1.4;min-height:44px}
.ved .cap.empty{color:#666}
.ved .same{margin:8px 12px 0;padding:10px 12px;border-radius:12px;background:#2a2410;border:1px solid #5a4a14;color:#ffe08a;font-size:16px}
.ved .strip{display:flex;gap:8px;padding:10px 12px;overflow-x:auto}
.ved .th{position:relative;flex:none;width:72px;height:56px;border-radius:10px;overflow:hidden;border:2px solid var(--line,#33383f);background:#000;padding:0;cursor:pointer}
.ved .th.on{border-color:var(--acc,#FF7A1A)}
.ved .th img{width:100%;height:100%;object-fit:cover;display:block}
.ved .th.vv img{filter:grayscale(1) brightness(.45)}
.ved .th span{position:absolute;left:4px;bottom:2px;font-size:13px;font-weight:800;color:#fff;text-shadow:0 1px 2px #000}
.ved .th em{position:absolute;inset:auto 0 0 0;font-style:normal;font-size:11px;font-weight:800;background:#000a;color:#fff;text-align:center}
.ved .vfoot{flex:none;display:flex;gap:10px;padding:10px calc(12px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left));border-top:1px solid var(--line,#33383f);background:var(--bg,#0d0f12)}
.ved .vfoot .btn{flex:1}
.vpop{position:fixed;z-index:60;display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:14px;background:#22262d;border:1px solid #444;box-shadow:0 10px 30px #000a;min-width:200px}
.vpop button{min-height:48px;border-radius:10px;border:0;font-size:16px;font-weight:700;cursor:pointer;background:#2e333b;color:#fff;padding:0 14px;text-align:left}
.vpop button.del{background:#D7261E;color:#fff}
`;
  function injectCss(){if(document.getElementById('vedcss'))return;const s=document.createElement('style');s.id='vedcss';s.textContent=CSS;document.head.appendChild(s);}
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clone=o=>JSON.parse(JSON.stringify(o||{}));
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function segDist(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
  const lineDist=(p,P)=>{let d=1e9;for(let i=1;i<(P||[]).length;i++)d=Math.min(d,segDist(p,P[i-1],P[i]));return d;};
  const pathLen=P=>{let s=0;for(let i=1;i<P.length;i++)s+=dist(P[i-1],P[i]);return s;};

  /* ---- van veeg naar nette pijl ---- */
  function rdp(P,eps){
    if(P.length<3)return P.slice();
    const a=P[0],b=P[P.length-1];let md=0,mi=0;
    for(let i=1;i<P.length-1;i++){const d=segDist(P[i],a,b);if(d>md){md=d;mi=i;}}
    if(md>eps){const l=rdp(P.slice(0,mi+1),eps),r=rdp(P.slice(mi),eps);return l.slice(0,-1).concat(r);}
    return[a,b];
  }
  const ang=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
  function tidy(raw){
    let eps=11,out;
    for(let round=0;round<8;round++){
      let s=rdp(raw,eps);
      // korte stukjes (<20) weglaten
      const q=[s[0]];for(let i=1;i<s.length-1;i++){if(dist(s[i],q[q.length-1])>=20)q.push(s[i]);}
      q.push(s[s.length-1]);if(q.length>2&&dist(q[q.length-1],q[q.length-2])<20)q.splice(q.length-2,1);
      // stukken die minder dan 8 graden afwijken samenvoegen
      let ch=true;while(ch&&q.length>2){ch=false;for(let i=1;i<q.length-1;i++){let d=Math.abs(ang(q[i-1],q[i])-ang(q[i],q[i+1]));if(d>Math.PI)d=2*Math.PI-d;if(d<8*Math.PI/180){q.splice(i,1);ch=true;break;}}}
      // laatste stuk minimaal 26, anders past de pijlpunt niet
      while(q.length>2&&dist(q[q.length-1],q[q.length-2])<26)q.splice(q.length-2,1);
      out=q;if(out.length<=5)break;eps*=1.4;
    }
    return out.map(p=>[Math.round(p[0]),Math.round(p[1])]);
  }

  /* ---- bijschrift ---- */
  function suggest(ann){
    const s=(ann&&ann.syms)||[],has=t=>s.some(x=>x.t===t),out=[];
    if(ann&&((ann.arrow&&ann.arrow.length>1)||(ann.poly&&ann.poly.body)))out.push('pijl');
    if(has('kn'))out.push('kn');if(has('hn'))out.push('hn');if(has('dv'))out.push('dv');
    if(ann&&ann.buis&&ann.buis.length>1&&!has('kn'))out.push('best');
    if(has('lo'))out.push('lo');
    return out;
  }
  function capOf(ph){
    const c=ph.cap||{auto:true,sel:[],lo:'',vrij:''};
    const sel=c.auto?suggest(ph.ann).concat((c.sel||[]).filter(k=>CH.find(x=>x.k===k&&x.route))):(c.sel||[]);
    const parts=CH.filter(x=>sel.includes(x.k)).map(x=>x.k==='lo'?('Let op: '+(c.lo||'').trim()).trim():x.text);
    if((c.vrij||'').trim())parts.push(c.vrij.trim());
    return{sel,text:parts.join('. ')};
  }

  let st=null; // huidige editor-toestand
  const stacks={}; // ongedaan-stapel per foto (zolang de pagina open is)

  async function openEditor(photoId,opts={}){
    injectCss();
    if(st)close(true);
    const ph=await Store.photos.get(photoId);if(!ph)throw new Error('Foto niet gevonden');
    if(!ph.ann){const im=await loadDims(ph.blob);ph.ann={orient:im.w>=im.h?'liggend':'staand'};}
    const root=document.createElement('div');root.className='ved';root.setAttribute('role','dialog');root.setAttribute('aria-label','Foto bewerken');
    document.body.appendChild(root);
    st={ph,opts,root,tool:'nieuw',nb:'nieuw',sel:null,url:URL.createObjectURL(ph.blob),toast:'',siblings:[],thumbs:{}};
    await loadSiblings();
    build();
    return{close:()=>close()};
  }
  function loadDims(blob){return new Promise(res=>{const u=URL.createObjectURL(blob),i=new Image();i.onload=()=>{res({w:i.naturalWidth,h:i.naturalHeight});URL.revokeObjectURL(u);};i.onerror=()=>{res({w:4,h:3});URL.revokeObjectURL(u);};i.src=u;});}
  async function loadSiblings(){
    const all=await Store.photos.bySurvey(st.ph.surveyId,true);st.siblings=all;
    all.forEach(p=>{if(!st.thumbs[p.id])st.thumbs[p.id]=URL.createObjectURL(p.blob);});
  }
  function close(silent){
    if(!st)return;const o=st.opts;URL.revokeObjectURL(st.url);Object.values(st.thumbs).forEach(u=>URL.revokeObjectURL(u));
    st.root.remove();hidePop();st=null;if(!silent&&o.onClose)o.onClose();
  }
  const size=()=>Legend.size(st.ph.ann);
  let saveT=null;
  function save(now){
    clearTimeout(saveT);
    const go=async()=>{const p=st&&st.ph;if(!p)return;const c=capOf(p);p.bijschrift=c.text;await Store.photos.put(p);if(st&&st.opts.onChange)st.opts.onChange(p);};
    if(now)return go();saveT=setTimeout(go,250);
  }
  function remember(){const k=st.ph.id;(stacks[k]=stacks[k]||[]).push(JSON.stringify({ann:st.ph.ann,cap:st.ph.cap||null}));if(stacks[k].length>60)stacks[k].shift();}
  function undo(){const s=stacks[st.ph.id];if(!s||!s.length){toast('Niets om ongedaan te maken.');return;}const o=JSON.parse(s.pop());st.ph.ann=o.ann;if(o.cap)st.ph.cap=o.cap;else delete st.ph.cap;st.sel=null;save(true);toast('Ongedaan gemaakt.');redraw();renderCaption();}
  function toast(t){st.toast=t;const h=st.root.querySelector('.vhint p');if(h){h.textContent=t||hintText();h.className=t?'t':'';}}
  function hintText(){const t=TOOLS.find(x=>x.id===st.tool);if(st.ph.status==='vervallen')return'Deze foto vervalt en komt niet in het document.';
    if(st.sel)return'Sleep de rondjes om de lijn bij te stellen. Tik ernaast om te stoppen.';
    return t.draw?'Veeg met je vinger over de route.':`Tik op de foto om ${t.name.toLowerCase()} te zetten.`;}

  function build(){
    const ph=st.ph,n=st.siblings.findIndex(p=>p.id===ph.id)+1;
    st.root.innerHTML=`
    <div class="vbar"><button class="back" id="vBack">‹ Terug</button><h2>Foto ${n||''}</h2>${ph.status==='vervallen'?'<button class="sm" id="vRest">Terugzetten</button>':''}</div>
    <div class="vscroll">
      <div class="vph${ph.status==='vervallen'?' grey':''}" id="vPh"><img src="${st.url}" alt="Foto ${n}"><svg class="leg"></svg><svg class="hnd"></svg></div>
      <div class="vhint"><p></p><button class="sm" id="vUndo">Ongedaan</button><button class="sm" id="vWipe">Wis foto</button></div>
      <div class="vtools" role="toolbar" aria-label="Gereedschap">${TOOLS.map(t=>`<button class="tl${t.id===st.tool?' on':''}" data-t="${t.id}" aria-pressed="${t.id===st.tool}">${typeof mini[t.id]==='function'?mini[t.id](st.nb==='best'):mini[t.id]}<span>${t.name}</span></button>`).join('')}</div>
      <div class="nbsw" id="vNb" role="group" aria-label="Nieuw of bestaand" ${TOOLS.find(t=>t.id===st.tool).nb?'':'hidden'}><button data-nb="nieuw" class="${st.nb==='nieuw'?'on':''}" aria-pressed="${st.nb==='nieuw'}">Nieuw</button><button data-nb="best" class="${st.nb==='best'?'on':''}" aria-pressed="${st.nb==='best'}">Bestaand</button></div>
      <div class="vlab">Bijschrift</div>
      <div id="vCap"></div>
      <div class="vlab">Foto's van deze schouw</div>
      <div class="strip" id="vStrip"></div>
    </div>
    <div class="vfoot">${st.opts.onNext?`<button class="btn pri" id="vNext">${esc(st.opts.nextLabel||'Volgende foto')}</button>`:''}${st.opts.onDoc?'<button class="btn" id="vDoc">Naar document</button>':''}</div>`;
    const R=st.root,q=s=>R.querySelector(s);
    fitPhoto();
    q('#vBack').onclick=()=>{save(true);close();};
    if(q('#vRest'))q('#vRest').onclick=()=>setStatus(st.ph,'ok');
    q('#vUndo').onclick=undo;
    q('#vWipe').onclick=()=>{const a=st.ph.ann;if(!(a.arrow||a.buis||(a.syms&&a.syms.length))){toast('Er staat nog niets op deze foto.');return;}remember();st.ph.ann={orient:a.orient};st.sel=null;save(true);redraw();renderCaption();toast('Tekening gewist. Ongedaan zet hem terug.');};
    R.querySelectorAll('.tl').forEach(b=>b.onclick=()=>{st.tool=b.dataset.t;st.sel=null;R.querySelectorAll('.tl').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});q('#vNb').hidden=!TOOLS.find(t=>t.id===st.tool).nb;toast('');redraw();});
    R.querySelectorAll('#vNb button').forEach(b=>b.onclick=()=>{st.nb=b.dataset.nb;R.querySelectorAll('#vNb button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});
      R.querySelector('.tl[data-t=k]').firstElementChild.outerHTML=mini.k(st.nb==='best');R.querySelector('.tl[data-t=h]').firstElementChild.outerHTML=mini.h(st.nb==='best');});
    if(q('#vNext'))q('#vNext').onclick=()=>{save(true);st.opts.onNext(st.ph);}; // geen await: de camera moet binnen de tik openen
    if(q('#vDoc'))q('#vDoc').onclick=async()=>{await save(true);st.opts.onDoc(st.ph);};
    bindPointer(q('#vPh'));
    toast(st.toast);redraw();renderCaption();renderStrip();
    window.addEventListener('resize',fitPhoto);
  }
  function fitPhoto(){
    if(!st)return;const el=st.root.querySelector('#vPh');if(!el)return;const[W,H]=size();
    const maxW=st.root.clientWidth,maxH=Math.max(220,Math.round(window.innerHeight*.58));
    let w=maxW,h=w*H/W;if(h>maxH){h=maxH;w=h*W/H;}
    el.style.width=Math.round(w)+'px';el.style.height=Math.round(h)+'px';
  }
  function redraw(){
    if(!st)return;const R=st.root,[W,H]=size(),leg=R.querySelector('svg.leg'),hnd=R.querySelector('svg.hnd');if(!leg)return;
    Legend.render(leg,st.ph.ann);
    hnd.setAttribute('viewBox',`0 0 ${W} ${H}`);hnd.setAttribute('preserveAspectRatio','none');
    let o='';
    if(st.raw&&st.raw.length>1)o+=`<polyline points="${st.raw.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="7 6" stroke-linecap="round" stroke-linejoin="round"/>`;
    if(st.sel){const P=st.ph.ann[st.sel]||[];const k=unitsPerPx();
      o+=`<polyline points="${P.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${2*k}" stroke-dasharray="${5*k} ${4*k}"/>`;
      P.forEach(p=>{o+=`<circle cx="${p[0]}" cy="${p[1]}" r="${11*k}" fill="#fff" stroke="#111" stroke-width="${3*k}"/>`;});}
    hnd.innerHTML=o;
  }
  function unitsPerPx(){const el=st.root.querySelector('#vPh');const r=el.getBoundingClientRect();return size()[0]/(r.width||1);}

  /* ---- aanraken: vegen, tikken, slepen, lang drukken ---- */
  function bindPointer(el){
    let g=null;
    const pt=e=>{const r=el.getBoundingClientRect(),[W,H]=size();return[Math.max(0,Math.min(W,(e.clientX-r.left)/r.width*W)),Math.max(0,Math.min(H,(e.clientY-r.top)/r.height*H))];};
    el.addEventListener('pointerdown',e=>{
      if(g||st.ph.status==='vervallen'){if(st.ph.status==='vervallen')toast('Deze foto vervalt. Zet hem eerst terug.');return;}
      e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(x){}
      hidePop();const p=pt(e),k=unitsPerPx(),a=st.ph.ann;g={p0:p,c0:[e.clientX,e.clientY],moved:false,id:e.pointerId};
      // 1. greep van de geselecteerde lijn (44 px raakvlak)
      if(st.sel){const P=a[st.sel]||[];let bi=-1,bd=22*k;P.forEach((q,i)=>{const d=dist(q,p);if(d<bd){bd=d;bi=i;}});if(bi>=0){g.kind='handle';g.i=bi;remember();return;}}
      // 2. symbool
      const S=a.syms||[];for(let i=S.length-1;i>=0;i--){if(dist([S[i].x,S[i].y],p)<24*k){g.kind='sym';g.i=i;g.off=[S[i].x-p[0],S[i].y-p[1]];armLong(g,()=>popDelete(e.clientX,e.clientY,()=>{remember();a.syms.splice(i,1);afterChange('Symbool verwijderd.');}));return;}}
      // 3. lijn (pijl of buis)
      for(const key of ['arrow','buis']){if(a[key]&&lineDist(p,a[key])<18*k){g.kind='line';g.key=key;armLong(g,()=>popDelete(e.clientX,e.clientY,()=>{remember();delete a[key];if(st.sel===key)st.sel=null;afterChange(key==='arrow'?'Pijl verwijderd.':'Buis verwijderd.');}));break;}}
      if(!g.kind)g.kind='bg';
    });
    el.addEventListener('pointermove',e=>{
      if(!g||e.pointerId!==g.id)return;const p=pt(e);
      if(!g.moved&&Math.hypot(e.clientX-g.c0[0],e.clientY-g.c0[1])>8){g.moved=true;clearTimeout(g.lt);
        if(g.kind==='sym')remember();
        const t=TOOLS.find(x=>x.id===st.tool);
        if((g.kind==='bg'||g.kind==='line')&&t.draw){g.kind='draw';st.sel=null;st.raw=[g.p0];}
      }
      if(!g.moved)return;
      if(g.kind==='handle'){st.ph.ann[st.sel][g.i]=[Math.round(p[0]),Math.round(p[1])];redraw();save();}
      else if(g.kind==='sym'){const s=st.ph.ann.syms[g.i];s.x=Math.round(p[0]+g.off[0]);s.y=Math.round(p[1]+g.off[1]);redraw();save();}
      else if(g.kind==='draw'){const q=st.raw[st.raw.length-1];if(dist(p,q)>=2.5){st.raw.push(p);redraw();}}
    });
    const up=e=>{
      if(!g||e.pointerId!==g.id)return;clearTimeout(g.lt);const d=g;g=null;
      if(d.long)return;
      if(d.kind==='draw'){finishDraw();return;}
      if(d.moved){if(d.kind==='handle'){afterChange('Lijn bijgesteld.');}else if(d.kind==='sym'){afterChange('Symbool verplaatst.');}return;}
      if(e.type==='pointercancel')return;
      // tikken
      const t0=TOOLS.find(x=>x.id===st.tool);
      if(d.kind==='line'&&t0.draw){st.sel=d.key;toast('');redraw();toast(hintText());return;}
      if(d.kind==='line'){placeSym(t0,d.p0);return;}
      if(d.kind==='handle'||d.kind==='sym'){undoNoop();return;}
      if(st.sel){st.sel=null;redraw();toast('');return;}
      const t=TOOLS.find(x=>x.id===st.tool);
      if(t.draw){toast('Veeg een lijn over de route: houd je vinger op de foto en beweeg.');return;}
      placeSym(t,d.p0);
    };
    el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
    el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  function undoNoop(){const s=stacks[st.ph.id];if(s&&s.length){const top=JSON.parse(s[s.length-1]);if(JSON.stringify(top.ann)===JSON.stringify(st.ph.ann))s.pop();}}
  function armLong(g,fn){g.lt=setTimeout(()=>{if(!g.moved){g.long=true;if(navigator.vibrate)navigator.vibrate(15);fn();}},550);}
  function placeSym(t,p){
    const type=t.id==='k'?(st.nb==='best'?'kb':'kn'):t.id==='h'?(st.nb==='best'?'hb':'hn'):t.id;
    remember();const a=st.ph.ann;a.syms=(a.syms||[]).concat([{t:type,x:Math.round(p[0]),y:Math.round(p[1])}]);
    afterChange(`${t.name}${t.nb?(st.nb==='best'?' (bestaand)':' (nieuw)'):''} geplaatst. Sleep om te verschuiven.`);
    if(type==='lo'){renderCaption();setTimeout(()=>{const i=st&&st.root.querySelector('#vLo');if(i)i.focus();},50);}
  }
  function finishDraw(){
    const raw=st.raw;st.raw=null;
    if(!raw||pathLen(raw)<30){redraw();toast('Te kort, veeg een langere lijn');return;}
    const P=tidy(raw);if(P.length<2){redraw();toast('Te kort, veeg een langere lijn');return;}
    remember();const key=st.tool==='buis'?'buis':'arrow';st.ph.ann[key]=P;
    const n=P.length-2;
    afterChange(key==='buis'?(n<=0?'Bestaande buis netjes gelegd: recht.':`Bestaande buis netjes gelegd: ${n} ${n===1?'knik':'knikken'}.`)
      :(n<=0?'Netjes gemaakt: rechte pijl':n===1?'Netjes gemaakt: pijl met 1 knik':`Netjes gemaakt: pijl met ${n} knikken`));
  }
  function afterChange(msg){save(true);redraw();renderCaption();if(msg)toast(msg);}

  /* ---- verwijder-menu ---- */
  let popEl=null;
  function hidePop(){if(popEl){popEl.remove();popEl=null;}}
  function popMenu(x,y,items){
    hidePop();popEl=document.createElement('div');popEl.className='vpop';popEl.setAttribute('role','menu');
    popEl.innerHTML=items.map((it,i)=>`<button role="menuitem" data-i="${i}" class="${it.cls||''}">${esc(it.label)}</button>`).join('');
    document.body.appendChild(popEl);
    const w=popEl.offsetWidth,h=popEl.offsetHeight;popEl.style.left=Math.max(8,Math.min(innerWidth-w-8,x-w/2))+'px';popEl.style.top=Math.max(8,Math.min(innerHeight-h-8,y-h-24))+'px';
    popEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{const it=items[+b.dataset.i];hidePop();if(it.fn)it.fn();});
    setTimeout(()=>document.addEventListener('pointerdown',function f(ev){if(popEl&&!popEl.contains(ev.target)){hidePop();}document.removeEventListener('pointerdown',f,true);},true),0);
  }
  function popDelete(x,y,fn){popMenu(x,y,[{label:'Verwijderen',cls:'del',fn},{label:'Annuleren'}]);}

  /* ---- bijschrift met tikblokjes ---- */
  function renderCaption(){
    if(!st)return;const box=st.root.querySelector('#vCap');if(!box)return;const ph=st.ph;
    const c=ph.cap||{auto:true,sel:[],lo:'',vrij:''},cur=capOf(ph);
    const idx=st.siblings.filter(p=>p.status!=='vervallen');const me=idx.findIndex(p=>p.id===ph.id);
    const prev=me>0?idx[me-1]:null,same=prev&&cur.text&&cur.text===(prev.bijschrift||'');
    const chip=x=>`<button class="chip${cur.sel.includes(x.k)?' on':''}" data-k="${x.k}" aria-pressed="${cur.sel.includes(x.k)}">${esc(x.short)}</button>`;
    box.innerHTML=`<div class="chips">${CH.filter(x=>!x.route).map(chip).join('')}</div>
      ${cur.sel.includes('lo')?`<input class="vin" id="vLo" placeholder="Let op: waarop?" value="${esc(c.lo||'')}" aria-label="Tekst bij Let op">`:''}
      ${same?`<div class="same">Zelfde als vorige foto. Iets toevoegen?</div>`:''}
      <div class="vlab" style="padding-top:2px">Route</div>
      <div class="chips">${CH.filter(x=>x.route).map(chip).join('')}</div>
      <input class="vin" id="vVrij" placeholder="Eigen tekst (vrij)" value="${esc(c.vrij||'')}" aria-label="Eigen tekst bij het bijschrift">
      <div class="cap${cur.text?'':' empty'}" id="vCapTxt">${esc(cur.text)||'Nog geen bijschrift. Veeg een pijl of tik een blokje.'}</div>`;
    box.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
      remember();const k=b.dataset.k,base=capOf(st.ph).sel.slice(),i=base.indexOf(k);if(i>=0)base.splice(i,1);else base.push(k);
      st.ph.cap={...(st.ph.cap||{lo:'',vrij:''}),auto:false,sel:base};save(true);renderCaption();
      if(k==='lo'&&base.includes('lo'))setTimeout(()=>{const x=st.root.querySelector('#vLo');if(x)x.focus();},30);});
    const txt=()=>{const t=capOf(st.ph).text,el=st.root.querySelector('#vCapTxt');el.textContent=t||'Nog geen bijschrift. Veeg een pijl of tik een blokje.';el.classList.toggle('empty',!t);};
    const lo=box.querySelector('#vLo');if(lo)lo.oninput=()=>{st.ph.cap={...(st.ph.cap||{auto:true,sel:[],vrij:''}),lo:lo.value};save();txt();};
    const vr=box.querySelector('#vVrij');vr.oninput=()=>{st.ph.cap={...(st.ph.cap||{auto:true,sel:[],lo:''}),vrij:vr.value};save();txt();};
    vr.onblur=()=>renderCaption();if(lo)lo.onblur=()=>renderCaption();
  }

  /* ---- fotostrook ---- */
  function renderStrip(){
    if(!st)return;const box=st.root.querySelector('#vStrip');if(!box)return;
    box.innerHTML=st.siblings.map((p,i)=>`<button class="th${p.id===st.ph.id?' on':''}${p.status==='vervallen'?' vv':''}" data-id="${p.id}" aria-label="Foto ${i+1}${p.status==='vervallen'?', vervalt':''}"><img src="${st.thumbs[p.id]}" alt=""><span>${i+1}</span>${p.status==='vervallen'?'<em>vervalt</em>':''}</button>`).join('')||'<p class="note">Nog geen foto\'s.</p>';
    box.querySelectorAll('.th').forEach(b=>stripBind(b,b.dataset.id,id=>{if(id!==st.ph.id){save(true);openEditor(id,st.opts);}},()=>st.siblings.find(p=>p.id===b.dataset.id),async p=>{if(p.id===st.ph.id){st.ph.status=p.status;await save(true);build();}else{await Store.photos.put(p);await loadSiblings();renderStrip();renderCaption();if(st.opts.onChange)st.opts.onChange(p);}}));
  }
  /* tik = openen, lang drukken = vervalt / terugzetten. Ook bruikbaar buiten de editor. */
  function stripBind(el,id,onOpen,getPhoto,onStatus){
    let t=null,long=false,x0=0,y0=0;
    el.addEventListener('pointerdown',e=>{long=false;x0=e.clientX;y0=e.clientY;t=setTimeout(()=>{long=true;if(navigator.vibrate)navigator.vibrate(15);
      const p=getPhoto();if(!p)return;const vv=p.status==='vervallen';
      popMenu(e.clientX,e.clientY,[vv?{label:'Terugzetten',fn:()=>{p.status='ok';onStatus(p);}}:{label:'Vervalt (ander tracé)',cls:'del',fn:()=>{p.status='vervallen';onStatus(p);}},{label:'Annuleren'}]);},550);});
    el.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-x0,e.clientY-y0)>10)clearTimeout(t);});
    el.addEventListener('pointerup',()=>clearTimeout(t));el.addEventListener('pointercancel',()=>clearTimeout(t));
    el.addEventListener('contextmenu',e=>e.preventDefault());
    el.addEventListener('click',e=>{if(long){e.preventDefault();return;}onOpen(id);});
  }
  async function setStatus(p,s){p.status=s;await save(true);await loadSiblings();build();}

  window.Editor={openEditor,close:()=>close(),tidy,suggest,capOf,stripBind,CHIPS:CH};
})();
