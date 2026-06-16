import { InsightGenerationInput } from '../interfaces/insight-generation.interfaces';
import { InsightSourceDataSnapshot } from '../entities/daily-insight.entity';

export function buildInsightSourceSnapshot(
  input: InsightGenerationInput,
): InsightSourceDataSnapshot {
  return {
    investorProfile: input.investorProfile,
    selectedCoins: input.selectedCoins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
    })),
    marketFacts: input.marketItems.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      currentPrice: item.currentPrice,
      changePercentage24h: item.changePercentage24h,
      high24h: item.high24h,
      low24h: item.low24h,
    })),
    newsFacts: input.newsItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
    })),
  };
}
