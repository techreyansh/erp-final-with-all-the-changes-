import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = fs.readFileSync(path.join(__dirname, 'machine_schedules_paste.tsv'), 'utf8');
const lines = input.trim().split(/\r?\n/).filter(Boolean);
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

let out = 'INSERT INTO public.machine_schedules (sort_order, record) VALUES\n';
out += rows
  .map((r, i) => {
    const tag = `m${i}`;
    return `  (${i}, $${tag}$${JSON.stringify(r)}$${tag}$::jsonb)`;
  })
  .join(',\n');
out += ';\n';

fs.writeFileSync(path.join(__dirname, 'machine_schedules_insert.sql'), out, 'utf8');
console.log('Wrote', rows.length, 'rows');
