// Bewaart de app zelf, zodat hij ook werkt met slecht bereik. Projecten en foto's staan los hiervan in de opslag van de browser.
// Bekeken stukken luchtfoto en kaart (PDOK) worden ook bewaard, zodat ze later zonder internet te zien zijn.
const C='schouw-v65',TILES='schouw-tiles-v1',FILES=['./','index.html','origineel.html','veeg.html','opties.html','richt.html','loop.html','manifest.webmanifest','voorbeeld-tekening.jpg','icon-192.png',
  'shared/base.css','shared/legend.js','shared/store.js','shared/camera.js','shared/sensors.js','shared/document.html','shared/editor.js','shared/survey-ui.js','shared/storyline.html','shared/pdfdoc.js','shared/velden.js','shared/gegevens.js','shared/paf.js','paf.html','shared/docmodel.js','instellingen.html','shared/versie.js','apple-touch-icon.png','favicon-32.png','icon-512.png','shared/icon-klein.svg','fonts/archivo-400.woff2','fonts/archivo-600.woff2','fonts/archivo-800.woff2'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);
  if(u.hostname==='service.pdok.nl'){e.respondWith(caches.open(TILES).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque')c.put(e.request,r.clone());return r;}))));return;}
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&u.origin===location.origin){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));}return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
