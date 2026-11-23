/* Camera: foto maken via een bestandskiezer (werkt betrouwbaar in een iPhone-beginscherm-app)
   en een live camerabeeld via getUserMedia voor Richt & Zet. Vereist shared/store.js (voor verkleinen). */
(function(){
  function pickFile(capture){
    return new Promise(res=>{
      const i=document.createElement('input');i.type='file';i.accept='image/*';if(capture)i.setAttribute('capture','environment');
      i.style.cssText='position:fixed;left:-1000px;top:0;opacity:0';document.body.appendChild(i);
      let done=false;const fin=v=>{if(done)return;done=true;i.remove();res(v);};
      i.onchange=()=>fin(i.files&&i.files[0]||null);
      // als de kiezer wordt gesloten zonder foto komt er geen change; na terugkeer opruimen
      window.addEventListener('focus',()=>setTimeout(()=>{if(!i.files||!i.files.length)fin(null);},1200),{once:true});
      i.click();
    });
  }
  /* Maakt een foto (camera) of kiest er een (galerij) en verkleint die. Geeft {blob,w,h,orient} of null. */
  async function take(opts={}){
    const f=await pickFile(opts.galerij?false:true);
    if(!f)return null;
    return window.Store?Store.shrink(f):{blob:f};
  }
  let stream=null;
  /* Live camerabeeld in een <video>. Geeft de stream terug; stop() zet hem weer uit. */
  async function live(video){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Live camera wordt hier niet ondersteund');
    stop();
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
    video.setAttribute('playsinline','');video.muted=true;video.srcObject=stream;await video.play().catch(()=>{});
    return stream;
  }
  function stop(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
  /* Pakt het huidige beeld van de live camera als verkleinde JPEG. */
  async function grab(video){
    const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);
    const b=await new Promise(res=>c.toBlob(res,'image/jpeg',.92));
    return window.Store?Store.shrink(b):{blob:b};
  }
  window.Camera={take,live,stop,grab};
})();
