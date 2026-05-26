/**
 * Usage: node scripts/audit_tsv_to_sql.mjs < audit_paste.tsv > audit_log_inserts.sql
 * Expects header: LogId\tPOId\tPreviousStatus\tNewStatus\tUserId\tTimestamp
 */
import fs from 'fs';

const input = fs.readFileSync(0, 'utf8');
const lines = input.trim().split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  console.error('Need header + at least one data row on stdin');
  process.exit(1);
}
const header = lines[0].split('\t');
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split('\t');
  const o = {};
  header.forEach((h, j) => {
    o[h] = cols[j] ?? '';
  });
  rows.push(o);
}

let out = 'INSERT INTO public.audit_log (sort_order, record) VALUES\n';
out += rows
  .map((r, i) => {
    const tag = `j${i}`;
    return `  (${i}, $${tag}$${JSON.stringify(r)}$${tag}$::jsonb)`;
  })
  .join(',\n');
out += ';\n';
process.stdout.write(out);
