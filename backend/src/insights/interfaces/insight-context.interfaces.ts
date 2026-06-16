import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';

export interface InsightMarketFact {
  symbol: string;
  name: string;
  currentPrice: number | null;
  changePercentage24h: number | null;
  high24h: number | null;
  low24h: number | null;
}

export interface InsightNewsFact {
  title: string;
  description: string | null;
}

export interface InsightPromptContext {
  investorProfile: InvestorProfile;
  selectedCoins: Array<{ symbol: string; name: string }>;
  marketFacts: InsightMarketFact[];
  newsFacts: InsightNewsFact[];
}

export interface ModelInsightOutput {
  title: string;
  insight: string;
}
