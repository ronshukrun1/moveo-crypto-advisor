import { InvestorProfile } from '../../preferences/enums/investor-profile.enum';

export interface InsightGenerationInput {
  investorProfile: InvestorProfile;
  selectedCoins: Array<{ id: number; symbol: string; name: string }>;
  marketItems: Array<{
    symbol: string;
    name: string;
    currentPrice: number | null;
    changePercentage24h: number | null;
    high24h: number | null;
    low24h: number | null;
  }>;
  newsItems: Array<{
    id: string;
    title: string;
    description: string | null;
  }>;
}
