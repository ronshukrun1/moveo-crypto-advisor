import { MemeSourceDataSnapshot } from '../entities/daily-meme.entity';
import { MemeGenerationInput } from '../interfaces/meme-generation.interfaces';

export function buildMemeSourceSnapshot(
  input: MemeGenerationInput,
  templateId: number,
): MemeSourceDataSnapshot {
  return {
    templateId,
    selectedCoins: input.selectedCoins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
    })),
    marketFacts: input.marketItems.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      changePercentage24h: item.changePercentage24h,
    })),
  };
}
