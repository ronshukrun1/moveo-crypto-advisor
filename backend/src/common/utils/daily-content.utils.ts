import { createHash } from 'crypto';

export function getUtcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getPreviousUtcDateString(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);

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

export function buildMemeContextHash(params: {
  userId: number;
  investorProfile: string;
  selectedCoinIds: number[];
  templatePoolVersion: string;
}): string {
  const sortedCoinIds = [...params.selectedCoinIds].sort(
    (left, right) => left - right,
  );

  return createHash('sha256')
    .update(
      JSON.stringify({
        userId: params.userId,
        investorProfile: params.investorProfile,
        selectedCoinIds: sortedCoinIds,
        templatePoolVersion: params.templatePoolVersion,
      }),
    )
    .digest('hex');
}
