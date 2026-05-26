// Company Calendar (Holiday Overrides) Service
// Persists include/exclude day overrides in Google Sheets and keeps an in-memory cache

import sheetService from './sheetService';

const SHEET_NAME = 'CompanyCalendar';

// In-memory cache: key yyyy-mm-dd -> 'include' | 'exclude'
let overridesMap = new Map();
let loaded = false;

const toKey = (date) => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export async function loadOverrides(force = false) {
  if (loaded && !force) return overridesMap;
  try {
    const rows = await sheetService.getSheetData(SHEET_NAME);
    const map = new Map();
    rows.forEach((row) => {
      const key = (row.Date || row.date || '').trim();
      const action = (row.Action || row.action || '').toLowerCase();
      if (key && (action === 'include' || action === 'exclude')) {
        map.set(key, action);
      }
    });
    overridesMap = map;
    loaded = true;
    return overridesMap;
  } catch (e) {
    // If sheet does not exist, keep empty map (feature is optional)
    overridesMap = new Map();
    loaded = true;
    return overridesMap;
  }
}

export function getOverrideForDate(date) {
  const key = toKey(date);
  return overridesMap.get(key) || null;
}

export async function setOverride(date, action = null, note = '') {
  // action: 'include' | 'exclude' | null (to clear)
  await loadOverrides();
  const key = toKey(date);

  const rows = await sheetService.getSheetData(SHEET_NAME).catch(() => []);
  const idx = rows.findIndex((r) => (r.Date || r.date) === key);

  if (!action) {
    // remove override
    if (idx !== -1) {
      await sheetService.deleteRow(SHEET_NAME, idx + 2);
    }
    overridesMap.delete(key);
    return;
  }

  const payload = { Date: key, Action: action === 'include' ? 'include' : 'exclude', Note: note || '' };
  if (idx === -1) {
    await sheetService.appendRow(SHEET_NAME, payload);
  } else {
    await sheetService.updateRow(SHEET_NAME, idx + 2, payload);
  }
  overridesMap.set(key, payload.Action);
}

export function getAllOverrides() {
  return Array.from(overridesMap.entries()).map(([date, action]) => ({ date, action }));
}

