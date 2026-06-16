import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import CandlestickChartOutlinedIcon from '@mui/icons-material/CandlestickChartOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import type { ReactNode } from 'react';
import type { ContentPreferences, InvestorProfile } from '../types/onboarding';

export interface InvestorProfileOption {
  value: InvestorProfile;
  label: string;
  description: string;
  icon: ReactNode;
}

export interface ContentPreferenceOption {
  key: keyof ContentPreferences;
  label: string;
  description: string;
  icon: ReactNode;
  disclaimer?: string;
}

export const INVESTOR_PROFILE_OPTIONS: InvestorProfileOption[] = [
  {
    value: 'BEGINNER',
    label: 'Beginner',
    description: 'I am learning the basics of crypto markets.',
    icon: <SchoolOutlinedIcon />,
  },
  {
    value: 'LONG_TERM_HOLDER',
    label: 'Long-Term Holder',
    description: 'I mainly follow long-term market movement.',
    icon: <TimelineOutlinedIcon />,
  },
  {
    value: 'ACTIVE_TRADER',
    label: 'Active Trader',
    description: 'I monitor short-term price changes and market activity.',
    icon: <CandlestickChartOutlinedIcon />,
  },
  {
    value: 'CRYPTO_ENTHUSIAST',
    label: 'Crypto Enthusiast',
    description: 'I enjoy following technology, news, and market trends.',
    icon: <ExploreOutlinedIcon />,
  },
];

export const CONTENT_PREFERENCE_OPTIONS: ContentPreferenceOption[] = [
  {
    key: 'showMarketPrices',
    label: 'Market Prices',
    description: 'Live prices and 24-hour market changes.',
    icon: <ShowChartOutlinedIcon />,
  },
  {
    key: 'showNews',
    label: 'Crypto News',
    description: 'Relevant news for your selected coins.',
    icon: <ArticleOutlinedIcon />,
  },
  {
    key: 'showAiInsight',
    label: 'AI Insight',
    description: 'A short educational insight based on current market data and news.',
    icon: <AutoAwesomeOutlinedIcon />,
    disclaimer: 'For educational purposes only. Not financial advice.',
  },
  {
    key: 'showMeme',
    label: 'Crypto Meme',
    description: 'A light daily meme based on market movement.',
    icon: <EmojiEmotionsOutlinedIcon />,
  },
];

export const DEFAULT_CONTENT_PREFERENCES: ContentPreferences = {
  showMarketPrices: true,
  showNews: true,
  showAiInsight: true,
  showMeme: true,
};

export const ONBOARDING_STEP_LABELS = [
  'Investor profile',
  'Content preferences',
  'Select coins',
] as const;
