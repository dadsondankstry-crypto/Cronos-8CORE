const fs = require('fs');
const path = require('path');
const KEY = [67,82,79,78,79,83,45,50,48,50,54,45,75];
function encodeVault(txt){
  const buf = Buffer.from(txt, 'utf8');
  const out = Buffer.allocUnsafe(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ KEY[i % KEY.length];
  return out.toString('base64');
}
module.exports = function handler(req, res) {
  const ok = req.headers['x-cronos-boot'] === '1' && req.headers['x-cronos-v'] === 'core';
  if (!ok) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
    return;
  }
  try {
    const file = path.join(process.cwd(), 'server', 'cronos.html');
    const html = fs.readFileSync(file, 'utf8');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(encodeVault(html));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Erro ao carregar');
  }
};
