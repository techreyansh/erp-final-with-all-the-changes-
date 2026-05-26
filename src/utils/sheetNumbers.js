/**
 * Sheet / Supabase row fields often arrive as "" or whitespace from MUI inputs.
 * Postgres integer/numeric columns reject ""; coerce to real numbers.
 * Plain objects (e.g. mistaken { nextStep: 4 }) must not become "[object Object]".
 */
function unwrapNumericishObject(value) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return (
    value.value ??
    value.currentStep ??
    value.CurrentStep ??
    value.nextStep ??
    value.NextStep ??
    value.stepId ??
    value.StepId ??
    value.step
  );
}

export function sheetInt(value, defaultValue = 0) {
  if (value == null) return defaultValue;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Math.trunc(value);
  }
  const inner = unwrapNumericishObject(value);
  if (inner !== undefined) return sheetInt(inner, defaultValue);
  const str = String(value).trim();
  if (str === '' || str === '[object Object]') return defaultValue;
  const n = parseInt(str, 10);
  return Number.isFinite(n) ? n : defaultValue;
}

export function sheetFloat(value, defaultValue = 0) {
  if (value == null) return defaultValue;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const inner = unwrapNumericishObject(value);
  if (inner !== undefined) return sheetFloat(inner, defaultValue);
  const str = String(value).replace(/,/g, '').trim();
  if (str === '' || str === '[object Object]') return defaultValue;
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : defaultValue;
}
