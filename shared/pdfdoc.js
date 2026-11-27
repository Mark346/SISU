/* Maakt van een schouw een PDF (A4 staand) en deelt die. Werkt zonder internet:
   elke pagina wordt op een canvas getekend en als JPEG in een eenvoudige PDF gezet.
   PdfDoc.make(surveyId) -> Blob,  PdfDoc.share(surveyId) -> deelt of downloadt.
   Vereist store.js, legend.js, velden.js en docmodel.js. */
(function(){
  const BASE=(document.currentScript&&document.currentScript.src)||location.href; // map van dit script (shared/), voor het logo
  const PW=1240,PH=1754,M=80,CW=PW-2*M,ORANGE='#FF7A1A',FONT='-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif';
  const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Afbeelding laden mislukt'));i.src=src;});
  const nl=v=>(Math.round((+v||0)*10)/10).toLocaleString('nl-NL',{maximumFractionDigits:1});
  function wrap(g,text,w){const out=[];for(const para of String(text||'').split('\n')){let line='';for(const word of para.split(/\s+/).filter(Boolean)){const t=line?line+' '+word:word;if(g.measureText(t).width>w&&line){out.push(line);line=word;}else line=t;}out.push(line);}return out.filter((l,i,a)=>l||i<a.length-1);}
  function newPage(){const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,PW,PH);g.fillStyle='#111';g.textBaseline='alphabetic';return{c,g};}

  /* ---------- PDF in de opmaak van het origineel (IO-2-T03 Site survey, Word) ----------
     A4 op 150 dpi: 1 pt = 150/72 px. Kop met logo, rode balken (#963821), tekst Arial grijsgroen (#51534A),
     voettekst met bedrijfsgegevens en paginanummer, zoals in het Word-sjabloon. */
  const PT=150/72,A='Arial,Helvetica,"Liberation Sans",sans-serif',INK='#51534A',ROOD='#963821',TEAL='#007886',LIJN='#000';
  const L=100,R=PW-100,W=R-L,TOP=150,BOT=PH-150;
  const fz=pt=>Math.round(pt*PT);
  async function make(surveyId){
    const S=await Store.surveys.get(surveyId);if(!S)throw new Error('Schouw niet gevonden');
    const alle=await Store.photos.bySurvey(surveyId),fotos=alle.filter(p=>p.status!=='vervallen'),c=Velden.cfg();
    const V=k=>{const v=Velden.waarde(S,k);if(v==='nvt')return 'N.v.t';if(v==null)return '';const f=Velden.VELDEN.find(x=>x.k===k);
      if(f&&f.t==='datum'&&v){const d=new Date(v);if(!isNaN(d))return d.toLocaleDateString('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric'});}
      if(f&&f.t==='teller'&&f.teller&&/meters/i.test(f.teller))return +v>0?nl(v)+' m':'';
      return String(v);};
    const uit=k=>!c[k]||c[k].uit!=='nee';
    let logo=null;try{logo=await loadImg(new URL('eurofiber-logo.jpg',BASE).href);}catch(e){}
    const pages=[];let pg,g,y;
    const nieuw=()=>{pg=newPage();g=pg.g;pages.push(pg);y=TOP;
      if(logo){const h=64,w=logo.naturalWidth*h/logo.naturalHeight;g.drawImage(logo,L-4,60,w,h);}};
    const tx=(t,x,yy,pt,o={})=>{g.font=`${o.it?'italic ':''}${o.b?'700':'400'} ${fz(pt)}px ${o.serif?'Cambria,Georgia,serif':A}`;g.fillStyle=o.kleur||INK;g.textAlign=o.al||'left';
      let s=String(t==null?'':t);if(o.max){while(s.length>1&&g.measureText(s).width>o.max)s=s.slice(0,-2)+'…';}g.fillText(s,x,yy);g.textAlign='left';};
    const lijn=(x1,y1,x2,y2,d=1.4,k=LIJN)=>{g.strokeStyle=k;g.lineWidth=d;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();};
    const kader=(x,yy,w,h,d=1.6)=>{g.strokeStyle=LIJN;g.lineWidth=d;g.strokeRect(x,yy,w,h);};
    const balk=(t,x,yy,w,h=26,pt=10)=>{g.fillStyle=ROOD;g.fillRect(x,yy,w,h);tx(t,x+9,yy+h-7,pt,{kleur:'#fff',b:pt>9.5});};
    const RH=24,LW=Math.round(W*.27);
    /* tabel met rode kop en rijen "label: waarde" met een lijn onder de waarde */
    function tabel(kop,rijen){const y0=y;balk(kop,L,y,W);y+=26;
      for(const [l,v] of rijen){y+=RH;tx(l+(l.endsWith('?')||l.endsWith(':')?'':':'),L+9,y-6,9.5,{max:LW-12});tx(v,L+LW+6,y-6,9.5,{max:W-LW-12,kleur:'#111'});lijn(L+LW,y,R,y,1.2);}
      y+=6;kader(L,y0,W,y-y0);y+=22;}
    const cb=(x,yy,aan)=>{g.strokeStyle=LIJN;g.lineWidth=1.4;g.strokeRect(x,yy-15,16,16);if(aan){g.strokeStyle='#111';g.lineWidth=2.4;g.beginPath();g.moveTo(x+3,yy-7);g.lineTo(x+7,yy-3);g.lineTo(x+14,yy-12);g.stroke();}};
    async function plaatje(blob,x,yy,w,h,ann){if(!blob)return false;const b=ann?await Legend.burnIn(blob,ann):blob,u=URL.createObjectURL(b);
      try{const im=await loadImg(u),sc=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*sc,ih=im.naturalHeight*sc;g.drawImage(im,x+(w-iw)/2,yy+(h-ih)/2,iw,ih);return true;}
      catch(e){return false;}finally{URL.revokeObjectURL(u);}}
    const bijlage=k=>{const bp=fotos.find(p=>p.id===(S.bijlageBron||{})[k]);return bp?{blob:bp.blob,ann:bp.ann}:(S.bijlagen||{})[k]?{blob:S.bijlagen[k]}:null;};

    /* ---- pagina 1: algemeen, klant, locatie, eigenaar, aanmelden ---- */
    nieuw();
    tx('Site survey document',L+6,y+22,14,{b:true,kleur:'#595959'});y+=38;
    { const y0=y;balk('Algemene gegevens',L,y,W);y+=26;
      for(const [l,k] of [['Projectnummer','projectnummer'],['Type aansluiting','type_aansluiting'],['Datum site survey','datum_survey']]){y+=RH;tx(l+':',L+9,y-6,9.5);tx(V(k),L+LW+6,y-6,9.5,{kleur:'#111',max:W-LW-12});lijn(L+LW,y,R,y,1.2);}
      // aanwezig: Naam / Bedrijf / Telefoonnummer
      const cw=(W-LW)/3,cx=i=>L+LW+i*cw;y+=RH;tx('Aanwezig:',L+9,y-6,9.5);['Naam:','Bedrijf:','Telefoonnummer:'].forEach((h,i)=>tx(h,cx(i)+5,y-6,9,{kleur:'#595959'}));
      const ya=y-RH;for(const [l,p] of [['Organisatie','aanw_org'],['Aannemer','aanw_aan']]){y+=RH;tx(l+':',L+9,y-6,9.5);
        tx(V(p+'_naam'),cx(0)+5,y-6,9.5,{kleur:'#111',max:cw-10});tx(V(p+'_bedrijf'),cx(1)+5,y-6,9.5,{kleur:'#111',max:cw-10});tx(V(p+'_tel'),cx(2)+5,y-6,9.5,{kleur:'#111',max:cw-10});}
      for(let r=0;r<3;r++)lijn(L+LW,ya+(r+1)*RH,R,ya+(r+1)*RH,1.2);for(let i=0;i<=3;i++)lijn(cx(i),ya,cx(i),y,1.2);
      y+=6;kader(L,y0,W,y-y0);y+=22; }
    { // afhankelijkheden voor haalbaarheid leverdatum
      const y0=y,DW=Math.round(W*.2),ox=L+LW,dx=R-DW;balk('Afhankelijkheden voor haalbaarheid leverdatum:',L,y,W,26,9.5);y+=26;
      y+=RH;tx('Onderwerp',ox+5,y-6,9,{kleur:'#595959'});tx('Datum gereed',dx+5,y-6,9,{kleur:'#595959'});lijn(ox,y,R,y,1.2);
      const ya=y-RH;
      for(const [l,k] of [['Organisatie','afh_org'],['Aannemer','afh_aan']]){const regels=String(Velden.waarde(S,k)||'').split('\n').map(x=>x.trim()).filter(Boolean);
        const yb=y;for(let r=0;r<3;r++){y+=RH;const t=regels[r]||'';const m=t.match(/^(.*?)[,;\s–-]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\s*$/);
          tx(m?m[1]:t,ox+5,y-6,9.5,{kleur:'#111',max:dx-ox-10});if(m)tx(m[2],dx+5,y-6,9.5,{kleur:'#111'});lijn(ox,y,R,y,1.2);}
        tx(l+':',L+9,yb+RH*1.6,9.5);}
      lijn(ox,ya,ox,y,1.2);lijn(dx,ya,dx,y,1.2);y+=6;kader(L,y0,W,y-y0);y+=22; }
    tabel('Gegevens klant',[['Organisatie',V('klant_org')],['Adres',V('klant_adres')],['Postcode',V('klant_postcode')],['Plaats',V('klant_plaats')],['Contactpersoon',V('klant_contact')],['Telefoonnummer',V('klant_tel')],['E-mail',V('klant_mail')]]);
    { // gegevens locatie, eigenaar en aanmelden in één kader, zoals het origineel
      y-=22;const y0=y;balk('Gegevens locatie',L,y,W);y+=26;
      for(const [l,k] of [['Gebouwnaam','loc_gebouw'],['Soort gebouw','loc_soort'],['Adres','loc_adres'],['Postcode','loc_postcode'],['Plaats','loc_plaats']]){y+=RH;tx(l+':',L+9,y-6,9.5);tx(V(k),L+LW+6,y-6,9.5,{kleur:'#111',max:W-LW-12});lijn(L+LW,y,R,y,1.2);}
      y+=10;const eig=Velden.waarde(S,'eig_klant_is_eigenaar'),ja=eig==='Ja',nee=eig==='Nee';
      const ex=L+LW,lx=ex+Math.round((R-ex)*.30),vx=lx+Math.round((R-ex)*.17),ye=y;
      tx('Is de klant eigenaar van',L+9,y+RH-6,9.5);tx('het gebouw:',L+9,y+2*RH-6,9.5);
      tx('Ja',ex+5,y+RH-6,9.5);cb(ex+32,y+RH-4,ja);tx('Nee',ex+56,y+RH-6,9.5);cb(ex+92,y+RH-4,nee);tx('Indien nee*:',ex+116,y+RH-6,9,{max:lx-ex-120});
      const E=[['Naam','eig_naam'],['Adres','eig_adres'],['Postcode','eig_postcode'],['Plaats','eig_plaats'],['Contactpersoon','eig_contact'],['Telefoon','eig_tel'],['Mail','eig_mail']];
      for(const [l,k] of E){y+=RH;tx(l+':',vx-6,y-6,9.5,{al:'right'});tx(ja?'N.v.t':V(k),vx+5,y-6,9.5,{kleur:'#111',max:R-vx-10});lijn(ex,y,R,y,1.2);}
      lijn(ex,ye,R,ye,1.2);lijn(ex,ye,ex,y,1.2);lijn(lx,ye,lx,y,1.2);lijn(vx,ye,vx,y,1.2);
      y+=10;tx('De werkzaamheden moeten',L+9,y+RH-6,9.5);tx('worden aangemeld bij:',L+9,y+2*RH-6,9.5);y+=2*RH;lijn(L+LW,y,R,y,1.2);
      for(const [l,k] of [['Naam','aanm_naam'],['Telefoon','aanm_tel'],['E-mail','aanm_mail'],['Aantal dagen vooraf','aanm_dagen']]){y+=RH;tx(l+':',L+9,y-6,9.5);tx(V(k),L+LW+6,y-6,9.5,{kleur:'#111',max:W-LW-12});lijn(L+LW,y,R,y,1.2);}
      y+=6;kader(L,y0,W,y-y0);y+=24;tx('*Contactpersoon noteren die akkoord kan geven op de aanleg',L+40,y,9);}

    /* ---- pagina 2: afwerkpunt klantlocatie ---- */
    nieuw();
    { const y0=y;balk('Afwerkpunt klantlocatie',L,y,W);y+=26;
      for(const [l,k] of [['Plaatsbepaling 19” kast','afw_plaats'],['Ruimtebenaming','afw_ruimte'],['Kastbenaming','afw_kast'],['Type apparatuur','afw_apparatuur']]){y+=RH;tx(l+':',L+9,y-6,9.5);tx(V(k),L+LW+6,y-6,9.5,{kleur:'#111',max:W-LW-12});lijn(L+LW,y,R,y,1.2);}
      y+=RH;tx('Afbeelding kast:',L+9,y-6,9.5);const bk=bijlage('afw_foto');
      const hb=820;if(!(await plaatje(bk&&bk.blob,L+20,y+12,W-40,hb-24,bk&&bk.ann)))y+=0;y+=hb;kader(L,y0,W,y-y0); }

    /* ---- pagina 3: tracé, geografische weergave ---- */
    nieuw();
    tx('Tracé',L+6,y+18,12,{b:true,kleur:TEAL});y+=40;
    { const y0=y,h=BOT-y-10;balk('Geografische weergave',L,y,W,38,8);const opm=String(Velden.waarde(S,'trace_opm')||'').trim();
      const kg=bijlage('trace_geo'),oh=opm?80:0;await plaatje(kg&&kg.blob,L+16,y+52,W-32,h-66-oh,kg&&kg.ann);
      if(opm){g.font=`400 ${fz(9.5)}px ${A}`;wrap(g,opm,W-40).slice(0,3).forEach((l,i)=>tx(l,L+18,y0+h-oh+24+i*24,9.5,{kleur:'#111'}));}
      kader(L,y0,W,h); }

    /* ---- pagina 4: plattegrond ---- */
    if(uit('plattegrond')){nieuw();y+=10;const y0=y,h=BOT-y-120;balk('Plattegrond (indien beschikbaar)',L,y,W,38,8);
      const pl=bijlage('plattegrond');if(!(await plaatje(pl&&pl.blob,L+16,y+52,W-32,h-66,pl&&pl.ann))&&Velden.waarde(S,'plattegrond')==='nvt')tx('NIET BESCHIKBAAR',L+W/2,y0+h/2,12,{b:true,al:'center'});
      kader(L,y0,W,h);}

    /* ---- buitentracé en binnentracé: raster van 2 x 2, eerste vak met de tellers ---- */
    const bron=new Set(Object.values(S.bijlageBron||{}));
    const ROLNAAM={aansluit:'Aansluitpunt netwerk',invoer:'Invoer pand',begin:'Beginpunt / invoer'};
    let fnr=0;
    async function raster(titel,tstijl,sectie,tel){
      const L2=fotos.filter(p=>(p.sectie||'buiten')===sectie&&!bron.has(p.id)).sort((a,b)=>(b.rol?1:0)-(a.rol?1:0));
      const vakken=[{tel}].concat(L2.map(p=>({p})));
      for(let i=0;i<vakken.length;i+=4){nieuw();
        if(i===0){tstijl();}
        const y0=y,h=BOT-y0-(i===0?20:0),cw=W/2,ch=h/2;kader(L,y0,W,h);lijn(L+cw,y0,L+cw,y0+h,1.6);lijn(L,y0+ch,R,y0+ch,1.6);
        for(let k=0;k<4&&i+k<vakken.length;k++){const v=vakken[i+k],x=L+(k%2)*cw,yy=y0+Math.floor(k/2)*ch;
          if(v.tel){v.tel.forEach((r,j)=>{tx(r,x+10,yy+34+j*22,8.5,{kleur:'#111',max:cw-20});});continue;}
          fnr++;const p=v.p,cap=[`Foto ${fnr}${p.rol&&ROLNAAM[p.rol]?' – '+ROLNAAM[p.rol]:''}`].concat(p.bijschrift?[p.bijschrift]:[]);
          g.font=`400 ${fz(8)}px ${A}`;const cl=[cap[0]].concat(cap[1]?wrap(g,cap[1],cw-24).slice(0,2):[]),capH=cl.length*20+10;
          await plaatje(p.blob,x+10,yy+10,cw-20,ch-20-capH,p.ann);
          cl.forEach((l,j)=>tx(l,x+12,yy+ch-capH+14+j*20,8,{b:j===0,kleur:'#111',max:cw-24}));}
      }}
    if(!Velden.onnet(S)&&uit('buiten_fotos'))await raster('Buitentracé',()=>{tx('Buitentracé',L+6,y+22,12,{b:true,it:true,serif:true,kleur:'#111'});y+=40;},'buiten',
      [`Aantal meters buitentracé: ${V('buiten_meters')}`,`Aantal invoeringen: ${V('buiten_invoeringen')}`,`Aantal boringen/persingen: ${V('buiten_boringen')}`]);
    if(uit('binnen_fotos')){const st=String(Velden.waarde(S,'binnen_stroom')||'').trim();
      await raster('Binnentracé',()=>{tx('Binnentracé',L+6,y+14,10,{b:true,kleur:TEAL});y+=26;},'binnen',
      [`Aantal meters binnentracé: ${V('binnen_meters')}`,`Nieuw aan te leggen kabelgoot: ${V('binnen_kabelgoot')}`,`Brandwerende doorvoeren: ${V('binnen_brandwerend')}`].concat(st?['',`Stroomvoorziening: ${st}`]:[]));}

    /* ---- V&G ontwerpnota: alle aspecten, aangekruist wat van toepassing is ---- */
    if(uit('vg')){nieuw();const it=((Velden.waarde(S,'vg')||{}).items)||{};
      const AW=Math.round(W*.37),RW=Math.round(W*.30),x1=L+AW,x2=x1+RW,y0=y;
      balk('V&G ontwerpnota',L,y,W,30,9.5);y+=30;
      tx('Aspect',L+6,y+16,7.5,{b:true});tx('In ontwerp rekening mee houden',x1+(R-x1)/2,y+16,7.5,{b:true,al:'center'});lijn(L,y+20,R,y+20,1);
      tx('(aangekruiste aspecten zijn van toepassing)',L+6,y+36,7);tx("Risico's",x1+6,y+36,7.5,{b:true});tx('Afspraken / randvoorwaarden',x2+6,y+36,7.5,{b:true});y+=42;lijn(L,y,R,y,1.2);
      const yk=y;
      for(const grp of [...new Set(Velden.VG.map(a=>a.groep))]){y+=6;tx(grp,L+6,y+14,7.5,{b:true});y+=18;
        for(const a of Velden.VG.filter(x=>x.groep===grp)){const o=it[a.id]||{},aan=!!o.aan,ri=o.risico!=null?o.risico:a.risico,af=o.afspraak!=null?o.afspraak:a.afspraak;
          tx(a.aspect,x1-34,y+15,7.5,{al:'right',max:AW-44,kleur:aan?'#111':INK,b:aan});cb(x1-26,y+17,aan);
          tx(ri||'',x1+6,y+15,7.5,{max:RW-12,kleur:'#111'});tx(af||'',x2+6,y+15,7.5,{max:R-x2-12,kleur:'#111'});y+=19;}
        y+=8;lijn(L,y,R,y,1.2);}
      lijn(x1,yk-42,x1,y,1.2);lijn(x2,yk-22,x2,y,1.2);kader(L,y0,W,y-y0);}

    /* ---- legenda ---- */
    if(uit('legenda')){nieuw();tx('Legenda',L+6,y+18,12,{b:true,it:true,serif:true,kleur:'#111'});y+=34;
      const its=Legend.legendaItems(),rh=58,sw=Math.round(W*.26);const y0=y;
      for(const l of its){const im=await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(l.svg.replace('width="90" height="36"','width="270" height="108"'))).catch(()=>null);
        if(im)g.drawImage(im,L+(sw-120)/2,y+5,120,48);tx(l.naam,L+sw+12,y+rh/2+7,9.5);y+=rh;lijn(L,y,L+W*.72,y,1.2);}
      lijn(L+sw,y0,L+sw,y,1.2);kader(L,y0,W*.72,y-y0);}

    /* voettekst op elke pagina, zoals het sjabloon */
    pages.forEach((p,i)=>{const gg=p.g,yv=PH-120;gg.strokeStyle='#BFBFBF';gg.lineWidth=1.5;gg.beginPath();gg.moveTo(L,yv);gg.lineTo(R-60,yv);gg.stroke();
      gg.font=`400 ${fz(7.5)}px ${A}`;gg.fillStyle=INK;
      ['Safariweg 25-31','3605 MA, Maarssen','www.eurofiber.nl'].forEach((t,j)=>gg.fillText(t,L,yv+26+j*20));
      ['Kvk: 34134377','BTWnr: NL.8088.51.524 B 01','IBAN: NL90 ABNA 0569 2038 64'].forEach((t,j)=>gg.fillText(t,L+240,yv+26+j*20));
      gg.font=`400 ${fz(9)}px ${A}`;gg.textAlign='right';gg.fillText(String(i+1),R-120,yv+26);gg.textAlign='left';});
    const jpgs=[];for(const p of pages){const b=await new Promise(r=>p.c.toBlob(r,'image/jpeg',.88));jpgs.push(new Uint8Array(await b.arrayBuffer()));}
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
  /* bestandsnaam: projectnummer - straat en huisnummer - plaats.pdf */
  function fileName(S){const w=k=>{const v=S&&window.Velden?Velden.waarde(S,k):'';return v&&v!=='nvt'?String(v).trim():'';};
    let straat=w('loc_adres'),plaats=w('loc_plaats');
    if((!straat||!plaats)&&S&&S.adres){const d=String(S.adres).split(',');if(!straat)straat=(d[0]||'').trim();if(!plaats)plaats=(d.slice(1).join(',')||'').trim();}
    const naam=[w('projectnummer'),straat,plaats].filter(Boolean).join(' - ')||'Site survey';
    return naam.replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim().slice(0,120)+'.pdf';}
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
