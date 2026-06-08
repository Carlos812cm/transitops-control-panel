export function normalizeSearchValue(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchesSearchQuery(query: unknown, values: unknown[]): boolean {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = normalizeSearchValue(values.join(' '));

  if (!searchableText) {
    return false;
  }

  const compactSearchableText = searchableText.replace(/\s+/g, '');
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const compactQuery = tokens.join('');

  const matchesAllTokens = tokens.every((token) => {
    const compactToken = token.replace(/\s+/g, '');

    return searchableText.includes(token) || compactSearchableText.includes(compactToken);
  });

  return matchesAllTokens || compactSearchableText.includes(compactQuery);
}

export function filterBySearch<T>(
  items: T[],
  query: unknown,
  selector: (item: T) => unknown[],
): T[] {
  return items.filter((item) => matchesSearchQuery(query, selector(item)));
}
