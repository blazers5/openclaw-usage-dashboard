const fs = require('fs');
const path = require('path');

const key = 'sb_publishable_27Iqc8Qukobl8cK0PGUwzQ_HM5Gzw3n';
const url = 'https://lkcugkmkabeeeigkazzn.supabase.co/rest/v1/medicine_inventory?select=*&order=no.asc';

(async () => {
  const r = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!r.ok) throw new Error('fetch failed ' + r.status);
  const data = await r.json();

  const now = new Date();
  const ts = now.toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const dir = path.join('backups', 'medicine', 'snapshots');
  fs.mkdirSync(dir, { recursive: true });

  const jsonPath = path.join(dir, `medicine_inventory_${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

  const cols = ['id', 'no', 'name', 'code', 'expiry_date', 'created_at'];
  const csvEsc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = [cols.join(',')];
  for (const row of data) {
    lines.push(cols.map((c) => csvEsc(row[c])).join(','));
  }
  const csvPath = path.join(dir, `medicine_inventory_${ts}.csv`);
  fs.writeFileSync(csvPath, '\ufeff' + lines.join('\r\n'), 'utf8');

  const sqlEsc = (v) => "'" + String(v ?? '').replace(/'/g, "''") + "'";
  const values = data
    .map(
      (row) =>
        `(${row.id}, ${row.no}, ${sqlEsc(row.name)}, ${sqlEsc(row.code)}, ${row.expiry_date ? sqlEsc(row.expiry_date) : 'NULL'}, ${row.created_at ? sqlEsc(row.created_at) : 'NULL'})`
    )
    .join(',\n');
  const sqlPath = path.join(dir, `medicine_inventory_restore_${ts}.sql`);
  const sql = `-- restore snapshot ${ts}\nbegin;\ntruncate table public.medicine_inventory restart identity;\ninsert into public.medicine_inventory (id,no,name,code,expiry_date,created_at) values\n${values};\nselect setval(pg_get_serial_sequence('public.medicine_inventory','id'), (select coalesce(max(id),1) from public.medicine_inventory), true);\ncommit;\n`;
  fs.writeFileSync(sqlPath, sql, 'utf8');

  console.log(JSON.stringify({ count: data.length, jsonPath, csvPath, sqlPath }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
