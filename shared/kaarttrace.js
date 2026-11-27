/* Kaart met tracé (veld trace_geo, alleen OFFNET): kaart importeren (foto of pdf), daarna het tracé
   intekenen met een rode stippellijn en rode kruizen over het oude tracé. Het origineel en de tekening
   blijven bewaard (s.kaartTrace), het samengestelde beeld komt in bijlage 'trace_geo' voor het document. */
(function(){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const MAX=2400,ROOD='#E53935',WIT='#ffffff';
  let cssOk=false;
  function css(){if(cssOk)return;cssOk=true;const st=document.createElement('style');st.textContent=`
.plv{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border-radius:var(--r,16px);background:var(--card);border:1px solid #3b82f6;color:var(--ink);text-align:left;font:inherit;cursor:pointer}
.plv .pli{flex:none;width:40px;height:40px;border-radius:10px;background:rgba(59,130,246,.16);display:grid;place-items:center;color:#60a5fa}
.plv .plt{flex:1;min-width:0}.plv .plt b{display:block;font-size:18px;font-weight:700;line-height:1.2}.plv .plt small{display:block;color:var(--mute);font-size:14px;margin-top:2px}
.plv.mist .pli{background:rgba(249,115,22,.18);color:#fb923c}.plv.mist .plt small{color:#fdba74}
.plv img{flex:none;width:64px;height:48px;object-fit:cover;border-radius:6px;background:#fff}
.plv .plp{flex:none;color:var(--mute)}
.ple{position:fixed;inset:0;z-index:200;background:#0d0f12;display:flex;flex-direction:column;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none}
.ple .plh{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;background:#15181d;border-bottom:1px solid #2a2e35}
.ple .plh b{flex:1;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.ple button{font:inherit}
.ple .plk{min-height:40px;padding:0 12px;border-radius:999px;border:1px solid #3a3e46;background:transparent;color:#fff;font-weight:600}
.ple .plk.pri{background:#f2f3f5;color:#111;border-color:#f2f3f5}
.ple .plk.rood{color:#ff9b95;border-color:#7a2e2b}
.ple .plv2{flex:1;position:relative;overflow:hidden;background:#22262c}
.ple .plw{position:absolute;left:0;top:0;transform-origin:0 0}
.ple .plw img,.ple .plw svg{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.ple .plb{display:flex;gap:8px;align-items:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#15181d;border-top:1px solid #2a2e35;flex-wrap:wrap}
.ple .plseg{display:flex;border:1px solid #3a3e46;border-radius:999px;overflow:hidden}
.ple .plseg button{min-height:44px;padding:0 12px;border:0;background:transparent;color:#cfd3da;font-weight:700;display:flex;align-items:center;gap:6px}
.ple .plseg button[aria-pressed="true"]{background:${ROOD};color:#fff}
.ple .plhint{width:100%;font-size:13px;color:#9aa1ab;margin:0}
.ple .plsp{flex:1}
.plm{position:fixed;inset:0;z-index:210;background:rgba(0,0,0,.55);display:flex;align-items:flex-end}
.plm>div{width:100%;background:#1b1e23;border-radius:18px 18px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px}
.plm .plk{min-height:48px}
`;document.head.appendChild(st);}

  const kaartIc='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>';
  const pijl='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>';
  let urls=[];
  /* eenmalig: wat in v66 als plattegrond is ingetekend, is de kaart met tracé */
  function migreer(s){if(!s||!s.plattegrond||!s.plattegrond.orig)return false;const bl={...(s.bijlagen||{})};
    if(!s.kaartTrace){s.kaartTrace=s.plattegrond;if(bl.plattegrond&&!bl.trace_geo)bl.trace_geo=bl.plattegrond;}
    delete bl.plattegrond;s.bijlagen=bl;delete s.plattegrond;return true;}
  const heeft=s=>!!((s.bijlagen||{}).trace_geo);
  function html(s){css();migreer(s);urls.forEach(u=>URL.revokeObjectURL(u));urls=[];
    const b=(s.bijlagen||{}).trace_geo;let img='';if(b){const u=URL.createObjectURL(b);urls.push(u);img=`<img src="${u}" alt="">`;}
    const n=s.kaartTrace?(s.kaartTrace.lijnen||[]).length+(s.kaartTrace.kruizen||[]).length:0;
    return `<button class="plv${b?'':' mist'}" id="plVak" aria-label="${b?'Kaart met tracé bewerken':'Kaart met tracé importeren'}"><span class="pli">${window.Gegevens&&Gegevens.sig?Gegevens.sig(!!(s.afgerond||{}).kaart):kaartIc}</span><span class="plt"><b>${b?'Kaart met tracé':'Kaart met tracé importeren'}</b><small>${b?(n?'Tracé ingetekend · tik om te bewerken':'Tik om het tracé in te tekenen'):'Verplicht · foto of pdf van de kaart, daarna het tracé intekenen'}</small></span>${img}<span class="plp">${pijl}</span></button>`;}
  function bind(el,s,klaar){const b=el.querySelector('#plVak');if(!b)return;
    b.onclick=()=>open(s,klaar,{afrond:true});}

  /* bestand kiezen: synchroon in de tik (iOS) */
  function kies(){return new Promise((res,rej)=>{const i=document.createElement('input');i.type='file';i.accept='image/*,application/pdf,.pdf';i.style.display='none';
    document.body.appendChild(i);i.onchange=()=>{const f=i.files&&i.files[0];i.remove();f?res(f):rej(new Error('geen bestand'));};i.click();});}
  function importeer(s,klaar,o){kies().then(async f=>{
      let blob;try{blob=await naarBeeld(f);}catch(e){melding('Dit bestand kon niet gelezen worden');return;}
      const im=await laadImg(blob);
      s.kaartTrace={orig:blob,w:im.naturalWidth,h:im.naturalHeight,lijnen:[],kruizen:[]};
      s.bijlagen={...(s.bijlagen||{}),trace_geo:blob};
      if(window.Velden&&Velden.waarde(s,'trace_geo')==='nvt')Velden.zet(s,'trace_geo','');
      await Store.surveys.put(s);editor(s,klaar,o);}).catch(()=>{});}
  function melding(t){const e=document.getElementById('stoast');if(e){e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2500);}else alert(t);}

  /* foto verkleinen, pdf: eerste pagina renderen */
  async function naarBeeld(f){
    const pdf=/pdf/i.test(f.type)||/\.pdf$/i.test(f.name);let cv;
    if(pdf){const lib=await Paf.pdfLib(),doc=await lib.getDocument({data:new Uint8Array(await f.arrayBuffer()),isEvalSupported:false}).promise;
      const pg=await doc.getPage(1),v1=pg.getViewport({scale:1}),sc=Math.min(4,MAX/Math.max(v1.width,v1.height)),vp=pg.getViewport({scale:sc});
      cv=document.createElement('canvas');cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);
      await pg.render({canvasContext:g,viewport:vp}).promise;}
    else{const im=await laadImg(f),k=Math.min(1,MAX/Math.max(im.naturalWidth,im.naturalHeight));
      cv=document.createElement('canvas');cv.width=Math.round(im.naturalWidth*k);cv.height=Math.round(im.naturalHeight*k);const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);g.drawImage(im,0,0,cv.width,cv.height);}
    return new Promise(r=>cv.toBlob(r,'image/jpeg',.9));}
  function laadImg(b){return new Promise((res,rej)=>{const u=URL.createObjectURL(b),im=new Image();im.onload=()=>{res(im);setTimeout(()=>URL.revokeObjectURL(u),0);};im.onerror=rej;im.src=u;});}

  /* maten afhankelijk van de beeldgrootte */
  const maat=(w,h)=>{const b=Math.max(w,h)/170;return {lw:b,dash:[b*3,b*2],kr:b*4.5};};
  function svgTek(P){const {lw,dash,kr}=maat(P.w,P.h);let o='';
    const pts=l=>l.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
    (P.lijnen||[]).forEach(l=>{if(l.length<2)return;
      o+=`<polyline points="${pts(l)}" fill="none" stroke="${WIT}" stroke-width="${lw*1.9}" stroke-dasharray="${dash.join(' ')}" stroke-linejoin="round"/>`;
      o+=`<polyline points="${pts(l)}" fill="none" stroke="${ROOD}" stroke-width="${lw}" stroke-dasharray="${dash.join(' ')}" stroke-linejoin="round"/>`;});
    (P.kruizen||[]).forEach(([x,y])=>{const d=`M${x-kr} ${y-kr}L${x+kr} ${y+kr}M${x+kr} ${y-kr}L${x-kr} ${y+kr}`;
      o+=`<path d="${d}" stroke="${WIT}" stroke-width="${lw*2.6}" stroke-linecap="round"/><path d="${d}" stroke="${ROOD}" stroke-width="${lw*1.5}" stroke-linecap="round"/>`;});
    return o;}
  async function samenstellen(P){const im=await laadImg(P.orig),cv=document.createElement('canvas');cv.width=P.w;cv.height=P.h;const g=cv.getContext('2d');
    g.drawImage(im,0,0,P.w,P.h);const {lw,dash,kr}=maat(P.w,P.h);g.lineJoin='round';
    const lijn=(l,kleur,w)=>{g.beginPath();l.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.strokeStyle=kleur;g.lineWidth=w;g.setLineDash(dash);g.lineCap='butt';g.stroke();};
    (P.lijnen||[]).forEach(l=>{if(l.length>1){lijn(l,WIT,lw*1.9);lijn(l,ROOD,lw);}});
    g.setLineDash([]);g.lineCap='round';
    (P.kruizen||[]).forEach(([x,y])=>{[[WIT,lw*2.6],[ROOD,lw*1.5]].forEach(([c,w])=>{g.beginPath();g.moveTo(x-kr,y-kr);g.lineTo(x+kr,y+kr);g.moveTo(x+kr,y-kr);g.lineTo(x-kr,y+kr);g.strokeStyle=c;g.lineWidth=w;g.stroke();});});
    return new Promise(r=>cv.toBlob(r,'image/jpeg',.88));}
  /* lijn vereenvoudigen (Ramer-Douglas-Peucker) */
  function rdp(P,eps){if(P.length<3)return P;let d=0,i0=0;const [a,b]=[P[0],P[P.length-1]],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;
    for(let i=1;i<P.length-1;i++){const e=Math.abs(dy*P[i][0]-dx*P[i][1]+b[0]*a[1]-b[1]*a[0])/L;if(e>d){d=e;i0=i;}}
    return d>eps?rdp(P.slice(0,i0+1),eps).slice(0,-1).concat(rdp(P.slice(i0),eps)):[a,b];}

  /* ---------- bewerken ---------- */
  async function editor(s,klaar,o={}){css();o=o||{};
    if(!s.kaartTrace||!s.kaartTrace.orig){const b=s.bijlagen.trace_geo,im=await laadImg(b);s.kaartTrace={orig:b,w:im.naturalWidth,h:im.naturalHeight,lijnen:[],kruizen:[]};}
    const P={...s.kaartTrace,lijnen:(s.kaartTrace.lijnen||[]).map(l=>l.slice()),kruizen:(s.kaartTrace.kruizen||[]).slice()};
    const hist=[];const snap=()=>hist.push(JSON.stringify({l:P.lijnen,k:P.kruizen}));
    const u=URL.createObjectURL(P.orig);let modus='lijn',gewijzigd=false;
    const d=document.createElement('div');d.className='ple';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Kaart met tracé bewerken');
    d.innerHTML=`<div class="plh"><button class="plk" id="plX">Annuleren</button><b>Kaart met tracé</b><button class="plk" id="plM" aria-label="Meer">•••</button><button class="plk pri" id="plOk">${o.afrond?'Afgerond':'Klaar'}</button></div>
      <div class="plv2" id="plV"><div class="plw" id="plW" style="width:${P.w}px;height:${P.h}px"><img src="${u}" alt="Kaart" draggable="false"><svg viewBox="0 0 ${P.w} ${P.h}" id="plS"></svg></div></div>
      <div class="plb"><div class="plseg" role="group" aria-label="Gereedschap"><button data-m="lijn" aria-pressed="true"><svg width="22" height="10" viewBox="0 0 22 10"><path d="M1 5h20" stroke="currentColor" stroke-width="3" stroke-dasharray="5 3"/></svg>Lijn</button><button data-m="kruis" aria-pressed="false"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>Kruis</button></div>
        <span class="plsp"></span><button class="plk pri" id="plAf" hidden>✓ Lijn af</button><button class="plk" id="plU" aria-label="Ongedaan maken">↶ Terug</button>
        <p class="plhint" id="plH">Tik punt voor punt: elke tik is een hoek, de lijn ertussen is recht. Schuif je vinger om het punt precies te zetten. Klaar met ✓ Lijn af of tik nog eens op het laatste punt.</p></div>`;
    document.body.appendChild(d);
    history.pushState({...(history.state||{}),pg:1},'');
    const V=d.querySelector('#plV'),W=d.querySelector('#plW'),S=d.querySelector('#plS');
    let bezig=null,voor=null; // bezig: hoekpunten van de lijn in wording, voor: het punt onder de vinger
    const teken=()=>{const L=bezig?bezig.concat(voor?[voor]:[]):null;
      let o=svgTek({...P,lijnen:L&&L.length>1?P.lijnen.concat([L]):P.lijnen});
      const r=Math.max(P.w,P.h)/260/Math.max(z,.05)*2.2;
      if(L)L.forEach((q,i)=>{o+=`<circle cx="${q[0]}" cy="${q[1]}" r="${(i===L.length-1&&voor?1.4:1)*r}" fill="#fff" stroke="${ROOD}" stroke-width="${r*.5}"/>`;});
      S.innerHTML=o;d.querySelector('#plU').disabled=!hist.length&&!bezig;d.querySelector('#plAf').hidden=!bezig;};
    /* recht trekken: binnen 8 graden van horizontaal, verticaal of 45 graden klikt de lijn vast */
    const vast=p=>{if(!bezig||!bezig.length)return p;const q=bezig[bezig.length-1],dx=p[0]-q[0],dy=p[1]-q[1],L=Math.hypot(dx,dy);if(!L)return p;
      const h=Math.atan2(dy,dx),st=Math.PI/4,n=Math.round(h/st)*st;return Math.abs(h-n)<8*Math.PI/180?[q[0]+Math.cos(n)*L,q[1]+Math.sin(n)*L]:p;};
    const rond=p=>[Math.round(p[0]*10)/10,Math.round(p[1]*10)/10];
    const lijnAf=()=>{if(!bezig)return;if(bezig.length>1){snap();P.lijnen.push(bezig.map(rond));gewijzigd=true;}bezig=null;voor=null;teken();};
    // passend in beeld
    let z=1,tx=0,ty=0;const zet=()=>{W.style.transform=`translate(${tx}px,${ty}px) scale(${z})`;if(typeof teken==='function'&&bezig)teken();};
    const pas=()=>{const r=V.getBoundingClientRect();z=Math.min(r.width/P.w,r.height/P.h);tx=(r.width-P.w*z)/2;ty=(r.height-P.h*z)/2;zet();};
    pas();teken();
    const naarBeeld=(cx,cy)=>{const r=V.getBoundingClientRect();return [(cx-r.left-tx)/z,(cy-r.top-ty)/z];};
    const pt=new Map();let lijn=null,pinch=null,tik=null;
    V.addEventListener('pointerdown',e=>{V.setPointerCapture(e.pointerId);pt.set(e.pointerId,[e.clientX,e.clientY]);
      if(pt.size===2){voor=null;tik=null;teken();const [a,b]=[...pt.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),m:[(a[0]+b[0])/2,(a[1]+b[1])/2],z,tx,ty};return;}
      if(pt.size>2)return;
      tik=[e.clientX,e.clientY];if(modus==='lijn'){voor=vast(naarBeeld(e.clientX,e.clientY));teken();}});
    V.addEventListener('pointermove',e=>{if(!pt.has(e.pointerId))return;pt.set(e.pointerId,[e.clientX,e.clientY]);
      if(pinch&&pt.size===2){const [a,b]=[...pt.values()],dd=Math.hypot(a[0]-b[0],a[1]-b[1]),m=[(a[0]+b[0])/2,(a[1]+b[1])/2],r=V.getBoundingClientRect();
        const nz=Math.max(.2,Math.min(12,pinch.z*dd/pinch.d)),bx=(pinch.m[0]-r.left-pinch.tx)/pinch.z,by=(pinch.m[1]-r.top-pinch.ty)/pinch.z;
        z=nz;tx=m[0]-r.left-bx*z;ty=m[1]-r.top-by*z;zet();return;}
      if(modus==='lijn'&&voor&&pt.size===1){voor=vast(naarBeeld(e.clientX,e.clientY));teken();}});
    const op=e=>{if(!pt.has(e.pointerId))return;pt.delete(e.pointerId);
      if(pinch){if(pt.size<2)pinch=null;return;}
      if(modus==='lijn'){if(voor&&e.type==='pointerup'){const q=bezig&&bezig[bezig.length-1];
          if(q&&Math.hypot(voor[0]-q[0],voor[1]-q[1])*z<14)lijnAf(); // nog eens op het laatste punt: lijn af
          else{bezig=(bezig||[]).concat([voor]);gewijzigd=true;}}
        voor=null;tik=null;teken();return;}
      else if(tik&&e.type==='pointerup'&&Math.hypot(e.clientX-tik[0],e.clientY-tik[1])<10){snap();P.kruizen.push(naarBeeld(e.clientX,e.clientY).map(v=>Math.round(v)));gewijzigd=true;teken();}
      tik=null;};
    V.addEventListener('pointerup',op);V.addEventListener('pointercancel',op);
    V.addEventListener('wheel',e=>{e.preventDefault();const r=V.getBoundingClientRect(),k=e.deltaY<0?1.15:1/1.15,bx=(e.clientX-r.left-tx)/z,by=(e.clientY-r.top-ty)/z;
      z=Math.max(.2,Math.min(12,z*k));tx=e.clientX-r.left-bx*z;ty=e.clientY-r.top-by*z;zet();},{passive:false});
    d.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{lijnAf();modus=b.dataset.m;d.querySelectorAll('[data-m]').forEach(x=>x.setAttribute('aria-pressed',x===b));
      d.querySelector('#plH').textContent=modus==='lijn'?'Tik punt voor punt: elke tik is een hoek, de lijn ertussen is recht. Schuif je vinger om het punt precies te zetten. Klaar met ✓ Lijn af of tik nog eens op het laatste punt.':'Tik op het oude tracé om een rood kruis te zetten. Met twee vingers zoom en schuif je.';});
    d.querySelector('#plAf').onclick=lijnAf;
    d.querySelector('#plU').onclick=()=>{if(bezig){bezig.pop();if(!bezig.length)bezig=null;teken();return;}if(!hist.length)return;const h=JSON.parse(hist.pop());P.lijnen=h.l;P.kruizen=h.k;gewijzigd=true;teken();};
    let dicht=false;
    const sluit=(viaTerug)=>{if(dicht)return;dicht=true;removeEventListener('popstate',pop);URL.revokeObjectURL(u);d.remove();if(!viaTerug&&history.state&&history.state.pg)history.back();};
    const pop=()=>{if(gewijzigd&&!confirm('Wijzigingen in de kaart weggooien?')){history.pushState({...(history.state||{}),pg:1},'');return;}sluit(true);};
    addEventListener('popstate',pop);
    d.querySelector('#plX').onclick=()=>{if(gewijzigd&&!confirm('Wijzigingen in de kaart weggooien?'))return;sluit(false);};
    d.querySelector('#plOk').onclick=async()=>{lijnAf();const b=d.querySelector('#plOk');b.disabled=true;b.textContent='Opslaan…';
      lijnAf();s.kaartTrace={orig:P.orig,w:P.w,h:P.h,lijnen:P.lijnen,kruizen:P.kruizen};if(o.afrond)s.afgerond={...(s.afgerond||{}),kaart:true};
      s.bijlagen={...(s.bijlagen||{}),trace_geo:await samenstellen(s.kaartTrace)};
      if(window.Velden&&Velden.waarde(s,'trace_geo')==='nvt')Velden.zet(s,'trace_geo','');
      await Store.surveys.put(s);sluit(false);if(klaar)klaar();};
    d.querySelector('#plM').onclick=()=>{const m=document.createElement('div');m.className='plm';
      m.innerHTML=`<div><button class="plk" data-a="pas">Passend in beeld</button><button class="plk" data-a="wis">Alle lijnen en kruizen wissen</button><button class="plk" data-a="nw">Andere kaart kiezen</button><button class="plk rood" data-a="weg">Kaart verwijderen</button><button class="plk" data-a="x">Sluiten</button></div>`;
      d.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove();};
      m.querySelectorAll('[data-a]').forEach(b=>b.onclick=async()=>{const a=b.dataset.a;m.remove();
        if(a==='pas')pas();
        else if(a==='wis'){bezig=null;if(!P.lijnen.length&&!P.kruizen.length)return;snap();P.lijnen=[];P.kruizen=[];gewijzigd=true;teken();}
        else if(a==='nw'){kies().then(async f=>{let blob;try{blob=await naarBeeld(f);}catch(e){melding('Dit bestand kon niet gelezen worden');return;}
            const im=await laadImg(blob);s.kaartTrace={orig:blob,w:im.naturalWidth,h:im.naturalHeight,lijnen:[],kruizen:[]};
            s.bijlagen={...(s.bijlagen||{}),trace_geo:blob};await Store.surveys.put(s);gewijzigd=false;sluit(false);setTimeout(()=>editor(s,klaar),50);}).catch(()=>{});}
        else if(a==='weg'){if(!confirm('Kaart en tekening verwijderen?'))return;delete s.kaartTrace;const bl={...(s.bijlagen||{})};delete bl.trace_geo;s.bijlagen=bl;
          await Store.surveys.put(s);gewijzigd=false;sluit(false);if(klaar)klaar();}});};
  }
    /* vanuit het document of het gegevensscherm: bewerken als er een kaart is, anders importeren (synchroon in de tik) */
  function open(s,klaar,o){migreer(s);if(heeft(s))editor(s,klaar,o);else importeer(s,klaar,o);}
  window.KaartTrace={html,bind,editor,importeer,heeft,open,migreer};
})();
