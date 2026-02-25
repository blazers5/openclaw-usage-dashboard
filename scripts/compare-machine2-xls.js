const XLSX = require('xlsx');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');
const https = require('https');

const xlsPath = 'C:/Users/blazers5/.openclaw/media/inbound/file_77---9c22a73a-e1d0-48f7-9a25-0d62659b2b23.xls';
const outDir = path.resolve('reports/machine2-compare');
fs.mkdirSync(outDir, { recursive: true });

const base = 'https://lkcugkmkabeeeigkazzn.supabase.co/rest/v1';
const key = 'sb_publishable_27Iqc8Qukobl8cK0PGUwzQ_HM5Gzw3n';

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    https
      .get(base + urlPath, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      })
      .on('error', reject);
  });
}

function fixMojibake(s) {
  const str = String(s ?? '');
  if (!/[\u0080-\u00FF]/.test(str)) return str;
  try {
    return iconv.decode(Buffer.from(str, 'latin1'), 'cp949');
  } catch {
    return str;
  }
}

function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()\-_.·,\/]/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function sim(a, b) {
  const aa = norm(a), bb = norm(b);
  if (!aa || !bb) return 0;
  const d = levenshtein(aa, bb);
  return 1 - d / Math.max(aa.length, bb.length);
}

(async () => {
  const wb = XLSX.readFile(xlsPath, { cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const source = rows
    .filter((r) => Number.isFinite(Number(r[0])) && String(r[1]).trim())
    .map((r) => ({
      no: Number(r[0]),
      code: fixMojibake(r[1]).trim(),
      name: fixMojibake(r[2]).trim()
    }));

  const target = await getJson('/medicine_inventory_2?select=id,no,code,name&order=no.asc');

  const exact = [];
  const similar = [];
  const unmatched = [];

  const targetByKey = new Map(target.map((t) => [`${norm(t.code)}|${norm(t.name)}`, t]));

  for (const s of source) {
    const k = `${norm(s.code)}|${norm(s.name)}`;
    if (targetByKey.has(k)) {
      const t = targetByKey.get(k);
      exact.push({ srcNo: s.no, srcCode: s.code, srcName: s.name, tgtNo: t.no, tgtCode: t.code, tgtName: t.name, status: 'EXACT' });
      continue;
    }

    let best = null;
    for (const t of target) {
      const codeSame = norm(s.code) && norm(s.code) === norm(t.code);
      const nameScore = sim(s.name, t.name);
      const codeScore = sim(s.code, t.code);
      const score = codeSame ? Math.max(0.85, (nameScore * 0.7 + codeScore * 0.3)) : (nameScore * 0.7 + codeScore * 0.3);
      if (!best || score > best.score) {
        best = { t, score, codeSame, nameScore, codeScore };
      }
    }

    if (best && (best.codeSame || best.score >= 0.78)) {
      similar.push({
        srcNo: s.no, srcCode: s.code, srcName: s.name,
        tgtNo: best.t.no, tgtCode: best.t.code, tgtName: best.t.name,
        score: Number(best.score.toFixed(3)),
        codeSame: best.codeSame,
        status: 'SIMILAR'
      });
    } else {
      unmatched.push({ srcNo: s.no, srcCode: s.code, srcName: s.name, status: 'UNMATCHED' });
    }
  }

  const summary = {
    sourceCount: source.length,
    targetCount: target.length,
    exactCount: exact.length,
    similarCount: similar.length,
    unmatchedCount: unmatched.length,
    note: '번호는 수정하지 않음. 분류 결과는 확인용.'
  };

  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, 'exact.json'), JSON.stringify(exact, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, 'similar.json'), JSON.stringify(similar, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, 'unmatched.json'), JSON.stringify(unmatched, null, 2), 'utf8');

  const similarTop = similar.sort((a,b)=>b.score-a.score).slice(0, 40);
  fs.writeFileSync(path.join(outDir, 'review-top40.json'), JSON.stringify(similarTop, null, 2), 'utf8');

  console.log(JSON.stringify(summary));
})();
