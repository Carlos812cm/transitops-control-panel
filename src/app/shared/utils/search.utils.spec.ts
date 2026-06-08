import { filterBySearch, matchesSearchQuery, normalizeSearchValue } from './search.utils';

describe('search utils', () => {
  it('normalizes case', () => {
    expect(normalizeSearchValue('VoLvO')).toBe('volvo');
  });

  it('normalizes accents', () => {
    expect(normalizeSearchValue('  Camion: Mercedes-Benz  ')).toBe('camion mercedes benz');
    expect(matchesSearchQuery('lucia', ['Lucia Rojas'])).toBe(true);
    expect(matchesSearchQuery('lucia', ['Luc\u00eda Rojas'])).toBe(true);
  });

  it('ignores punctuation and symbols', () => {
    expect(normalizeSearchValue('ABC-123 / Norte (Sur).')).toBe('abc 123 norte sur');
    expect(matchesSearchQuery('abc', ['ABC-123'])).toBe(true);
    expect(matchesSearchQuery('bus10', ['BUS-101'])).toBe(true);
  });

  it('ignores multiple spaces', () => {
    expect(normalizeSearchValue('  Centro    Aeropuerto  ')).toBe('centro aeropuerto');
    expect(matchesSearchQuery('centro aeropuerto', ['Centro - Aeropuerto'])).toBe(true);
  });

  it('finds partial matches', () => {
    expect(matchesSearchQuery('mart', ['Martin Lopez'])).toBe(true);
    expect(matchesSearchQuery('lopez', ['Martin Lopez'])).toBe(true);
    expect(matchesSearchQuery('cedes', ['Mercedes-Benz'])).toBe(true);
    expect(matchesSearchQuery('vol', ['Volvo 9700'])).toBe(true);
    expect(matchesSearchQuery('1020', ['LIC-102030'])).toBe(true);
  });

  it('supports multiple tokens across a combined searchable value', () => {
    expect(matchesSearchQuery('centro aeropuerto', ['Centro - Aeropuerto'])).toBe(true);
    expect(matchesSearchQuery('jo pe', ['John Perez'])).toBe(true);
    expect(matchesSearchQuery('for tr', ['BUS-101', 'Ford', 'Transit'])).toBe(true);
    expect(matchesSearchQuery('pe jo', ['John Perez'])).toBe(true);
  });

  it('returns true when the query is empty', () => {
    expect(matchesSearchQuery('', ['Any record'])).toBe(true);
    expect(matchesSearchQuery('   ', ['Any record'])).toBe(true);
    expect(filterBySearch([{ name: 'A' }, { name: 'B' }], '', (item) => [item.name]).length).toBe(
      2,
    );
  });

  it('does not break with null or undefined values', () => {
    expect(normalizeSearchValue(null)).toBe('');
    expect(normalizeSearchValue(undefined)).toBe('');
    expect(matchesSearchQuery('abc', [null, undefined, ''])).toBe(false);
    expect(matchesSearchQuery('abc', [null, 'ABC-123'])).toBe(true);
  });

  it('filters collections through a typed selector', () => {
    const items = [
      { id: 1, name: 'Centro - Aeropuerto' },
      { id: 2, name: 'Norte - Sur' },
    ];

    expect(filterBySearch(items, 'sur', (item) => [item.name])).toEqual([items[1]]);
  });
});
