import { MemeSourceDataSnapshot } from '../entities/daily-meme.entity';
import { MemeGenerationInput } from '../interfaces/meme-generation.interfaces';
import {
  buildMemeCaptions,
  selectMostVolatileMarketItem,
  type MemeCaptionVariationId,
} from './meme-caption.builder';

export function buildMemeSourceSnapshot(
  input: MemeGenerationInput,
  templateId: number,
  captionVariationId: MemeCaptionVariationId,
): MemeSourceDataSnapshot {
  const selectedMarketItem = selectMostVolatileMarketItem(
    input.marketItems.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      changePercentage24h: item.changePercentage24h,
    })),
  );

  return {
    templateId,
    captionVariationId,
    investorProfile: input.investorProfile,
    selectedCoins: input.selectedCoins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
    })),
    selectedMarketItem: {
      symbol: selectedMarketItem.symbol,
      name: selectedMarketItem.name,
      changePercentage24h: selectedMarketItem.changePercentage24h,
    },
  };
}

export function buildCaptionsForSnapshot(
  input: MemeGenerationInput,
  captionVariationId: MemeCaptionVariationId,
) {
  return buildMemeCaptions(
    input.marketItems.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      changePercentage24h: item.changePercentage24h,
    })),
    input.investorProfile,
    captionVariationId,
  );
}
