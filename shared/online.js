/* Zoofi online (Supabase): inloggen, bedrijf en rol, uitnodigingen.
   Vereist shared/vendor/supabase/supabase.js. De sleutel hieronder is de openbare (publishable) sleutel;
   wat iemand mag zien en doen regelen de regels in de database (supabase/01-basis.sql).
   Gekozen bedrijf: localStorage 'sisu.bedrijf'. Openstaande uitnodiging: 'sisu.uitnodiging'. */
(function(){
  const URL_='https://erfteyqfclciboskjolv.supabase.co',KEY='sb_publishable_pe-w9CHfStT4kFEa2cdy2Q_VJcKZs2F';
  if(!window.supabase||!supabase.createClient){window.Online={beschikbaar:false};return;}
  const db=supabase.createClient(URL_,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'sisu.auth'}});
  const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(e){}}};
  const fout=e=>{const m=(e&&(e.message||e.error_description||e.msg))||String(e);
    if(/rate limit|security purposes/i.test(m))return 'Even wachten: je hebt net al een mail gekregen. Probeer het over een minuut opnieuw.';
    if(/expired|invalid/i.test(m)&&/token|otp/i.test(m))return 'Die code klopt niet of is verlopen. Vraag een nieuwe aan.';
    if(/Failed to fetch|NetworkError|Load failed/i.test(m))return 'Geen verbinding met internet.';
    return m;};
  const basis=()=>location.href.replace(/[?#].*$/,'').replace(/[^/]*$/,'');
  /* ---- inloggen: een mail met een link én een code (de code werkt ook in de app op het beginscherm) ---- */
  async function stuurInlog(email){const {error}=await db.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:basis()+'account.html',shouldCreateUser:true}});if(error)throw new Error(fout(error));}
  async function bevestigCode(email,code){const {data,error}=await db.auth.verifyOtp({email:email.trim(),token:String(code).replace(/\s/g,''),type:'email'});if(error)throw new Error(fout(error));return data.user;}
  async function gebruiker(){const {data}=await db.auth.getSession();return data&&data.session?data.session.user:null;}
  async function uitloggen(){await db.auth.signOut();ls.set('sisu.bedrijf',null);}
  /* ---- profiel: bedrijven waar je lid van bent, en of je beheerder bent ---- */
  async function profiel(){const u=await gebruiker();if(!u)return null;
    const [b,l,bh]=await Promise.all([db.from('bedrijven').select('id,naam').order('naam'),db.from('leden').select('bedrijf_id,rol').eq('user_id',u.id),db.from('beheerders').select('user_id').eq('user_id',u.id)]);
    for(const r of [b,l,bh])if(r.error)throw new Error(fout(r.error));
    const beheerder=bh.data.length>0,rol={};l.data.forEach(x=>rol[x.bedrijf_id]=x.rol);
    const bedrijven=b.data.map(x=>({...x,rol:beheerder?'beheerder':rol[x.id]||'gebruiker'}));
    let actief=ls.get('sisu.bedrijf');if(!bedrijven.some(x=>x.id===actief)){actief=bedrijven[0]?bedrijven[0].id:null;ls.set('sisu.bedrijf',actief);}
    return {user:u,beheerder,bedrijven,actief};}
  const kiesBedrijf=id=>ls.set('sisu.bedrijf',id);
  async function wordBeheerder(){const {data,error}=await db.rpc('word_beheerder');if(error)throw new Error(fout(error));return data;}
  async function maakBedrijf(naam){const {data,error}=await db.from('bedrijven').insert({naam:naam.trim()}).select().single();if(error)throw new Error(fout(error));return data;}
  /* ---- uitnodigingen ---- */
  const CODE='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const nieuweCode=()=>{const a=new Uint8Array(8);crypto.getRandomValues(a);return [...a].map(x=>CODE[x%CODE.length]).join('');};
  const link=code=>basis()+'account.html?uitnodiging='+code;
  async function maakUitnodiging(bedrijf,rol){const u=await gebruiker(),code=nieuweCode();
    const {error}=await db.from('uitnodigingen').insert({code,bedrijf_id:bedrijf,rol,gemaakt_door:u&&u.id});if(error)throw new Error(fout(error));return {code,link:link(code)};}
  async function uitnodigingen(bedrijf){const {data,error}=await db.from('uitnodigingen').select('*').eq('bedrijf_id',bedrijf).order('gemaakt',{ascending:false});if(error)throw new Error(fout(error));return data;}
  async function trekIn(code){const {error}=await db.from('uitnodigingen').delete().eq('code',code);if(error)throw new Error(fout(error));}
  async function uitnodigingInfo(code){const {data,error}=await db.rpc('uitnodiging_info',{p_code:code});if(error)return null;return data&&data[0]||null;}
  async function accepteer(code){const {data,error}=await db.rpc('accepteer_uitnodiging',{p_code:code});if(error)throw new Error(fout(error));ls.set('sisu.uitnodiging',null);ls.set('sisu.bedrijf',data);return data;}
  /* ---- leden ---- */
  async function leden(bedrijf){const {data,error}=await db.from('leden').select('user_id,rol,email,gemaakt').eq('bedrijf_id',bedrijf).order('email');if(error)throw new Error(fout(error));return data;}
  async function zetRol(bedrijf,user,rol){const {error}=await db.from('leden').update({rol}).eq('bedrijf_id',bedrijf).eq('user_id',user);if(error)throw new Error(fout(error));}
  async function verwijderLid(bedrijf,user){const {error}=await db.from('leden').delete().eq('bedrijf_id',bedrijf).eq('user_id',user);if(error)throw new Error(fout(error));}
  window.Online={beschikbaar:true,db,stuurInlog,bevestigCode,gebruiker,uitloggen,profiel,kiesBedrijf,wordBeheerder,maakBedrijf,
    maakUitnodiging,uitnodigingen,trekIn,uitnodigingInfo,accepteer,leden,zetRol,verwijderLid,link,
    onAuth:fn=>db.auth.onAuthStateChange((e,s)=>fn(e,s))};
})();
