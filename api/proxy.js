export default async function handler(req, res) {
  try {
    const pageUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const target = pageUrl.searchParams.get('url');
    if (!target || !/^https?:\/\//i.test(target)) {
      res.status(400).send('URL inválida');
      return;
    }

    const upstream = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'accept': req.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9,en;q=0.8'
      }
    });

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
