import { BadGatewayException } from '@nestjs/common';
import { ModelInsightOutput } from '../interfaces/insight-context.interfaces';

const RECOMMENDATION_PATTERNS = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\bgood time to invest\b/i,
  /\binvestment opportunity\b/i,
  /\bguaranteed return\b/i,
  /\bexpected profit\b/i,
];

export function countSentences(text: string): number {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0).length;
}

function containsRecommendationLanguage(text: string): boolean {
  return RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(text));
}

export function validateModelInsightOutput(value: unknown): ModelInsightOutput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadGatewayException('Unable to generate insight');
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);

  if (
    keys.length !== 2 ||
    !keys.includes('title') ||
    !keys.includes('insight')
  ) {
    throw new BadGatewayException('Unable to generate insight');
  }

  const title = record.title;
  const insight = record.insight;

  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new BadGatewayException('Unable to generate insight');
  }

  if (typeof insight !== 'string' || insight.trim().length === 0) {
    throw new BadGatewayException('Unable to generate insight');
  }

  if (countSentences(insight) !== 2) {
    throw new BadGatewayException('Unable to generate insight');
  }

  const combinedText = `${title} ${insight}`;

  if (containsRecommendationLanguage(combinedText)) {
    throw new BadGatewayException('Unable to generate insight');
  }

  return {
    title: title.trim(),
    insight: insight.trim(),
  };
}

export function parseModelInsightContent(content: string): ModelInsightOutput {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new BadGatewayException('Unable to generate insight');
  }

  return validateModelInsightOutput(parsed);
}
