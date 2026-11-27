/* Legenda over een foto.
   Annotaties zijn data en worden niet in de foto gebrand. Eenheden lopen over de foto:
   liggend 400 x 300, staand 300 x 400. Zo blijven lijndiktes en symbolen even groot.
   ann = { orient:'liggend'|'staand', arrow:[[x,y],...], poly:{body:[[x,y],...],head:[[x,y],...]},
           buis:[[x,y],...], syms:[{t,x,y,label,s}] }   s = optionele grootte (1 = normaal) */
(function(){
  const C={green:'#2BB24C',red:'#D7261E',teal:'#0E7C86',yellow:'#F2D024',brown:'#8B2E16',label:'#C62828',letop:'#F2B705',dark:'#1a1a1a',white:'#ffffff'};
  const NS='http://www.w3.org/2000/svg';
  const FONT='-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif';
  const size=a=>a&&a.orient==='staand'?[300,400]:[400,300];
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pts=P=>P.map(p=>(+p[0]).toFixed(1)+','+(+p[1]).toFixed(1)).join(' ');

  function arrowSvg(P,k){
    if(!P||P.length<2)return'';
    const a=P[P.length-2],b=P[P.length-1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
    const HL=24*k,HW=15*k,cut=Math.min(HL*.6,L*.9);
    const Q=P.slice(0,-1).concat([[b[0]-ux*cut,b[1]-uy*cut]]);
    const base=[b[0]-ux*HL,b[1]-uy*HL],head=[[b[0],b[1]],[base[0]-uy*HW,base[1]+ux*HW],[base[0]+uy*HW,base[1]-ux*HW]];
    return `<polyline points="${pts(Q)}" fill="none" stroke="${C.green}" stroke-width="${12*k}" stroke-linecap="round" stroke-linejoin="round"/>`+
      `<polyline points="${pts(Q)}" fill="none" stroke="${C.red}" stroke-width="${6*k}" stroke-linecap="round" stroke-linejoin="round"/>`+
      `<polygon points="${pts(head)}" fill="${C.red}" stroke="${C.green}" stroke-width="${3*k}" stroke-linejoin="round"/>`;
  }
  function polySvg(p,k){
    if(!p)return'';let o='';
    for(const part of [p.body,p.head])if(part&&part.length>2)o+=`<polygon points="${pts(part)}" fill="${C.red}" stroke="${C.green}" stroke-width="${3*k}" stroke-linejoin="round"/>`;
    return o;
  }
  /* mantelbuis, persing of boring: bruine band met groene rand */
  function mantelSvg(P,k){
    if(!P||P.length<2)return'';
    return `<polyline points="${pts(P)}" fill="none" stroke="${C.green}" stroke-width="${16*k}" stroke-linecap="butt" stroke-linejoin="miter"/>`+
      `<polyline points="${pts(P)}" fill="none" stroke="${C.brown}" stroke-width="${11*k}" stroke-linecap="butt" stroke-linejoin="miter"/>`;
  }
  function rondTekst(x,y,t,k){const r=15*k,fs=(t.length>2?9:t.length>1?11:14)*k;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.brown}" stroke="${C.green}" stroke-width="${3*k}"/><text x="${x}" y="${y+fs*.36}" font-size="${fs}" font-weight="800" text-anchor="middle" fill="#fff" font-family="${FONT}">${t}</text>`;}
  function buisSvg(P,k){
    if(!P||P.length<2)return'';
    return `<polyline points="${pts(P)}" fill="none" stroke="${C.yellow}" stroke-width="${12*k}" stroke-linecap="round" stroke-linejoin="round"/>`+
      `<polyline points="${pts(P)}" fill="none" stroke="${C.teal}" stroke-width="${6*k}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  function pill(x,y,text,fill,rim,ink,k){
    const fs=12*k,w=Math.max(34*k,text.length*fs*.62+18*k),h=24*k;
    return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${fill}" stroke="${rim}" stroke-width="${3*k}"/>`+
      `<text x="${x}" y="${y+fs*.36}" font-size="${fs}" font-weight="800" text-anchor="middle" fill="${ink}" font-family="${FONT}">${esc(text)}</text>`;
  }
  /* binnen-items (CPE + WODF, FDB lasbox, serverkast) kunnen een eigen lengte en breedte hebben: s.w, s.h */
  const BOX={cpe:[92.4,24],fdb:[22.4,32.2],sk:[25.2,30.8]};
  function boxMaat(s){const d=BOX[s&&s.t];if(!d)return null;const m=s.s>0?s.s:1;return [s.w>0?+s.w:d[0]*m,s.h>0?+s.h:d[1]*m];}
  function boxSvg(s,k,w,h){const x=+s.x,y=+s.y,L=x-w/2,T=y-h/2,sw=3*k;let o='';
    if(s.t==='cpe'){const fs=Math.max(4,Math.min(12*k,h*.55,(w-8*k)/6.2));
      o=`<rect x="${L}" y="${T}" width="${w}" height="${h}" rx="${2*k}" fill="${C.brown}" stroke="${C.green}" stroke-width="${sw}"/><text x="${x}" y="${y+fs*.36}" font-size="${fs}" font-weight="800" text-anchor="middle" fill="#fff" font-family="${FONT}">CPE + WODF</text>`;}
    else if(s.t==='fdb'){const fs=Math.max(4,Math.min(10*k,(w-4*k)/1.9,h*.4));
      o=`<rect x="${L}" y="${T}" width="${w}" height="${h}" fill="${C.brown}" stroke="${C.green}" stroke-width="${sw}"/><text x="${x}" y="${T+fs+3*k}" font-size="${fs}" font-weight="800" text-anchor="middle" fill="#fff" font-family="${FONT}">FDB</text>`;}
    else o=`<rect x="${L}" y="${T}" width="${w}" height="${h}" fill="none" stroke="${C.green}" stroke-width="${sw*1.2}"/>`;
    if(s.label)o+=`<text x="${x}" y="${y+h/2+15*k}" font-size="${13*k}" font-weight="800" text-anchor="middle" fill="${C.white}" stroke="${C.dark}" stroke-width="${3*k}" paint-order="stroke" font-family="${FONT}">${esc(s.label)}</text>`;
    return o;}
  function symSvg(s,k){
    if(BOX[s.t]&&(s.w>0||s.h>0)){const [w,h]=boxMaat(s);return boxSvg(s,k,w,h);}
    k=k*(s.s>0?s.s:1); // optioneel: grootte per symbool (bijv. kleiner op afstand)
    const x=+s.x,y=+s.y,r=14*k,sw=3*k;let o='';
    switch(s.t){
      case 'kn':o=`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.brown}" stroke="${C.green}" stroke-width="${sw}"/>`;break;
      case 'kb':o=`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.teal}" stroke="${C.yellow}" stroke-width="${sw}"/>`;break;
      case 'hn':o=`<rect x="${x-r}" y="${y-r}" width="${2*r}" height="${2*r}" rx="${2*k}" fill="${C.brown}" stroke="${C.green}" stroke-width="${sw}"/>`;break;
      case 'hb':o=`<rect x="${x-r}" y="${y-r}" width="${2*r}" height="${2*r}" rx="${2*k}" fill="${C.teal}" stroke="${C.yellow}" stroke-width="${sw}"/>`;break;
      case 'dv':return pill(x,y,'IN',C.brown,C.green,C.white,k);
      case 'lb':return pill(x,y,s.label||'label',C.label,C.green,C.white,k);
      case 'lo':return pill(x,y,'LET OP',C.letop,C.dark,C.dark,k);
      case 'gmb':return rondTekst(x,y,'GmB',k);
      case 'gzb':return rondTekst(x,y,'GzB',k);
      case 'p':return rondTekst(x,y,'P',k);
      case 'l':return rondTekst(x,y,'L',k);
      case 'bb':return rondTekst(x,y,'BB',k);
      case 'bw':o=`<circle cx="${x}" cy="${y}" r="${r*.85}" fill="${C.brown}" stroke="${C.green}" stroke-width="${2.5*k}" stroke-dasharray="${2.5*k} ${2*k}"/>`;break;
      case 'cpe':return pill(x,y,'CPE + WODF',C.brown,C.green,C.white,k).replace(/rx="[^"]*"/,`rx="${2*k}"`);
      case 'fdb':o=`<rect x="${x-r*.8}" y="${y-r*1.15}" width="${1.6*r}" height="${2.3*r}" fill="${C.brown}" stroke="${C.green}" stroke-width="${sw}"/><text x="${x}" y="${y-r*.45}" font-size="${10*k}" font-weight="800" text-anchor="middle" fill="#fff" font-family="${FONT}">FDB</text>`;break;
      case 'sk':o=`<rect x="${x-r*.9}" y="${y-r*1.1}" width="${1.8*r}" height="${2.2*r}" fill="none" stroke="${C.green}" stroke-width="${sw*1.2}"/>`;break;
      default:return'';
    }
    if(s.label)o+=`<text x="${x}" y="${y+r+15*k}" font-size="${13*k}" font-weight="800" text-anchor="middle" fill="${C.white}" stroke="${C.dark}" stroke-width="${3*k}" paint-order="stroke" font-family="${FONT}">${esc(s.label)}</text>`;
    return o;
  }
  /* SVG-tekst van de annotaties. schaal maakt lijnen en symbolen dikker of dunner (standaard 1). */
  function svgString(ann,schaal){
    const k=schaal||1,[W,H]=size(ann),a=ann||{};
    const body=mantelSvg(a.mantel,k)+buisSvg(a.buis,k)+polySvg(a.poly,k)+arrowSvg(a.arrow,k)+(a.syms||[]).map(s=>symSvg(s,k)).join('');
    return `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none">${body}</svg>`;
  }
  /* Tekent de legenda in een bestaande <svg> of in een <div> (daar komt een <svg> in, over de hele div). */
  function render(target,ann,schaal){
    const [W,H]=size(ann),k=schaal||1;
    let svg=target;
    if(!target||target.namespaceURI!==NS||target.tagName.toLowerCase()!=='svg'){
      svg=target.querySelector(':scope > svg.legend');
      if(!svg){svg=document.createElementNS(NS,'svg');svg.setAttribute('class','legend');
        svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
        if(getComputedStyle(target).position==='static')target.style.position='relative';target.appendChild(svg);}
    }
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('preserveAspectRatio','none');
    svg.innerHTML=svgString(ann,k).replace(/^<svg[^>]*>|<\/svg>$/g,'');
    return svg;
  }
  const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Afbeelding laden mislukt'));i.src=src;});
  /* Geeft een JPEG terug met de annotaties ingebrand, bijvoorbeeld voor Word of mail. */
  async function burnIn(fotoBlob,ann,schaal){
    const u=URL.createObjectURL(fotoBlob);
    try{
      const im=await loadImg(u),W=im.naturalWidth,H=im.naturalHeight;
      const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage(im,0,0,W,H);
      const s=svgString(ann,schaal).replace(/width="\d+" height="\d+"/,`width="${W}" height="${H}"`);
      const ov=await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s));
      g.drawImage(ov,0,0,W,H);
      return await new Promise(res=>c.toBlob(res,'image/jpeg',.9));
    }finally{URL.revokeObjectURL(u);}
  }
  /* legenda-items als kleine losse SVG's (90 x 36), voor het document */
  /* volledige legenda, in de volgorde van het Sisu-template; plus IN en Let op */
  const LEG=[
    ['Bestaande handhole',{syms:[{t:'hb',x:45,y:18}]}],
    ['Bestaande koppeling',{syms:[{t:'kb',x:45,y:18}]}],
    ['Bestaande buis',{buis:[[8,18],[82,18]]}],
    ['Nieuwe handhole',{syms:[{t:'hn',x:45,y:18}]}],
    ['Nieuwe koppeling',{syms:[{t:'kn',x:45,y:18}]}],
    ['Nieuw tracé',{arrow:[[8,18],[82,18]]}],
    ['Mantelbuis, persing of boring',{mantel:[[10,18],[80,18]]}],
    ['Boring met mantelbuis',{syms:[{t:'gmb',x:45,y:18}]}],
    ['Boring zonder buis',{syms:[{t:'gzb',x:45,y:18}]}],
    ['Persing',{syms:[{t:'p',x:45,y:18}]}],
    ['Leggen mantelbuis',{syms:[{t:'l',x:45,y:18}]}],
    ['Boogboring',{syms:[{t:'bb',x:45,y:18}]}],
    ['Invoer / doorvoer brandwerend',{syms:[{t:'bw',x:45,y:18}]}],
    ['CPE en WODF gemonteerd op 19” legbord',{syms:[{t:'cpe',x:45,y:18}]}],
    ['FDB lasbox',{syms:[{t:'fdb',x:45,y:18}]}],
    ['Serverkast',{syms:[{t:'sk',x:45,y:18}]}],
    ['Nieuwe invoer (IN)',{syms:[{t:'dv',x:45,y:18}]}],
    ['Let op',{syms:[{t:'lo',x:45,y:18}]}]
  ];
  /* klein plaatje van één onderdeel (voor knoppen en de legenda) */
  function mini(a,w,h,k){return svgString({orient:'liggend',...a},k||.8).replace(/viewBox="[^"]*" width="\d+" height="\d+"/,`viewBox="0 0 90 36" width="${w||90}" height="${h||36}"`);}
  function legendaItems(){return LEG.map(([naam,a])=>({naam,svg:mini(a)}));}
  /* kleine tegel (img met object-fit:cover): legenda erover, op dezelfde manier bijgesneden, onder het nummertje */
  function thumb(el,ann){if(!el||!ann)return;const a=ann,leeg=!(a.arrow||a.buis||a.mantel||a.poly||(a.syms&&a.syms.length));
    const oud=el.querySelector(':scope > svg.legend');if(leeg){if(oud)oud.remove();return;}
    const svg=render(el,ann,1.3);svg.setAttribute('preserveAspectRatio','xMidYMid slice');
    const img=el.querySelector(':scope > img');if(img&&img.nextSibling!==svg)el.insertBefore(svg,img.nextSibling);}
  window.Legend={thumb,boxMaat,render,burnIn,svgString,size,legendaItems,mini,COLORS:C};
})();
