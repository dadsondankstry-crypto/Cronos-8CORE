export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.status(200).send(`(function(){
'use strict';
function fail(){
  document.body.innerHTML='<div style="min-height:100vh;background:#000;color:#ffcc00;font-family:sans-serif;padding:22px"><b>CRONOS</b><br>Não foi possível carregar.</div>';
}
function decode(b64){
  var bin=atob(b64), bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
async function start(){
  try{
    var r=await fetch('/api/vault?t='+Date.now(),{cache:'no-store',headers:{'x-cronos-vault':'1'}});
    if(!r.ok) throw new Error('vault '+r.status);
    var data=await r.json();
    var p=Array.isArray(data.p)?data.p.join(''):(data.p||'');
    if(!p) throw new Error('payload vazio');
    document.open();
    document.write(decode(p));
    document.close();
  }catch(e){ console.error('[CRONOS]', e); fail(); }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();`);
}
