import { createHash } from 'crypto';
import { buildTemplatePoolVersion } from '../../config/imgflip-template-ids.utils';
import type { PreviousDayMemeSelection } from '../interfaces/meme-generation.interfaces';

export type { PreviousDayMemeSelection };

export interface MemeVariationSeedInput {
  userId: number;
  generatedForDate: string;
  investorProfile: string;
  selectedCoinIds: number[];
  templateIds: number[];
}

export interface MemeVariationSelectionInput extends MemeVariationSeedInput {
  eligibleCaptionVariationIds: readonly string[];
  previousDayMeme?: PreviousDayMemeSelection | null;
}

export interface MemeVariationSelection {
  templateId: number;
  captionVariationId: string;
  seed: string;
  templateIndex: number;
}

function sortCoinIds(selectedCoinIds: number[]): number[] {
  return [...selectedCoinIds].sort((left, right) => left - right);
}

export function buildMemeVariationSeed(input: MemeVariationSeedInput): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        userId: input.userId,
        generatedForDate: input.generatedForDate,
        investorProfile: input.investorProfile,
        selectedCoinIds: sortCoinIds(input.selectedCoinIds),
        templatePoolVersion: buildTemplatePoolVersion(input.templateIds),
      }),
    )
    .digest('hex');
}

function selectIndexFromSeed(
  seed: string,
  offset: number,
  poolSize: number,
): number {
  const slice = seed.slice(offset, offset + 8);
  const value = Number.parseInt(slice, 16);

  return value % poolSize;
}

function avoidConsecutiveIndex<T>(
  pool: readonly T[],
  selectedIndex: number,
  previousValue: T | null | undefined,
  getCompareValue: (item: T) => unknown = (item) => item,
): number {
  if (
    pool.length <= 1 ||
    previousValue === undefined ||
    previousValue === null
  ) {
    return selectedIndex;
  }

  if (getCompareValue(pool[selectedIndex]) !== previousValue) {
    return selectedIndex;
  }

  return (selectedIndex + 1) % pool.length;
}

export function getTemplateAttemptOrder(
  templateIds: readonly number[],
  primaryIndex: number,
): number[] {
  if (templateIds.length === 0) {
    return [];
  }

  const primaryTemplateId = templateIds[primaryIndex];
  const fallbackIndex = (primaryIndex + 1) % templateIds.length;
  const fallbackTemplateId = templateIds[fallbackIndex];

  if (fallbackTemplateId === primaryTemplateId) {
    return [primaryTemplateId];
  }

  return [primaryTemplateId, fallbackTemplateId];
}

export function selectMemeVariation(
  input: MemeVariationSelectionInput,
): MemeVariationSelection {
  if (input.eligibleCaptionVariationIds.length === 0) {
    throw new Error('No eligible caption variations for meme generation');
  }

  const seed = buildMemeVariationSeed(input);
  let templateIndex = selectIndexFromSeed(seed, 0, input.templateIds.length);
  templateIndex = avoidConsecutiveIndex(
    input.templateIds,
    templateIndex,
    input.previousDayMeme?.templateId ?? null,
    (templateId) => templateId,
  );

  let captionIndex = selectIndexFromSeed(
    seed,
    8,
    input.eligibleCaptionVariationIds.length,
  );
  captionIndex = avoidConsecutiveIndex(
    input.eligibleCaptionVariationIds,
    captionIndex,
    input.previousDayMeme?.captionVariationId ?? null,
    (captionVariationId) => captionVariationId,
  );

  return {
    templateId: input.templateIds[templateIndex],
    captionVariationId: input.eligibleCaptionVariationIds[captionIndex],
    seed,
    templateIndex,
  };
}
