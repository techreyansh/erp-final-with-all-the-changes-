const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://azwdxgahmdgccfimhtmm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YxXj5yo7tRaXmNy9zEW21g_-UWlBRTg';
const TARGET_TABLE = 'clients2';

function parseDelimited(text, delimiter = '\t') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      row.push(field);
      field = '';
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((v) => String(v).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((v) => String(v).trim() !== '')) rows.push(row);
  }

  return rows;
}

function clean(v) {
  return v == null ? '' : String(v).trim();
}

function toNumber(v) {
  const t = clean(v);
  if (!t) return 0;
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function toMaybeNumber(v) {
  const t = clean(v);
  if (!t) return null;
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function toJsonTextArray(v) {
  const t = clean(v);
  if (!t) return '[]';
  try {
    const parsed = JSON.parse(t);
    return JSON.stringify(Array.isArray(parsed) ? parsed : []);
  } catch {
    return '[]';
  }
}

async function main() {
  const chunks = [];
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = chunks.join('');

  if (!raw.trim()) {
    throw new Error('No input text found on stdin.');
  }

  const rows = parseDelimited(raw, '\t');
  if (rows.length < 2) throw new Error('Input has no data rows.');

  const headers = rows[0].map((h) => clean(h));
  const dataRows = rows.slice(1);

  const mapped = dataRows.map((cells) => {
    const get = (name) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? cells[idx] ?? '' : '';
    };
    return {
      ClientName: clean(get('ClientName')),
      ClientCode: clean(get('ClientCode')),
      BusinessType: clean(get('BusinessType')),
      Industry: clean(get('Industry')),
      Address: clean(get('Address')),
      City: clean(get('City')),
      State: clean(get('State')),
      StateCode: clean(get('StateCode')),
      PinCode: clean(get('PinCode')),
      Country: clean(get('Country')) || 'India',
      GSTIN: clean(get('GSTIN')),
      PANNumber: clean(get('PANNumber')),
      AccountCode: clean(get('AccountCode')),
      Website: clean(get('Website')),
      Contacts: toJsonTextArray(get('Contacts')),
      PaymentTerms: clean(get('PaymentTerms')),
      CreditLimit: toMaybeNumber(get('CreditLimit')) ?? 0,
      CreditPeriod: toMaybeNumber(get('CreditPeriod')),
      DeliveryTerms: clean(get('DeliveryTerms')),
      Products: toJsonTextArray(get('Products')),
      Notes: clean(get('Notes')),
      Status: clean(get('Status')) || 'Active',
      Rating: toNumber(get('Rating')),
      LastContactDate: clean(get('LastContactDate')) || null,
      TotalOrders: toNumber(get('TotalOrders')),
      TotalValue: toNumber(get('TotalValue')),
    };
  }).filter((r) => r.ClientCode);

  const uniqueByCode = new Map();
  for (const row of mapped) uniqueByCode.set(row.ClientCode, row);
  const payload = Array.from(uniqueByCode.values());

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase
    .from(TARGET_TABLE)
    .upsert(payload, { onConflict: 'ClientCode' })
    .select('ClientCode');

  if (error) throw error;

  console.log(`UPSERT_OK input_rows=${dataRows.length} unique_client_codes=${payload.length} affected=${data?.length || 0}`);
}

main().catch((err) => {
  console.error(`IMPORT_ERR ${err.message}`);
  process.exit(1);
});

