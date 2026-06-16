import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';
import { DEFAULT_IMGFLIP_TEMPLATE_IDS } from '../../config/imgflip-template-ids.constants';
import { getEligibleCaptionVariationIds } from './meme-caption.builder';
import {
  getTemplateAttemptOrder,
  selectMemeVariation,
} from './meme-variation.utils';

const templateIds = [...DEFAULT_IMGFLIP_TEMPLATE_IDS];

describe('meme variation utils', () => {
  const baseInput = {
    userId: 1,
    generatedForDate: '2026-06-16',
    investorProfile: InvestorProfile.LONG_TERM_HOLDER,
    selectedCoinIds: [2, 1],
    templateIds,
    eligibleCaptionVariationIds: getEligibleCaptionVariationIds(
      'negative',
      InvestorProfile.LONG_TERM_HOLDER,
    ),
    previousDayMeme: null,
  };

  it('selects the same template and caption variation for the same inputs', () => {
    const first = selectMemeVariation(baseInput);
    const second = selectMemeVariation({
      ...baseInput,
      selectedCoinIds: [1, 2],
    });

    expect(first).toEqual(second);
  });

  it('does not repeat the same template on consecutive days when alternatives exist', () => {
    const today = selectMemeVariation(baseInput);
    const tomorrow = selectMemeVariation({
      ...baseInput,
      generatedForDate: '2026-06-17',
      previousDayMeme: {
        templateId: today.templateId,
        captionVariationId: today.captionVariationId,
      },
    });

    expect(tomorrow.templateId).not.toBe(today.templateId);
  });

  it('does not repeat the same caption variation on consecutive days when alternatives exist', () => {
    const today = selectMemeVariation(baseInput);
    const tomorrow = selectMemeVariation({
      ...baseInput,
      generatedForDate: '2026-06-17',
      previousDayMeme: {
        templateId: today.templateId,
        captionVariationId: today.captionVariationId,
      },
    });

    expect(tomorrow.captionVariationId).not.toBe(today.captionVariationId);
  });

  it('selects different variations for different users on the same date', () => {
    const userOne = selectMemeVariation(baseInput);
    const userTwo = selectMemeVariation({
      ...baseInput,
      userId: 2,
    });

    expect(
      userOne.templateId !== userTwo.templateId ||
        userOne.captionVariationId !== userTwo.captionVariationId,
    ).toBe(true);
  });

  it('returns the next deterministic template for fallback attempts', () => {
    const order = getTemplateAttemptOrder(templateIds, 3);

    expect(order).toHaveLength(2);
    expect(order[0]).toBe(templateIds[3]);
    expect(order[1]).toBe(templateIds[4]);
    expect(order[0]).not.toBe(order[1]);
  });
});
