/* Maakt van een schouw een PDF (A4 staand) en deelt die. Werkt zonder internet:
   elke pagina wordt op een canvas getekend en als JPEG in een eenvoudige PDF gezet.
   PdfDoc.make(surveyId) -> Blob,  PdfDoc.share(surveyId) -> deelt of downloadt.
   Vereist store.js, legend.js, velden.js en docmodel.js. */
(function(){
  const PW=1240,PH=1754,M=80,CW=PW-2*M,ORANGE='#FF7A1A',FONT='-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif';
  const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Afbeelding laden mislukt'));i.src=src;});
  const nl=v=>(Math.round((+v||0)*10)/10).toLocaleString('nl-NL',{maximumFractionDigits:1});
  function wrap(g,text,w){const out=[];for(const para of String(text||'').split('\n')){let line='';for(const word of para.split(/\s+/).filter(Boolean)){const t=line?line+' '+word:word;if(g.measureText(t).width>w&&line){out.push(line);line=word;}else line=t;}out.push(line);}return out.filter((l,i,a)=>l||i<a.length-1);}
  function newPage(){const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,PW,PH);g.fillStyle='#111';g.textBaseline='alphabetic';return{c,g};}

  async function make(surveyId){
    const m=await DocModel.bouw(surveyId),S=m.S,pages=[];let pg=newPage(),g=pg.g,y=M;
    const nieuw=()=>{pages.push(pg);pg=newPage();g=pg.g;y=M;};
    const ruimte=h=>{if(y+h>PH-M-40)nieuw();};
    const tekst=(t,x,yy,font,kleur)=>{g.font=font;g.fillStyle=kleur||'#111';g.fillText(t,x,yy);};
    // titel
    tekst('SITE SURVEY DOCUMENT',M,y+20,`700 22px ${FONT}`,'#777');y+=34;
    g.font=`800 44px ${FONT}`;wrap(g,S.adres||'Schouw',CW).forEach(l=>{tekst(l,M,y+42,`800 44px ${FONT}`);y+=54;});
    tekst(new Date(S.datum).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'}),M,y+20,`400 26px ${FONT}`,'#555');y+=46;
    const GAP=36,COLW=(CW-GAP)/2,BOXH=400,CAPF=24,CAPL=31;let nr=0;
    for(const b of m.blokken){
      if(b.t==='kop'){ruimte(230);y+=18;tekst(b.tekst,M,y+34,`800 34px ${FONT}`);y+=46;g.fillStyle=ORANGE;g.fillRect(M,y,CW,4);y+=20;continue;}
      if(b.t==='rijen'){
        const LW=Math.round(CW*.45),VW=CW-LW-36;
        for(const r of b.rijen){g.font=`400 24px ${FONT}`;const ll=wrap(g,r.l,LW-10),vl=wrap(g,r.v||'—',VW);const h=Math.max(ll.length,vl.length)*30+20;
          ruimte(h);g.strokeStyle='#bbb';g.lineWidth=1.5;g.strokeRect(M,y,CW,h);g.fillStyle='#bbb';g.fillRect(M+LW,y,1.5,h);
          ll.forEach((l,i)=>tekst(l,M+14,y+34+i*30,`400 24px ${FONT}`,'#333'));vl.forEach((l,i)=>tekst(l,M+LW+16,y+34+i*30,`600 24px ${FONT}`,r.v?'#111':'#999'));y+=h;}
        y+=16;continue;}
      if(b.t==='beeld'){
        if(b.blob){const u=URL.createObjectURL(b.blob);try{const im=await loadImg(u),sc=Math.min(CW/im.naturalWidth,700/im.naturalHeight,1.6),w=im.naturalWidth*sc,h=im.naturalHeight*sc;
          ruimte(h+50);tekst(b.l,M,y+26,`700 24px ${FONT}`);y+=38;g.drawImage(im,M,y,w,h);g.strokeStyle='#bbb';g.strokeRect(M,y,w,h);y+=h+20;}finally{URL.revokeObjectURL(u);}}
        else{ruimte(80);tekst(b.l,M,y+26,`700 24px ${FONT}`);y+=38;tekst(b.tekst||'—',M,y+28,`800 26px ${FONT}`,b.tekst?'#111':'#999');y+=50;}
        continue;}
      if(b.t==='fotos'){
        const ph=b.fotos;if(!ph.length){ruimte(50);tekst('—',M,y+28,`400 24px ${FONT}`,'#999');y+=50;continue;}
        const capLines=p=>{g.font=`400 ${CAPF}px ${FONT}`;return wrap(g,p.bijschrift||'',COLW-20).slice(0,6);};
        const vakH=p=>BOXH+14+34+capLines(p).length*CAPL+10;
        for(let i=0;i<ph.length;i+=2){
          const pair=ph.slice(i,i+2),h=Math.max(...pair.map(vakH));ruimte(h);
          for(let k=0;k<pair.length;k++){
            const p=pair[k],x=M+k*(COLW+GAP);nr++;
            g.strokeStyle='#bbb';g.lineWidth=2;g.strokeRect(x,y,COLW,h);
            const blob=p.ann?await Legend.burnIn(p.blob,p.ann):p.blob,u=URL.createObjectURL(blob);
            try{const im=await loadImg(u),sc=Math.min((COLW-16)/im.naturalWidth,(BOXH-16)/im.naturalHeight),w=im.naturalWidth*sc,hh=im.naturalHeight*sc;
              g.drawImage(im,x+(COLW-w)/2,y+8+(BOXH-16-hh)/2,w,hh);}finally{URL.revokeObjectURL(u);}
            tekst(`Foto ${nr}`,x+10,y+BOXH+14+24,`700 ${CAPF}px ${FONT}`);
            capLines(p).forEach((l,j)=>tekst(l,x+10,y+BOXH+14+34+24+j*CAPL,`400 ${CAPF}px ${FONT}`));
          }
          y+=h+GAP;
        }
        continue;}
      if(b.t==='vg'){
        if(!b.items.length){ruimte(50);tekst('Geen aspecten aangekruist.',M,y+28,`400 24px ${FONT}`,'#555');y+=50;continue;}
        const W1=Math.round(CW*.36),W2=Math.round(CW*.30),W3=CW-W1-W2,cols=[[M,W1],[M+W1,W2],[M+W1+W2,W3]];
        const kopR=()=>{ruimte(48);g.fillStyle='#f2f2f2';g.fillRect(M,y,CW,44);['Aspect',"Risico's",'Afspraken / randvoorwaarden'].forEach((t,i)=>tekst(t,cols[i][0]+10,y+30,`700 21px ${FONT}`));g.strokeStyle='#bbb';g.strokeRect(M,y,CW,44);y+=44;};
        kopR();
        for(const a of b.items){g.font=`400 21px ${FONT}`;const L=[wrap(g,a.groep+': '+a.aspect,W1-20),wrap(g,a.risico||'',W2-20),wrap(g,a.afspraak||'',W3-20)],h=Math.max(1,...L.map(x=>x.length))*27+16;
          if(y+h>PH-M-40){nieuw();kopR();}
          g.strokeStyle='#bbb';g.lineWidth=1.5;cols.forEach(([x,w])=>g.strokeRect(x,y,w,h));
          L.forEach((ls,i)=>ls.forEach((l,j)=>tekst(l,cols[i][0]+10,y+28+j*27,`400 21px ${FONT}`)));y+=h;}
        y+=16;continue;}
      if(b.t==='legenda'){
        const it=Legend.legendaItems();
        for(let i=0;i<it.length;i+=2){ruimte(70);
          for(let k=0;k<2&&i+k<it.length;k++){const x=M+k*(CW/2),im=await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(it[i+k].svg.replace('width="90" height="36"','width="180" height="72"')));
            g.drawImage(im,x,y,135,54);tekst(it[i+k].naam,x+150,y+36,`400 23px ${FONT}`);}
          y+=66;}
        continue;}
    }
    pages.push(pg);
    pages.forEach((p,i)=>{p.g.font=`400 20px ${FONT}`;p.g.fillStyle='#777';p.g.textAlign='right';p.g.fillText(`${i+1} / ${pages.length}`,PW-M,PH-40);p.g.textAlign='left';});
    const jpgs=[];for(const p of pages){const b=await new Promise(r=>p.c.toBlob(r,'image/jpeg',.85));jpgs.push(new Uint8Array(await b.arrayBuffer()));}
    return pdfFromJpegs(jpgs,PW,PH);
  }

  /* minimale PDF: per pagina één JPEG over de hele A4 */
  function pdfFromJpegs(jpgs,w,h){
    const enc=new TextEncoder(),parts=[],offs=[];let len=0;
    const add=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length;};
    const obj=(n,body)=>{offs[n]=len;add(`${n} 0 obj\n`);body();add('\nendobj\n');};
    add('%PDF-1.4\n');add(new Uint8Array([37,226,227,207,211,10]));
    const A4W=595.28,A4H=841.89,n=jpgs.length,kids=[];for(let i=0;i<n;i++)kids.push(`${3+i*3} 0 R`);
    obj(1,()=>add('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2,()=>add(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${n} >>`));
    jpgs.forEach((j,i)=>{const p=3+i*3,cs=`q ${A4W} 0 0 ${A4H} 0 0 cm /Im0 Do Q`;
      obj(p,()=>add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4W} ${A4H}] /Resources << /XObject << /Im0 ${p+1} 0 R >> >> /Contents ${p+2} 0 R >>`));
      obj(p+1,()=>{add(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.length} >>\nstream\n`);add(j);add('\nendstream');});
      obj(p+2,()=>add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));});
    const size=3+n*3,xref=len;
    add(`xref\n0 ${size}\n0000000000 65535 f \n`);for(let i=1;i<size;i++)add(String(offs[i]).padStart(10,'0')+' 00000 n \n');
    add(`trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts,{type:'application/pdf'});
  }
  function fileName(S){return 'Schouw '+((S&&S.adres)||'zonder adres').replace(/[\\/:*?"<>|]+/g,'').trim().slice(0,60)+'.pdf';}
  async function prepare(surveyId){const S=await Store.surveys.get(surveyId),blob=await make(surveyId);return new File([blob],fileName(S),{type:'application/pdf'});}
  /* deelt via het deelmenu van de telefoon, of downloadt als dat niet kan.
     'opnieuw' = de telefoon wil een nieuwe tik (het maken duurde te lang): roep dan shareFile opnieuw aan vanuit een tik. */
  async function shareFile(file){
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:file.name.replace(/\.pdf$/,'')});return 'gedeeld';}
      catch(e){if(e&&e.name==='AbortError')return 'geannuleerd';if(e&&e.name==='NotAllowedError')return 'opnieuw';}
    }
    const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);
    return 'gedownload';
  }
  /* koppelt een knop: eerste tik maakt de PDF en deelt; lukt delen pas na een nieuwe tik, dan vraagt de knop daarom */
  function bindShare(btn,surveyId,onMsg){
    let file=null;const label=btn.textContent;
    btn.addEventListener('click',async()=>{
      if(btn.disabled)return;
      if(!file){btn.disabled=true;btn.textContent='PDF maken…';try{file=await prepare(surveyId);}catch(e){btn.disabled=false;btn.textContent=label;onMsg&&onMsg('PDF maken lukte niet: '+(e.message||e));return;}btn.disabled=false;}
      const r=await shareFile(file);
      if(r==='opnieuw'){btn.textContent='Tik om te delen';return;}
      btn.textContent=label;if(r==='gedownload')onMsg&&onMsg('PDF gedownload');
    });
  }
  window.PdfDoc={make,prepare,shareFile,bindShare,fileName};
})();
