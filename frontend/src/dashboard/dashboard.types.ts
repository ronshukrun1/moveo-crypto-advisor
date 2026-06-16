import type { InvestorProfile } from '../types/onboarding';
import type { DashboardSectionStatus } from '../types/dashboard';

export interface DashboardUser {
  id: number;
  name: string;
  onboardingCompleted: boolean;
}

export interface DashboardPreferences {
  investorProfile: InvestorProfile;
  showMarketPrices: boolean;
  showNews: boolean;
  showAiInsight: boolean;
  showMeme: boolean;
}

export interface DashboardSelectedCoin {
  id: number;
  coingeckoId: string;
  symbol: string;
  name: string;
}

export interface MarketItem {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  marketCapRank: number | null;
  totalVolume: number | null;
  high24h: number | null;
  low24h: number | null;
  priceChange24h: number | null;
  changePercentage24h: number | null;
  lastUpdated: string | null;
}

export interface DashboardMarketSection {
  status: DashboardSectionStatus;
  items?: MarketItem[];
  isStale?: boolean;
  message?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  creator: string[] | null;
  relatedCoins: string[] | null;
  publishedAt: string | null;
}

export interface DashboardNewsSection {
  status: DashboardSectionStatus;
  items?: NewsItem[];
  nextPage?: string | null;
  isStale?: boolean;
  message?: string;
}

export interface DailyInsight {
  title: string;
  insight: string;
  disclaimer: string;
  generatedAt: string;
}

export interface DashboardInsightSection {
  status: DashboardSectionStatus;
  data?: DailyInsight;
  message?: string;
}

export interface DailyMeme {
  imageUrl: string;
  pageUrl: string;
  textTop: string;
  textBottom: string;
  generatedAt: string;
}

export interface DashboardMemeSection {
  status: DashboardSectionStatus;
  data?: DailyMeme;
  message?: string;
}

export interface DashboardResponse {
  user: DashboardUser;
  preferences: DashboardPreferences;
  selectedCoins: DashboardSelectedCoin[];
  market: DashboardMarketSection;
  news: DashboardNewsSection;
  insight: DashboardInsightSection;
  meme: DashboardMemeSection;
  generatedAt: string;
}
