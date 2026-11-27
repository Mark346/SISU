/* Foto's veilig bewaren in Safari.
   Safari (WebKit) heeft een bekende fout: een plaatje (Blob) dat uit IndexedDB is gelezen en daarna opnieuw
   wordt opgeslagen, raakt soms beschadigd (WebKit bug 235687 / 240216). Je ziet dan een vraagteken in plaats
   van de foto, of opslaan mislukt met "Error preparing Blob/File data".
   Oplossing: plaatjes niet als Blob in de opslag zetten, maar als losse bytes (ArrayBuffer). Bij het lezen
   maakt deze laag er weer een gewone Blob van, dus de rest van de app merkt er niets van.
   Bestaande foto's worden eenmalig omgezet (zolang ze nog leesbaar zijn). store.js zelf blijft ongewijzigd. */
(function(){
  if(!window.Store)return;
  const S=window.Store,isBin=v=>v&&typeof v==='object'&&v.__bin instanceof ArrayBuffer;
  // Blob -> {__bin,type}; lukt lezen niet (al beschadigd), dan blijft de oude waarde staan
  async function enc(v,d=0){
    if(v instanceof Blob){try{return {__bin:await v.arrayBuffer(),type:v.type||'image/jpeg'};}catch(e){return v;}}
    if(d>4||!v||typeof v!=='object'||isBin(v)||v instanceof ArrayBuffer||ArrayBuffer.isView(v))return v;
    if(Array.isArray(v)){const a=[];for(const x of v)a.push(await enc(x,d+1));return a;}
    const o={};for(const k of Object.keys(v))o[k]=await enc(v[k],d+1);return o;}
  function dec(v,d=0){
    if(isBin(v))return new Blob([v.__bin],{type:v.type||'image/jpeg'});
    if(d>4||!v||typeof v!=='object'||v instanceof Blob||v instanceof ArrayBuffer||ArrayBuffer.isView(v))return v;
    if(Array.isArray(v))return v.map(x=>dec(x,d+1));
    const o={};for(const k of Object.keys(v))o[k]=dec(v[k],d+1);return o;}
  const decAll=a=>Array.isArray(a)?a.map(x=>dec(x)):dec(a);
  const P=S.photos,U=S.surveys;
  const p0={put:P.put,get:P.get,bySurvey:P.bySurvey},u0={put:U.put,get:U.get,list:U.list};
  P.put=async v=>dec(await p0.put(await enc(v)));
  P.get=async id=>dec(await p0.get(id));
  P.bySurvey=async(id,m)=>decAll(await p0.bySurvey(id,m));
  U.put=async v=>dec(await u0.put(await enc(v)));
  U.get=async id=>dec(await u0.get(id));
  U.list=async()=>decAll(await u0.list());
  U.lastOpen=async()=>(await U.list()).find(s=>s.status!=='klaar'&&s.status!=='archief')||null;
  S.blobVeilig=true;
  /* eenmalig: bestaande plaatjes omzetten naar bytes, op de achtergrond */
  async function omzetten(){
    try{if(localStorage.getItem('sisu.bin.v1'))return;}catch(e){return;}
    const heeftBlob=v=>{if(v instanceof Blob)return true;if(!v||typeof v!=='object'||isBin(v))return false;return Object.values(v).some(heeftBlob);};
    try{
      for(const s of await u0.list()){
        if(heeftBlob(s))await u0.put(await enc(s));
        for(const p of await p0.bySurvey(s.id,true))if(heeftBlob(p))await p0.put(await enc(p));
      }
      localStorage.setItem('sisu.bin.v1','1');
    }catch(e){console.warn('omzetten foto-opslag',e);}
  }
  setTimeout(omzetten,1500);
})();
