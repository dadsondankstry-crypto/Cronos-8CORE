const WORKER_PROXY = 'https://fragrant-unit-a421.dadsondankstry.workers.dev/?url=';

function normalizeTarget(raw) {
  if (!raw || !/^https?:\/\//i.test(raw)) return '';
  return raw.trim();
}

function mustUseWorker(target) {
  return /(^|\.)boraflix\.click\b|(^|\.)boraflixtv\.com\b/i.test(target);
}

async function fetchDirect(target, req) {
  return fetch(target, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'accept': req.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'pragma': 'no-cache'
    }
  });
}

async function fetchWorker(target, req) {
  return fetch(WORKER_PROXY + encodeURIComponent(target), {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'accept': req.headers['accept'] || '*/*',
      'accept-language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  });
}

function shouldFallback(resp) {
  if (!resp) return true;
  return [403, 404, 429, 500, 502, 503, 504].includes(resp.status);
}

export default async function handler(req, res) {
  try {
    const pageUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const target = normalizeTarget(pageUrl.searchParams.get('url'));
    if (!target) {
      res.status(400).send('URL inválida');
      return;
    }

    let upstream;
    if (mustUseWorker(target)) {
      upstream = await fetchWorker(target, req);
      if (shouldFallback(upstream)) upstream = await fetchDirect(target, req);
    } else {
      upstream = await fetchDirect(target, req);
      if (shouldFallback(upstream)) upstream = await fetchWorker(target, req);
    }

    const contentType = upstream.headers.get('content-type') || 'text/html; charset=utf-8';
    const body = await upstream.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream.status).send(Buffer.from(body));
  } catch (err) {
    res.status(500).send('Erro no proxy');
  }
}
