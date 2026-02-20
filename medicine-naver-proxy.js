// Simple Naver search proxy for medicine floating window
// Run: node medicine-naver-proxy.js
// Endpoint: GET /api/naver-search?q=<keyword>

const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 8787;

function stripHtml(text = '') {
  return String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(text = '') {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseSearchResults(html) {
  const out = [];
  const blocks = html.match(/<a[^>]+href="https?:\/\/[^\"]+"[^>]*class="[^"]*link_tit[^"]*"[^>]*>[\s\S]*?<\/a>/g) || [];

  for (const block of blocks.slice(0, 8)) {
    const hrefMatch = block.match(/href="([^"]+)"/i);
    const titleMatch = block.match(/>([\s\S]*?)<\/a>/i);
    if (!hrefMatch) continue;

    out.push({
      title: decodeHtmlEntities(stripHtml(titleMatch ? titleMatch[1] : '제목 없음')),
      link: decodeHtmlEntities(hrefMatch[1]),
      snippet: ''
    });
  }

  return out;
}

async function handleSearch(reqUrl, res) {
  const q = (reqUrl.searchParams.get('q') || '').trim();
  if (!q) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'q is required' }));
    return;
  }

  const naverUrl = `https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(q)}`;

  try {
    const upstream = await fetch(naverUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    });
    const html = await upstream.text();
    const results = parseSearchResults(html);

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify({ query: q, results }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'proxy_fetch_failed', detail: error.message }));
  }
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (reqUrl.pathname === '/api/naver-search' && req.method === 'GET') {
    handleSearch(reqUrl, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  console.log(`[medicine-naver-proxy] listening on :${PORT}`);
});
