/* Sensoren toestaan. Op de iPhone moet de toestemming voor kompas/kanteling en beweging
   vanuit een tik worden gevraagd. Roep Sensors.request() dus aan in een klik-handler,
   of gebruik Sensors.button(el) voor de knop "Sensoren toestaan".
   Resultaat per onderdeel: 'ok' | 'geweigerd' | 'niet beschikbaar'. */
(function(){
  async function ask(Ev){
    if(typeof Ev==='undefined')return'niet beschikbaar';
    if(typeof Ev.requestPermission!=='function')return'ok'; // Android en desktop: geen vraag nodig
    try{return (await Ev.requestPermission())==='granted'?'ok':'geweigerd';}catch(e){return'geweigerd';}
  }
  function gps(timeout=15000){
    return new Promise(res=>{
      if(!navigator.geolocation)return res({status:'niet beschikbaar'});
      navigator.geolocation.getCurrentPosition(
        p=>res({status:'ok',pos:{lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy}}),
        e=>res({status:e.code===1?'geweigerd':'niet beschikbaar'}),
        {enableHighAccuracy:true,timeout,maximumAge:0});
    });
  }
  async function request(opts={}){
    // beide vragen direct starten, zodat ze nog binnen dezelfde tik vallen
    const o=ask(window.DeviceOrientationEvent),m=ask(window.DeviceMotionEvent);
    const g=opts.gps===false?Promise.resolve({status:'niet gevraagd'}):gps();
    const [orientation,motion,gp]=await Promise.all([o,m,g]);
    const r={orientation,motion,gps:gp.status,pos:gp.pos||null};
    try{localStorage.setItem('sisu.sensors',JSON.stringify({orientation,motion,gps:gp.status,t:Date.now()}));}catch(e){}
    return r;
  }
  const NL={orientation:'Kompas en kanteling',motion:'Beweging',gps:'Locatie (gps)'};
  function summary(r){return Object.keys(NL).filter(k=>r[k]&&r[k]!=='niet gevraagd').map(k=>`${NL[k]}: ${r[k]}`).join(' · ');}
  /* Maakt van een knop de knop "Sensoren toestaan"; cb krijgt het resultaat. */
  function button(el,cb,opts){
    el.textContent='Sensoren toestaan';
    el.addEventListener('click',async()=>{el.disabled=true;const r=await request(opts);el.disabled=false;
      el.textContent=(r.orientation==='ok'&&r.motion==='ok'&&(r.gps==='ok'||r.gps==='niet gevraagd'))?'Sensoren staan aan':'Sensoren opnieuw vragen';
      if(cb)cb(r);});
  }
  window.Sensors={request,gps,summary,button};
})();
