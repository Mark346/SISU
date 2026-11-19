// Bewaart de app zelf, zodat hij ook werkt met slecht bereik. Projecten en foto's staan los hiervan in de opslag van de browser.
const C='schouw-v6',FILES=['./','index.html','manifest.webmanifest','voorbeeld-tekening.jpg','icon-192.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));}return r;}).catch(()=>caches.match(e.request)));});
