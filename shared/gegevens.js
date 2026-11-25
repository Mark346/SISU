/* Formulier met de gegevens van een schouw, op basis van de instellingen (shared/velden.js).
   Gegevens.open(survey, 'intake'|'alles', {onClose, onChange})
   intake = alleen velden die bij de input gevraagd worden; alles = ook wat het document nodig heeft.
   Vereist store.js, velden.js en (voor foto's) camera.js. */
(function(){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const CSS=`
.geg{position:fixed;inset:0;z-index:55;background:var(--bg,#0d0f12);color:var(--ink,#f5f6f7);display:flex;flex-direction:column}
.geg .gh{flex:none;display:flex;align-items:center;gap:8px;padding:calc(4px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) 6px calc(6px + env(safe-area-inset-left));border-bottom:1px solid var(--line,#33383f)}
.geg .gh h2{flex:1;margin:0;font-size:18px}
.geg .gp{font-weight:800;font-size:15px;white-space:nowrap}
.geg .gb{flex:1;overflow-y:auto;padding:8px calc(14px + env(safe-area-inset-right)) calc(30px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left))}
.geg .bar2{height:8px;border-radius:4px;background:#2a2e35;overflow:hidden;margin:8px 0 4px}.geg .bar2 i{display:block;height:100%;background:#FF7A1A}
.geg h3{font-size:19px;margin:22px 0 8px}
.geg .fr{background:var(--card,#181b20);border:2px solid var(--line,#33383f);border-radius:14px;padding:10px 12px;margin-bottom:8px}
.geg .fr.mist{border-color:#FF7A1A}
.geg .fl{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px;margin-bottom:6px}
.geg .fl span:first-child{flex:1}.geg .fl .bd{flex:none}
.geg .bd{font-size:12px;font-weight:800;padding:2px 8px;border-radius:20px;text-transform:lowercase}
.geg .bd.verplicht{background:#FF7A1A;color:#141414}.geg .bd.wenselijk{background:#2563eb;color:#fff}
.geg input,.geg textarea{width:100%;min-height:48px;border-radius:12px;border:2px solid #3c434c;background:#0d0f12;color:inherit;padding:0 12px;font-size:16px}
.geg textarea{min-height:84px;padding:10px 12px;line-height:1.4;resize:vertical}
.geg .ch{display:flex;flex-wrap:wrap;gap:6px}
.geg .ch button{min-height:44px;padding:0 14px;border-radius:99px;border:2px solid #3c434c;background:#0d0f12;color:inherit;font-size:16px;font-weight:700;cursor:pointer}
.geg .ch button.on{background:#FF7A1A;border-color:#FF7A1A;color:#141414}
.geg .ft{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.geg .ft img{width:120px;height:90px;object-fit:cover;border-radius:10px;border:1px solid #444}
.geg .ft .btn{min-height:44px}
.geg .info{color:var(--mute,#b9bec6);font-size:15px}
.geg .vgg{margin:10px 0 4px;font-weight:800;color:var(--mute,#b9bec6)}
.geg .vgr{border-top:1px solid #2a2e35;padding:8px 0}
.geg .vgr label{display:flex;gap:10px;align-items:center;min-height:44px;font-size:16px}
.geg .vgr input[type=checkbox]{width:24px;height:24px;min-height:0;accent-color:#FF7A1A}
.geg .vgr .vx{display:grid;gap:6px;margin:4px 0 4px 34px}
.geg .vgr .vx input{min-height:44px;font-size:15px}
.geg .ok{display:flex;gap:10px;align-items:center;min-height:48px;font-weight:800;margin-top:10px}
.geg .ok input{width:26px;height:26px;min-height:0;accent-color:#16a34a}`;
  function css(){if(document.getElementById('gegcss'))return;const s=document.createElement('style');s.id='gegcss';s.textContent=CSS;document.head.appendChild(s);}
  let st=null;
  async function open(survey,mode,opts={}){
    css();close(true);
    const fotos=await Store.photos.bySurvey(survey.id,true);
    const root=document.createElement('div');root.className='geg';root.setAttribute('role','dialog');document.body.appendChild(root);
    st={s:survey,mode,opts,root,fotos,urls:[]};render();
  }
  function close(silent){if(!st)return;st.urls.forEach(u=>URL.revokeObjectURL(u));st.root.remove();const o=st.opts;st=null;if(!silent&&o.onClose)o.onClose();}
  let svT=null;
  function save(now){clearTimeout(svT);const go=async()=>{if(!st)return;const me=st;await Store.surveys.put(me.s);if(st===me)head();if(me.opts.onChange)me.opts.onChange(me.s);};if(now)return go();svT=setTimeout(go,350);}
  const kant=()=>st.mode==='intake'?'in':'uit';
  function zichtbaar(f,c){if(['teller','fotos','legenda'].includes(f.t))return false;
    if(!Velden.actief(st.s,f))return false;
    return st.mode==='intake'?c[f.k].in!=='nee':(c[f.k].in!=='nee'||c[f.k].uit!=='nee');}
  function niveau(f,c){if(st.mode==='intake')return c[f.k].in;const a=c[f.k].in,b=c[f.k].uit;return a==='verplicht'||b==='verplicht'?'verplicht':a==='wenselijk'||b==='wenselijk'?'wenselijk':'nee';}
  function head(){if(!st)return;const v=Velden.voortgang(st.s,st.fotos,kant());const e=st.root.querySelector('.gp');if(e)e.textContent=`${v.klaar}/${v.totaal} verplicht`;
    const b=st.root.querySelector('.bar2 i');if(b)b.style.width=v.pct+'%';
    st.root.querySelectorAll('.fr[data-k]').forEach(el=>{const f=Velden.VELDEN.find(x=>x.k===el.dataset.k),c=Velden.cfg();el.classList.toggle('mist',niveau(f,c)==='verplicht'&&!Velden.gevuld(st.s,f,st.fotos));});}
  function render(){
    const c=Velden.cfg(),s=st.s,R=st.root;
    R.innerHTML=`<div class="gh"><button class="back" id="gX">‹ Klaar</button><h2>${st.mode==='intake'?'Intake':'Gegevens voor het document'}</h2><span class="gp"></span></div>
    <div class="gb"><div class="bar2"><i></i></div>
    <p class="info">${st.mode==='intake'?'Vul in wat je vóór het lopen weet. Oranje omrand = verplicht en nog leeg.':'Alles wat in het document komt. Oranje omrand = verplicht en nog leeg.'} Je kunt dit later altijd aanvullen.</p>
    ${Velden.SECTIES.map(sc=>{const fs=Velden.VELDEN.filter(f=>f.s===sc.id&&zichtbaar(f,c));if(!fs.length)return'';
      return `<h3>${esc(sc.naam)}</h3>${fs.map(f=>row(f,niveau(f,c))).join('')}`;}).join('')}
    ${st.mode==='alles'?'<p class="info">Tellers en foto\'s vul je in het schouwscherm en de storyline.</p>':''}</div>`;
    R.querySelector('#gX').onclick=()=>{save(true);close();};
    bind();head();
  }
  function row(f,niv){
    const v=Velden.waarde(st.s,f.k),bd=niv==='nee'?'':`<span class="bd ${niv}">${niv}</span>`,id='g_'+f.k;
    let inp='';
    switch(f.t){
      case 'lang':inp=`<textarea id="${id}" data-k="${f.k}" placeholder="${esc(f.vb||'')}">${esc(v||'')}</textarea>`;break;
      case 'keuze':inp=`<div class="ch" role="group">${f.opties.map(o=>`<button data-k="${f.k}" data-v="${esc(o)}" class="${v===o?'on':''}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div>`;break;
      case 'janee':inp=`<div class="ch" role="group">${['Ja','Nee'].map(o=>`<button data-k="${f.k}" data-v="${o}" class="${v===o?'on':''}" aria-pressed="${v===o}">${o}</button>`).join('')}</div>`;break;
      case 'foto':{const b=(st.s.bijlagen||{})[f.k];let u='';if(b){u=URL.createObjectURL(b);st.urls.push(u);}
        inp=`<div class="ft">${b?`<img src="${u}" alt="${esc(f.l)}">`:''}${v==='nvt'?`<b>${esc(f.nvt||'Niet beschikbaar')}</b>`:''}
          <button class="btn" data-foto="${f.k}" data-g="0">Foto maken</button><button class="btn" data-foto="${f.k}" data-g="1">Uit galerij</button>
          ${f.nvt?`<button class="btn" data-nvt="${f.k}">${v==='nvt'?'Toch beschikbaar':'Niet beschikbaar'}</button>`:''}${b?`<button class="btn" data-weg="${f.k}">Weghalen</button>`:''}</div>`;break;}
      case 'vg':inp=vgHtml(v||{});break;
      default:{const ty={datum:'date',tel:'tel',mail:'email',getal:'number'}[f.t]||'text';
        inp=`<input id="${id}" type="${ty}" data-k="${f.k}" value="${esc(v==null?'':v)}" placeholder="${esc(f.vb?'bijv. '+f.vb:'')}"${f.t==='getal'?' inputmode="numeric"':''}${f.t==='mail'?' autocomplete="email"':''}>`;}
    }
    return `<div class="fr" data-k="${f.k}"><label class="fl" for="${id}"><span>${esc(f.l)}</span>${bd}</label>${inp}</div>`;
  }
  function vgHtml(v){const it=v.items||{};let g='',o='';
    Velden.VG.forEach(a=>{if(a.groep!==g){g=a.groep;o+=`<div class="vgg">${esc(g)}</div>`;}const x=it[a.id]||{};
      o+=`<div class="vgr"><label><input type="checkbox" data-vg="${a.id}" ${x.aan?'checked':''}>${esc(a.aspect)}</label>${x.aan?`<div class="vx">
        <input data-vgr="${a.id}" data-f="risico" placeholder="Risico's" value="${esc(x.risico!=null?x.risico:a.risico)}" aria-label="Risico's bij ${esc(a.aspect)}">
        <input data-vgr="${a.id}" data-f="afspraak" placeholder="Afspraken / randvoorwaarden" value="${esc(x.afspraak!=null?x.afspraak:a.afspraak)}" aria-label="Afspraken bij ${esc(a.aspect)}"></div>`:''}</div>`;});
    return o+`<label class="ok"><input type="checkbox" data-vgok ${v.nagelopen?'checked':''}>V&G is nagelopen</label>`;}
  function bind(){
    const R=st.root,s=st.s;
    R.querySelectorAll('input[data-k],textarea[data-k]').forEach(e=>e.oninput=()=>{Velden.zet(s,e.dataset.k,e.value);save();});
    R.querySelectorAll('.ch button').forEach(b=>b.onclick=()=>{const k=b.dataset.k,on=Velden.waarde(s,k)===b.dataset.v;Velden.zet(s,k,on?'':b.dataset.v);save(true).then(()=>render());});
    R.querySelectorAll('[data-foto]').forEach(b=>b.onclick=()=>{const k=b.dataset.foto;
      Camera.take({galerij:b.dataset.g==='1'}).then(async r=>{if(!r||!r.blob)return;s.bijlagen={...(s.bijlagen||{}),[k]:r.blob};if(Velden.waarde(s,k)==='nvt')Velden.zet(s,k,'');await save(true);render();});});
    R.querySelectorAll('[data-nvt]').forEach(b=>b.onclick=async()=>{const k=b.dataset.nvt;Velden.zet(s,k,Velden.waarde(s,k)==='nvt'?'':'nvt');await save(true);render();});
    R.querySelectorAll('[data-weg]').forEach(b=>b.onclick=async()=>{const k=b.dataset.weg;const bl={...(s.bijlagen||{})};delete bl[k];s.bijlagen=bl;await save(true);render();});
    const vg=()=>{const v=Velden.waarde(s,'vg');return v&&typeof v==='object'?{items:{},...v}:{items:{}};};
    R.querySelectorAll('[data-vg]').forEach(c=>c.onchange=async()=>{const v=vg(),a=Velden.VG.find(x=>x.id===c.dataset.vg);v.items={...v.items,[a.id]:{risico:a.risico,afspraak:a.afspraak,...(v.items[a.id]||{}),aan:c.checked}};Velden.zet(s,'vg',v);await save(true);const y=R.querySelector('.gb').scrollTop;render();R.querySelector('.gb').scrollTop=y;});
    R.querySelectorAll('[data-vgr]').forEach(e=>e.oninput=()=>{const v=vg(),id=e.dataset.vgr;v.items={...v.items,[id]:{...(v.items[id]||{}),[e.dataset.f]:e.value}};Velden.zet(s,'vg',v);save();});
    const ok=R.querySelector('[data-vgok]');if(ok)ok.onchange=()=>{const v=vg();v.nagelopen=ok.checked;Velden.zet(s,'vg',v);save(true);};
  }
  window.Gegevens={open,close:()=>close()};
})();
