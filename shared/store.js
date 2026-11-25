/* Gedeelde opslag voor de nieuwe varianten (IndexedDB "sisu").
   Staat los van de opslag van Origineel ("schouw"), die hier nooit wordt aangeraakt.
   surveys: { id, adres, datum, variant, status:'new'|'intake'|'gelopen'|'klaar'|'archief' (oud: 'open'), tellers:{meters,invoeringen,boringen}, velden:{}, bijlagen:{} }
   photos:  { id, surveyId, volgorde, blob, ann, bijschrift, meters, gps:{lat,lon,acc}, heading,
              status:'ok'|'vervallen', bron:'veeg'|'richt'|'loop'|'origineel' } */
(function(){
  let dbp=null;
  function db(){
    if(!dbp)dbp=new Promise((res,rej)=>{
      const r=indexedDB.open('sisu',1);
      r.onupgradeneeded=()=>{const d=r.result;
        if(!d.objectStoreNames.contains('surveys'))d.createObjectStore('surveys',{keyPath:'id'});
        if(!d.objectStoreNames.contains('photos')){const p=d.createObjectStore('photos',{keyPath:'id'});p.createIndex('surveyId','surveyId');}};
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
    });
    return dbp;
  }
  const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
  async function tx(store,mode,fn){const d=await db();const t=d.transaction(store,mode);const out=await fn(t.objectStore(store));
    await new Promise((res,rej)=>{t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);});return out;}
  const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);

  const surveys={
    list:()=>tx('surveys','readonly',s=>req(s.getAll())).then(a=>a.sort((x,y)=>(y.datum||'').localeCompare(x.datum||''))),
    get:id=>tx('surveys','readonly',s=>req(s.get(id))),
    put:v=>{const o={tellers:{meters:0,invoeringen:0,boringen:0},status:'new',...v};if(!o.id)o.id=newId();if(!o.datum)o.datum=new Date().toISOString();
      return tx('surveys','readwrite',s=>req(s.put(o))).then(()=>o);},
    del:async id=>{const ph=await photos.bySurvey(id,true);await tx('photos','readwrite',s=>Promise.all(ph.map(p=>req(s.delete(p.id)))));return tx('surveys','readwrite',s=>req(s.delete(id)));},
    /* de meest recente schouw die nog open staat, of null */
    lastOpen:async()=>(await surveys.list()).find(s=>s.status!=='klaar'&&s.status!=='archief')||null
  };
  const photos={
    bySurvey:(surveyId,metVervallen)=>tx('photos','readonly',s=>req(s.index('surveyId').getAll(surveyId)))
      .then(a=>a.filter(p=>metVervallen||p.status!=='vervallen').sort((x,y)=>(x.volgorde||0)-(y.volgorde||0))),
    get:id=>tx('photos','readonly',s=>req(s.get(id))),
    put:async v=>{const o={status:'ok',bijschrift:'',ann:null,...v};if(!o.id)o.id=newId();
      if(o.volgorde==null){const all=await photos.bySurvey(o.surveyId,true);o.volgorde=all.reduce((m,p)=>Math.max(m,p.volgorde||0),0)+1;}
      await tx('photos','readwrite',s=>req(s.put(o)));return o;},
    del:id=>tx('photos','readwrite',s=>req(s.delete(id)))
  };

  /* Verkleint een foto naar max. 1600 px lange zijde, JPEG kwaliteit 0,8. Geeft {blob,w,h} terug. */
  async function shrink(file,max=1600,q=.8){
    let src;
    if(window.createImageBitmap){try{src=await createImageBitmap(file,{imageOrientation:'from-image'});}catch(e){src=null;}}
    if(!src){const u=URL.createObjectURL(file);try{src=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u;});}finally{setTimeout(()=>URL.revokeObjectURL(u),1000);}}
    const W0=src.width||src.naturalWidth,H0=src.height||src.naturalHeight,f=Math.min(1,max/Math.max(W0,H0)),W=Math.round(W0*f),H=Math.round(H0*f);
    const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(src,0,0,W,H);
    const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',q));
    return{blob,w:W,h:H,orient:W>=H?'liggend':'staand'};
  }
  window.Store={surveys,photos,shrink,newId};
})();
