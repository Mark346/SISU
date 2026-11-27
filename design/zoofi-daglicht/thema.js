/* Zoofi – licht/donker wisselen (stijl "Daglicht").
   Onthouden in localStorage 'sisu.thema': 'donker' of 'licht'. Leeg of 'licht' = lichte stand (standaard).
   Elke knop met het attribuut data-thema-knop wisselt de stand; zo'n knop krijgt vanzelf het juiste icoon.
   Het inline-script in de <head> zet data-thema="donker" al vóór het tekenen, zodat er niets knippert. */
(function(){
  const KEY='sisu.thema',root=document.documentElement;
  const SVG=p=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const MAAN=SVG('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>');
  const ZON=SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
  const isDonker=()=>root.dataset.thema==='donker';
  function teken(b){const d=isDonker();
    if(b.getAttribute('role')==='switch'){b.setAttribute('aria-checked',d);return;}
    b.setAttribute('aria-pressed',d);b.setAttribute('aria-label','Donkere stand');b.innerHTML=d?ZON:MAAN;}
  function alle(){document.querySelectorAll('[data-thema-knop]').forEach(teken);}
  function zet(d){if(d)root.dataset.thema='donker';else delete root.dataset.thema;
    try{localStorage.setItem(KEY,d?'donker':'licht');}catch(e){}alle();}
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-thema-knop]');if(b){e.preventDefault();zet(!isDonker());}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',alle);else alle();
  window.Thema={isDonker,zet,wissel:()=>zet(!isDonker())};
})();
