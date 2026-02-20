// Naver official search API proxy for medicine floating window
// Run: NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... node medicine-naver-proxy.js
// Endpoint: GET /api/naver-search?q=<keyword>

const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

function stripHtml(text = '') {
  return String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

async function searchNaver(query) {
  const url = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=8&sort=sim`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NAVER_API_${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.items || []).map((item) => ({
    title: stripHtml(item.title || '제목 없음'),
    link: item.link || '',
    snippet: stripHtml(item.description || '')
  }));
}

async function handleSearch(reqUrl, res) {
  const q = (reqUrl.searchParams.get('q') || '').trim();
  if (!q) return json(res, 400, { error: 'q is required' });

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return json(res, 503, { error: 'naver_api_credentials_missing' });
  }

  try {
    const results = await searchNaver(q);
    return json(res, 200, { query: q, results });
  } catch (e) {
    return json(res, 502, { error: 'naver_api_failed', detail: e.message });
  }
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (req.method === 'GET' && reqUrl.pathname === '/api/naver-search') {
    return handleSearch(reqUrl, res);
  }

  return json(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`[medicine-naver-proxy] listening on :${PORT}`);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log('[medicine-naver-proxy] WARNING: NAVER_CLIENT_ID / NAVER_CLIENT_SECRET missing');
  }
});
