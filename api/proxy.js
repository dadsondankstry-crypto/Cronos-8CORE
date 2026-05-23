// CRONOS API PROXY - Vercel Serverless Function
// Uso no front-end: /api/proxy?url=https%3A%2F%2Fsite.com%2Fpagina

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, Referer');
}

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch (_) { return value; }
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).send('Method not allowed');
    return;
  }

  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const target = safeDecode(String(raw || '').trim());

  if (!target) {
    res.status(400).send('Missing url');
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (_) {
    res.status(400).send('Invalid url');
    return;
  }

  if (!ALLOWED_PROTOCOLS.has(targetUrl.protocol)) {
    res.status(400).send('Invalid protocol');
    return;
  }

  try {
    const upstream = await fetch(targetUrl.href, {
      method: req.method,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': targetUrl.origin + '/'
      }
    });

    const contentType = upstream.headers.get('content-type') || 'text/html; charset=utf-8';
    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const body = await upstream.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (err) {
    res.status(502).send('Proxy error: ' + (err && err.message ? err.message : 'unknown'));
  }
}
