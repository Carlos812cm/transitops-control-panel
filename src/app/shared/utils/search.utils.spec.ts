import { matchesSearchQuery, normalizeSearchValue } from './search.utils';

describe('search utils', () => {
  it('normalizes case, accents, punctuation and extra spaces', () => {
    expect(normalizeSearchValue('  Ruta: M\u00e9xico  Norte  ')).toBe('ruta mexico norte');
  });

  it('matches word prefixes from left to right', () => {
    expect(matchesSearchQuery('jo pe', ['John Perez'])).toBe(true);
    expect(matchesSearchQuery('for tr', ['BUS-101', 'Ford', 'Transit'])).toBe(true);
  });

  it('does not match letters from the middle of a word', () => {
    expect(matchesSearchQuery('ohn', ['John Perez'])).toBe(false);
    expect(matchesSearchQuery('ans', ['Ford Transit'])).toBe(false);
  });

  it('does not match query terms written out of order', () => {
    expect(matchesSearchQuery('pe jo', ['John Perez'])).toBe(false);
  });

  it('restores all records when the query is empty', () => {
    expect(matchesSearchQuery('', ['Any record'])).toBe(true);
    expect(matchesSearchQuery('   ', ['Any record'])).toBe(true);
  });

  it('supports compact prefixes for codes typed without separators', () => {
    expect(matchesSearchQuery('bus10', ['BUS-101'])).toBe(true);
    expect(matchesSearchQuery('fordtr', ['BUS-101', 'Ford', 'Transit'])).toBe(true);
  });
});
