/* Zoofi online: schouwen en foto's synchroniseren met Supabase (gedeelde werklijst per bedrijf).
   Werkt alleen als je bent ingelogd en een bedrijf hebt (Instellingen -> Account en bedrijf).
   - Een nieuwe schouw krijgt het actieve bedrijf mee (s.bedrijf). Oude schouwen zonder bedrijf blijven alleen op dit toestel.
   - De werklijst toont schouwen van het actieve bedrijf plus je eigen oude (lokale) schouwen.
   - Offline werken blijft gewoon: alles staat eerst lokaal (IndexedDB 'sisu'); zodra er verbinding is gaat het heen en weer.
   - Wijzigingen herkennen we aan een vingerafdruk per record (ook als een ander scherm iets heeft bewaard).
   - Plaatjes gaan naar de opslag 'fotos' op pad bedrijf/schouw/<inhoud-hash>.<ext>; in de tabel staat dan {__pad,type,size}.
   - Tegelijk dezelfde schouw bewerken op twee toestellen: de laatste die bewaart, wint.
   Lokale sleutels: 'sisu.sync' (vingerafdrukken, wachtrij verwijderen, tijdstempels), 'sisu.bedrijf.naam'. */
(function(){
  if(!window.Store||!window.Online||!Online.beschikbaar){window.Sync={aan:false,staat:()=>null};return;}
  const S=Store,db=Online.db,U=S.surveys,P=S.photos;
  const raw={uPut:U.put,uGet:U.get,uDel:U.del,uList:U.list,pPut:P.put,pGet:P.get,pDel:P.del,pBy:P.bySurvey};
  const ls={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
  let st=ls.get('sisu.sync',null);if(!st||typeof st!=='object')st={};st.fp=st.fp||{};st.weg=st.weg||[];st.tijd=st.tijd||{};
  const bewaarSt=()=>ls.set('sisu.sync',st);
  let actief=null,sessie=false;
  try{actief=localStorage.getItem('sisu.bedrijf')||null;sessie=!!localStorage.getItem('sisu.auth');}catch(e){}
  if(!sessie)actief=null;
  const info={aan:!!actief,bezig:false,fout:'',laatst:null,wacht:0,naam:null};
  const nm=ls.get('sisu.bedrijf.naam',null);if(nm&&nm.id===actief)info.naam=nm.naam;;

  /* ---------- vingerafdruk: vaste volgorde van sleutels, plaatjes als grootte+type ---------- */
  const isPad=v=>v&&typeof v==='object'&&typeof v.__pad==='string';
  function stabiel(v,d=0){
    if(v instanceof Blob)return '"b:'+v.size+':'+(v.type||'')+'"';
    if(isPad(v))return '"b:'+(v.size||0)+':'+(v.type||'')+'"';
    if(v===null||typeof v!=='object')return v===undefined?undefined:JSON.stringify(v);
    if(d>12)return '"…"';
    if(Array.isArray(v))return '['+v.map(x=>{const s=stabiel(x,d+1);return s===undefined?'null':s;}).join(',')+']';
    return '{'+Object.keys(v).sort().map(k=>{const s=stabiel(v[k],d+1);return s===undefined?null:JSON.stringify(k)+':'+s;}).filter(Boolean).join(',')+'}';}
  function fp(o){const s=stabiel(o)||'';let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(36)+'.'+s.length.toString(36);}

  /* ---------- plaatjes heen en terug ---------- */
  async function hash(blob){const b=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());return [...new Uint8Array(b)].slice(0,16).map(x=>x.toString(16).padStart(2,'0')).join('');}
  const ext=t=>/png/.test(t)?'png':/pdf/.test(t)?'pdf':/svg/.test(t)?'svg':'jpg';
  async function upload(blob,map){
    const t=blob.type||'image/jpeg',pad=map+'/'+(await hash(blob))+'.'+ext(t);
    const {error}=await db.storage.from('fotos').upload(pad,blob,{contentType:t,upsert:false});
    if(error&&!/exist|duplicate|409/i.test(error.message+' '+(error.statusCode||'')))throw error;
    return {__pad:pad,type:t,size:blob.size};}
  async function ser(v,map,d=0){
    if(v instanceof Blob)return upload(v,map);
    if(v===null||typeof v!=='object'||d>12)return v;
    if(Array.isArray(v)){const a=[];for(const x of v)a.push(await ser(x,map,d+1));return a;}
    const o={};for(const k of Object.keys(v))if(v[k]!==undefined)o[k]=await ser(v[k],map,d+1);return o;}
  async function deser(v,d=0){
    if(isPad(v)){const {data,error}=await db.storage.from('fotos').download(v.__pad);if(error)throw error;return data.type?data:new Blob([data],{type:v.type||'image/jpeg'});}
    if(v===null||typeof v!=='object'||d>12)return v;
    if(Array.isArray(v)){const a=[];for(const x of v)a.push(await deser(x,d+1));return a;}
    const o={};for(const k of Object.keys(v))o[k]=await deser(v[k],d+1);return o;}

  /* ---------- Store aanvullen: bedrijf meegeven, verwijderen onthouden, lijst per bedrijf ---------- */
  const uitWeg=id=>{const n=st.weg.length;st.weg=st.weg.filter(w=>w.id!==id);if(st.weg.length!==n)bewaarSt();};
  U.put=async v=>{
    if(actief&&v&&!v.bedrijf){const oud=v.id?await raw.uGet(v.id):null;
      if(!oud)v={...v,bedrijf:actief};else if(oud.bedrijf)v={...v,bedrijf:oud.bedrijf};}
    const r=await raw.uPut(v);if(r&&r.id)uitWeg(r.id);plan();return r;};
  U.del=async id=>{const oud=await raw.uGet(id);await raw.uDel(id);
    if(oud&&oud.bedrijf){st.weg.push({t:'s',id,b:oud.bedrijf});delete st.fp[id];bewaarSt();plan();}};
  U.list=async()=>{const a=await raw.uList();return actief?a.filter(s=>!s.bedrijf||s.bedrijf===actief):a;};
  P.put=async v=>{const r=await raw.pPut(v);if(r&&r.id)uitWeg(r.id);plan();return r;};
  P.del=async id=>{const p=await raw.pGet(id);await raw.pDel(id);
    const s=p&&await raw.uGet(p.surveyId);if(s&&s.bedrijf){st.weg.push({t:'f',id,b:s.bedrijf});delete st.fp['p:'+id];bewaarSt();plan();}};

  /* ---------- status voor het scherm ---------- */
  const fmtT=d=>d?new Date(d).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'';
  function teken(){const el=document.getElementById('ssync');if(!el)return;
    if(!info.aan){el.hidden=true;return;}el.hidden=false;
    let t,k='';
    if(info.bezig){t='Bijwerken…';k='bezig';}
    else if(info.fout==='offline'){t=info.wacht?`Offline · ${info.wacht} wacht${info.wacht===1?'':'en'}`:'Offline';k='uit';}
    else if(info.fout){t='Bijwerken lukte niet';k='fout';}
    else{t=(info.naam?info.naam+' · ':'')+(info.laatst?'bijgewerkt '+fmtT(info.laatst):'online');k='ok';}
    el.className='ssync '+k;el.textContent=t;el.title=info.fout&&info.fout!=='offline'?info.fout:'Tik om nu bij te werken';
    el.onclick=()=>nu(true);}
  const zet=o=>{Object.assign(info,o);teken();document.dispatchEvent(new CustomEvent('sisu-sync',{detail:{...info}}));};

  /* ---------- de ronde: eerst eigen wijzigingen weg, dan nieuwe van collega's ophalen ---------- */
  const offline=e=>/Failed to fetch|NetworkError|Load failed|network|fetch/i.test(String(e&&(e.message||e)));
  async function scan(){ // welke lokale records wijken af van wat online staat?
    const uit=[];
    for(const s of await raw.uList()){if(s.bedrijf!==actief)continue;
      const f=fp(s);if(st.fp[s.id]!==f)uit.push({t:'s',o:s,f});
      for(const p of await raw.pBy(s.id,true)){const g=fp(p);if(st.fp['p:'+p.id]!==g)uit.push({t:'f',o:p,f:g,b:s.bedrijf});}}
    return uit;}
  async function duw(lijst){
    for(const x of lijst){const o=x.o;
      if(x.t==='s'){const data=await ser(o,actief+'/'+o.id);
        const {error}=await db.from('schouwen').upsert({id:o.id,bedrijf_id:actief,data,verwijderd:false});if(error)throw error;st.fp[o.id]=x.f;}
      else{const data=await ser(o,actief+'/'+o.surveyId);
        const {error}=await db.from('fotos').upsert({id:o.id,schouw_id:o.surveyId,bedrijf_id:actief,data,verwijderd:false});if(error)throw error;st.fp['p:'+o.id]=x.f;}
      bewaarSt();}
    for(const w of [...st.weg]){if(w.b!==actief)continue;
      if(w.t==='s'){let r=await db.from('schouwen').update({verwijderd:true}).eq('id',w.id);if(r.error)throw r.error;
        r=await db.from('fotos').update({verwijderd:true}).eq('schouw_id',w.id);if(r.error)throw r.error;}
      else{const r=await db.from('fotos').update({verwijderd:true}).eq('id',w.id);if(r.error)throw r.error;}
      st.weg=st.weg.filter(x=>x!==w);bewaarSt();}}
  async function haal(tabel){ // alles sinds de vorige keer (met een minuut overlap), per 200
    const sleutel=actief+':'+tabel;let nieuw=0;
    for(let ronde=0;ronde<50;ronde++){
      const sinds=st.tijd[sleutel];
      let q=db.from(tabel).select('id,data,verwijderd,bijgewerkt').eq('bedrijf_id',actief).order('bijgewerkt').limit(200);
      if(sinds)q=q.gt('bijgewerkt',new Date(new Date(sinds).getTime()-60000).toISOString());else q=q.eq('verwijderd',false);
      const {data,error}=await q;if(error)throw error;
      for(const r of data){
        const k=tabel==='schouwen'?r.id:'p:'+r.id,lok=tabel==='schouwen'?await raw.uGet(r.id):await raw.pGet(r.id);
        if(r.verwijderd){if(lok){tabel==='schouwen'?await raw.uDel(r.id):await raw.pDel(r.id);nieuw++;}delete st.fp[k];continue;}
        const f=fp(r.data);if(st.fp[k]===f&&lok)continue;           // hebben we al
        if(lok&&st.fp[k]&&fp(lok)!==st.fp[k])continue;              // hier ook gewijzigd: onze versie gaat de volgende ronde mee
        if(tabel==='fotos'&&!(await raw.uGet(r.data&&r.data.surveyId)))continue; // schouw bestaat hier niet (meer)
        const o=await deser(r.data);
        if(tabel==='schouwen'){o.bedrijf=actief;await raw.uPut(o);}else await raw.pPut(o);
        st.fp[k]=f;nieuw++;}
      if(data.length){const t=data[data.length-1].bijgewerkt;if(!sinds||t>sinds)st.tijd[sleutel]=t;}
      bewaarSt();
      if(data.length<200)break;}
    return nieuw;}

  let bezig=null,timer=null;
  function plan(ms=4000){if(!info.aan)return;clearTimeout(timer);timer=setTimeout(()=>nu(),ms);}
  async function nu(handmatig){
    if(bezig)return bezig;
    bezig=(async()=>{
      const {data}=await db.auth.getSession().catch(()=>({data:null}));
      sessie=!!(data&&data.session);try{actief=sessie?localStorage.getItem('sisu.bedrijf')||null:null;}catch(e){actief=null;}
      info.aan=!!actief;if(!actief){teken();return;}
      let lijst=[];
      try{lijst=await scan();}catch(e){console.warn('sync scan',e);}
      zet({bezig:true,wacht:lijst.length+st.weg.filter(w=>w.b===actief).length});
      try{
        const nm=ls.get('sisu.bedrijf.naam',null);if(!nm||nm.id!==actief||handmatig){const r=await db.from('bedrijven').select('naam').eq('id',actief).maybeSingle();if(r.data){info.naam=r.data.naam;ls.set('sisu.bedrijf.naam',{id:actief,naam:r.data.naam});}}else info.naam=nm.naam;
        await duw(lijst);
        const n=(await haal('schouwen'))+(await haal('fotos'));
        zet({bezig:false,fout:'',wacht:0,laatst:Date.now()});
        if(n)document.dispatchEvent(new CustomEvent('sisu-sync-nieuw',{detail:{aantal:n}}));
      }catch(e){console.warn('sync',e);zet({bezig:false,fout:offline(e)?'offline':(e.message||String(e))});}
    })().finally(()=>{bezig=null;});
    return bezig;}

  window.addEventListener('online',()=>plan(500));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')plan(800);});
  setInterval(()=>{if(document.visibilityState==='visible')nu();},90000);
  setTimeout(()=>nu(),1500);
  /* bij uitloggen: alles wat online staat van dit toestel halen (niet online verwijderen) */
  async function wisLokaal(){clearTimeout(timer);
    for(const s of await raw.uList())if(s.bedrijf)await raw.uDel(s.id);
    st={fp:{},weg:[],tijd:{}};bewaarSt();try{localStorage.removeItem('sisu.bedrijf.naam');}catch(e){}actief=null;info.aan=false;}
  window.Sync={aan:true,nu,teken,wisLokaal,info:()=>({...info}),staat:id=>!info.aan?null:(st.fp[id]?'ok':'wacht')};
})();
