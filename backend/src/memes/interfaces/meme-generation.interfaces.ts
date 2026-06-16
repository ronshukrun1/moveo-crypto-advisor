export interface PreviousDayMemeSelection {
  templateId: number;
  captionVariationId: string;
}

export interface MemeGenerationInput {
  userId: number;
  investorProfile: string;
  generatedForDate: string;
  selectedCoins: Array<{ id: number; symbol: string; name: string }>;
  marketItems: Array<{
    symbol: string;
    name: string;
    changePercentage24h: number | null;
  }>;
  previousDayMeme?: PreviousDayMemeSelection | null;
}
