/* Bouwt de inhoud van het output-document als een lijst blokken, volgens de instellingen
   (velden.js, output: verplicht/wenselijk/nee). Gebruikt door document.html (scherm/print) en pdfdoc.js (PDF).
   Blokken: {t:'kop',tekst} {t:'rijen',rijen:[{l,v,mist}]} {t:'beeld',l,blob,tekst,mist} {t:'fotos',fotos}
            {t:'vg',items} {t:'legenda'} */
(function(){
  const fmtDatum=v=>{if(!v)return'';const d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric'});};
  const nl=v=>(Math.round((+v||0)*10)/10).toLocaleString('nl-NL',{maximumFractionDigits:1});
  async function bouw(surveyId){
    const S=await Store.surveys.get(surveyId);if(!S)throw new Error('Schouw niet gevonden');
    const fotos=await Store.photos.bySurvey(surveyId),c=Velden.cfg(),B=[];
    // fotonummers zoals ze in het document komen (voor de verplichte foto's met een rol)
    const nr={};let n=0;
    for(const f of Velden.VELDEN)if(f.t==='fotos'&&c[f.k].uit!=='nee'&&Velden.actief(S,f))fotos.filter(p=>p.status!=='vervallen'&&(p.sectie||'buiten')===f.sectie).forEach(p=>{nr[p.id]=++n;});
    for(const sc of Velden.SECTIES){
      const fs=Velden.VELDEN.filter(f=>f.s===sc.id&&c[f.k].uit!=='nee');if(!fs.length)continue;
      const blok=[];let rijen=[];
      const flush=()=>{if(rijen.length){blok.push({t:'rijen',rijen});rijen=[];}};
      for(const f of fs){
        const verpl=c[f.k].uit==='verplicht',vol=Velden.gevuld(S,f,fotos),v=Velden.waarde(S,f.k);
        if(!Velden.actief(S,f)){if(f.als&&f.als.niet!=null)continue; // ONNET: buiten tracé komt niet in het document
          rijen.push({l:f.l,v:'N.v.t'});continue;}
        switch(f.t){
          case 'foto':flush();blok.push({t:'beeld',l:f.l,blob:(S.bijlagen||{})[f.k]||null,tekst:v==='nvt'?(f.nvt||'Niet beschikbaar'):'',mist:verpl&&!vol});break;
          case 'fotos':{flush();const ff=fotos.filter(p=>(p.sectie||'buiten')===f.sectie);if(ff.length||verpl)blok.push({t:'fotos',fotos:ff,mist:verpl&&!ff.length,l:f.l});break;}
          case 'vg':{flush();const it=(v&&v.items)||{};blok.push({t:'vg',items:Velden.VG.filter(a=>it[a.id]&&it[a.id].aan).map(a=>({...a,risico:it[a.id].risico!=null?it[a.id].risico:a.risico,afspraak:it[a.id].afspraak!=null?it[a.id].afspraak:a.afspraak})),mist:verpl&&!vol});break;}
          case 'legenda':flush();blok.push({t:'legenda'});break;
          case 'rolfoto':{const p=fotos.find(x=>x.status!=='vervallen'&&x.rol===f.rol);rijen.push({l:f.l,v:p?(nr[p.id]?'Foto '+nr[p.id]:'Ja'):'',mist:verpl&&!p});break;}
          case 'teller':rijen.push({l:f.l,v:f.teller==='meters'?(+v>0?nl(v)+' m'+(S.tellers&&S.tellers.metersNote?' ('+S.tellers.metersNote+')':''):''):String(v==null?'':v),mist:verpl&&!vol});break;
          case 'datum':rijen.push({l:f.l,v:fmtDatum(v),mist:verpl&&!vol});break;
          default:rijen.push({l:f.l,v:v==null?'':String(v),mist:verpl&&!vol});
        }
      }
      flush();
      if(blok.length){B.push({t:'kop',tekst:sc.naam});B.push(...blok);}
    }
    return{S,blokken:B,fotos};
  }
  /* lijst ontbrekende verplichte onderdelen */
  const ontbreekt=m=>m.blokken.flatMap(b=>b.t==='rijen'?b.rijen.filter(r=>r.mist).map(r=>r.l):b.mist?[b.l||'V&G ontwerpnota']:[]);
  window.DocModel={bouw,ontbreekt};
})();
