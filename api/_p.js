module.exports = async function handler(req, res) {
  const host = req.headers.host || '';
  const ref = req.headers.referer || req.headers.origin || '';
  // Bloqueia uso casual direto do proxy fora do próprio site.
  if (host && ref && !ref.includes(host)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Forbidden');
    return;
  }
  const raw = (req.query.u || req.query.url || '').toString();
  let target = raw;
  try { target = decodeURIComponent(raw); } catch (_) {}
  if (!/^https?:\/\//i.test(target)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('URL inválida');
    return;
  }
  try {
    const upstream = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        'Accept': req.headers.accept || '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const ab = await upstream.arrayBuffer();
    const ct = upstream.headers.get('content-type') || 'text/html; charset=utf-8';
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end(Buffer.from(ab));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Erro no proxy');
  }
};
