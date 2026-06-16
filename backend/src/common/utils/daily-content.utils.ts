import { createHash } from 'crypto';

export function getUtcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function buildInsightContextHash(
  investorProfile: string,
  selectedCoinIds: number[],
): string {
  const sortedCoinIds = [...selectedCoinIds].sort(
    (left, right) => left - right,
  );

  return createHash('sha256')
    .update(
      JSON.stringify({
        investorProfile,
        selectedCoinIds: sortedCoinIds,
      }),
    )
    .digest('hex');
}

export function buildMemeContextHash(
  selectedCoinIds: number[],
  templateId: number,
): string {
  const sortedCoinIds = [...selectedCoinIds].sort(
    (left, right) => left - right,
  );

  return createHash('sha256')
    .update(
      JSON.stringify({
        selectedCoinIds: sortedCoinIds,
        templateId,
      }),
    )
    .digest('hex');
}
