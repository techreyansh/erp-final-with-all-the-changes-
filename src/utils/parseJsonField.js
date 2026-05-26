/**
 * Fields like Contacts / Products may be JSON strings (Sheets legacy) or jsonb (object/array from Supabase).
 * JSON.parse(object) coerces to "[object Object]" and throws — use these helpers instead.
 */

export function parseJsonArray(value, fallback = []) {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return [value];
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return fallback;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
      return fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function parseJsonObject(value, fallback = {}) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return fallback;
    try {
      const parsed = JSON.parse(s);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}
