import { createHash } from 'crypto';

export type NewsCacheLayer = 'fresh' | 'stale';

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
  page: string | undefined,
  layer: NewsCacheLayer,
): string {
  const sortedSymbols = [...symbols]
    .map((symbol) => symbol.toUpperCase())
    .sort();

  return `news:${layer}:${sortedSymbols.join(',')}:limit=${limit}:page=${encodePageToken(page)}`;
}
