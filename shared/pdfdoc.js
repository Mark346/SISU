/* Maakt van een schouw een PDF (A4 staand) en deelt die. Werkt zonder internet:
   elke pagina wordt op een canvas getekend en als JPEG in een eenvoudige PDF gezet.
   PdfDoc.make(surveyId) -> Blob,  PdfDoc.share(surveyId) -> deelt of downloadt.
   Vereist store.js en legend.js. */
(function(){
  const PW=1240,PH=1754,M=80,CW=PW-2*M,ORANGE='#FF7A1A',FONT='-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif';
  const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Afbeelding laden mislukt'));i.src=src;});
  const nl=v=>(Math.round((+v||0)*10)/10).toLocaleString('nl-NL',{maximumFractionDigits:1});
  function wrap(g,text,w){const out=[];for(const para of String(text||'').split('\n')){let line='';for(const word of para.split(/\s+/).filter(Boolean)){const t=line?line+' '+word:word;if(g.measureText(t).width>w&&line){out.push(line);line=word;}else line=t;}out.push(line);}return out.filter((l,i,a)=>l||i<a.length-1);}
  function newPage(){const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,PW,PH);g.fillStyle='#111';g.textBaseline='alphabetic';return{c,g};}

  async function make(surveyId){
    const S=await Store.surveys.get(surveyId);if(!S)throw new Error('Schouw niet gevonden');
    const ph=await Store.photos.bySurvey(surveyId);
    const pages=[];let pg=newPage(),y=M;
    const T=S.tellers||{};
    // kop
    let g=pg.g;g.font=`800 46px ${FONT}`;g.fillText(S.adres||'Schouw',M,y+40);y+=62;
    g.font=`400 26px ${FONT}`;g.fillStyle='#555';g.fillText(new Date(S.datum).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'}),M,y+20);y+=56;
    g.fillStyle='#111';g.font=`800 36px ${FONT}`;g.fillText('Buitentracé',M,y+34);y+=48;g.fillStyle=ORANGE;g.fillRect(M,y,CW,4);y+=22;
    // tellers
    const rows=[[`Aantal meters buiten tracé${T.metersNote?' ('+T.metersNote+')':''}`,`${nl(T.meters)} m`],['Aantal invoeringen',String(T.invoeringen||0)],['Aantal boringen/persingen',String(T.boringen||0)]];
    g.fillStyle='#111';g.lineWidth=3;g.strokeStyle='#111';g.strokeRect(M,y,CW,rows.length*56);
    rows.forEach((r,i)=>{g.font=`400 26px ${FONT}`;g.fillStyle='#111';g.fillText(r[0],M+18,y+i*56+37);g.textAlign='right';g.font=`700 26px ${FONT}`;g.fillText(r[1],M+CW-18,y+i*56+37);g.textAlign='left';
      if(i)g.fillStyle='#ccc',g.fillRect(M,y+i*56,CW,1);});
    y+=rows.length*56+34;
    // foto's in twee kolommen
    const GAP=36,COLW=(CW-GAP)/2,BOXH=400,CAPF=24,CAPL=31;
    const capLines=p=>{g.font=`400 ${CAPF}px ${FONT}`;return wrap(g,p.bijschrift||'',COLW-8).slice(0,6);};
    const vakH=p=>BOXH+14+34+capLines(p).length*CAPL+10;
    for(let i=0;i<ph.length;i+=2){
      const pair=ph.slice(i,i+2),h=Math.max(...pair.map(vakH));
      if(y+h>PH-M-30){pages.push(pg);pg=newPage();g=pg.g;y=M;}
      for(let k=0;k<pair.length;k++){
        const p=pair[k],x=M+k*(COLW+GAP);
        g.strokeStyle='#bbb';g.lineWidth=2;g.strokeRect(x,y,COLW,h);
        const blob=p.ann?await Legend.burnIn(p.blob,p.ann):p.blob,u=URL.createObjectURL(blob);
        try{const im=await loadImg(u),sc=Math.min((COLW-16)/im.naturalWidth,(BOXH-16)/im.naturalHeight),w=im.naturalWidth*sc,hh=im.naturalHeight*sc;
          g.drawImage(im,x+(COLW-w)/2,y+8+(BOXH-16-hh)/2,w,hh);}finally{URL.revokeObjectURL(u);}
        g.fillStyle='#111';g.font=`700 ${CAPF}px ${FONT}`;g.fillText(`Foto ${i+k+1}`,x+10,y+BOXH+14+24);
        g.font=`400 ${CAPF}px ${FONT}`;capLines(p).forEach((l,j)=>g.fillText(l,x+10,y+BOXH+14+34+24+j*CAPL));
      }
      y+=h+GAP;
    }
    if(!ph.length){g.font=`400 26px ${FONT}`;g.fillStyle='#555';g.fillText("Nog geen foto's in deze schouw.",M,y+30);}
    pages.push(pg);
    // paginanummers
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
