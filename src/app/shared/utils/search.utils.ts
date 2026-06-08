export function matchesSearchQuery(query: unknown, values: unknown[]): boolean {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const queryTokens = splitSearchTokens(normalizedQuery);
  const searchableTokens = values.flatMap((value) =>
    splitSearchTokens(normalizeSearchValue(value)),
  );

  if (searchableTokens.length === 0) {
    return false;
  }

  if (queryTokens.length === 1) {
    const [queryToken] = queryTokens;

    return (
      searchableTokens.some((token) => token.startsWith(queryToken)) ||
      hasCompactPrefixMatch(queryToken, searchableTokens)
    );
  }

  let nextTokenIndex = 0;

  return queryTokens.every((queryToken) => {
    const matchIndex = searchableTokens.findIndex(
      (token, index) => index >= nextTokenIndex && token.startsWith(queryToken),
    );

    if (matchIndex === -1) {
      return false;
    }

    nextTokenIndex = matchIndex + 1;
    return true;
  });
}

export function normalizeSearchValue(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function splitSearchTokens(value: string): string[] {
  return value ? value.split(' ') : [];
}

function hasCompactPrefixMatch(queryToken: string, searchableTokens: string[]): boolean {
  return searchableTokens.some((_, index) =>
    searchableTokens.slice(index).join('').startsWith(queryToken),
  );
}
