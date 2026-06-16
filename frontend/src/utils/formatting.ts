const usdFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatUsdPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  return usdFormatter.format(value);
}

export function formatPercentageChange(value: number | null | undefined): {
  label: string;
  direction: 'positive' | 'negative' | 'neutral';
} {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { label: '—', direction: 'neutral' };
  }

  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  const prefix = value > 0 ? '+' : '';
  const label = `${prefix}${percentFormatter.format(value / 100)}`;

  return { label, direction };
}

export function formatIsoDateTime(value: string | null | undefined): string {
  const date = parseIsoDate(value);

  if (!date) {
    return '—';
  }

  return dateTimeFormatter.format(date);
}

export function formatRelativePublicationTime(value: string | null | undefined): string {
  const date = parseIsoDate(value);

  if (!date) {
    return '—';
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffDays) < 7) {
    return relativeTimeFormatter.format(diffDays, 'day');
  }

  return dateTimeFormatter.format(date);
}
