import { parseJsonArray, parseJsonObject } from './parseJsonField';

describe('parseJsonField utilities', () => {
  it('parses JSON arrays and wraps JSON objects as arrays', () => {
    expect(parseJsonArray('[{"name":"Cable"}]')).toEqual([{ name: 'Cable' }]);
    expect(parseJsonArray('{"name":"Connector"}')).toEqual([{ name: 'Connector' }]);
  });

  it('returns the provided array fallback for invalid array input', () => {
    const fallback = [{ name: 'Fallback' }];

    expect(parseJsonArray('not-json', fallback)).toBe(fallback);
    expect(parseJsonArray('', fallback)).toBe(fallback);
  });

  it('parses JSON objects and preserves object values', () => {
    const value = { status: 'active' };

    expect(parseJsonObject('{"status":"active"}')).toEqual(value);
    expect(parseJsonObject(value)).toBe(value);
  });

  it('returns the provided object fallback for non-object input', () => {
    const fallback = { status: 'unknown' };

    expect(parseJsonObject('[1,2,3]', fallback)).toBe(fallback);
    expect(parseJsonObject('bad-json', fallback)).toBe(fallback);
  });
});
