export interface MemeGenerationInput {
  selectedCoins: Array<{ symbol: string; name: string }>;
  marketItems: Array<{
    symbol: string;
    name: string;
    changePercentage24h: number | null;
  }>;
}
