import { evaluateQuery } from './query';

describe('evaluateQuery', () => {
  const rec = {
    country: 'US',
    events_count: 150,
    platform: 'ios',
    nested: { value: 10 }
  };

  it('returns true for empty query', () => {
    expect(evaluateQuery(rec, '')).toBe(true);
  });

  it('supports equality and numeric comparisons', () => {
    expect(evaluateQuery(rec, "country == 'US'")).toBe(true);
    expect(evaluateQuery(rec, "events_count > 100")).toBe(true);
    expect(evaluateQuery(rec, "events_count <= 100")).toBe(false);
  });

  it('supports and/or chaining', () => {
    expect(evaluateQuery(rec, "country == 'US' and events_count > 100")).toBe(true);
    expect(evaluateQuery(rec, "country == 'CA' or platform == 'ios'")).toBe(true);
    expect(evaluateQuery(rec, "country == 'CA' and platform == 'ios'")).toBe(false);
  });

  it('supports dot paths', () => {
    expect(evaluateQuery(rec, "nested.value == 10")).toBe(true);
  });
});
