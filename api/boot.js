export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.status(200).send(`(function(){
'use strict';
function showFail(){
  document.body.innerHTML='<div style="min-height:100vh;background:#000;color:#ffcc00;font-family:sans-serif;padding:22px"><b>CRONOS</b><br>Não foi possível carregar.</div>';
}
function decodeBase64Utf8(b64){
  var bin=atob(b64);
  var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
async function start(){
  try{
    var r=await fetch('/api/vault?t='+Date.now(), {cache:'no-store', headers:{'x-cronos-vault':'1'}});
    if(!r.ok) throw new Error('vault '+r.status);
    var data=await r.json();
    var b64=Array.isArray(data.p)?data.p.join(''):(data.p||'');
    if(!b64) throw new Error('payload vazio');
    var html=decodeBase64Utf8(b64);
    document.open();
    document.write(html);
    document.close();
  }catch(e){
    console.error('[CRONOS]', e);
    showFail();
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start, {once:true});
else start();
})();`);
}
