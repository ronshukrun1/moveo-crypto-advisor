import { createHash } from 'crypto';

function encodePageToken(page?: string): string {
  const trimmed = page?.trim();

  if (!trimmed) {
    return 'first';
  }

  return createHash('sha256').update(trimmed).digest('hex').slice(0, 16);
}

export function buildNewsCacheKey(
  symbols: string[],
  limit: number,
  page?: string,
): string {
  const sortedSymbols = [...symbols]
    .map((symbol) => symbol.toUpperCase())
    .sort();

  return `news:${sortedSymbols.join(',')}:limit=${limit}:page=${encodePageToken(page)}`;
}
