export const endpoints = {
  health: '/health',
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
  },
  coins: '/coins',
  preferences: '/preferences',
  selectedCoins: '/selected-coins',
  onboarding: '/onboarding',
  market: '/market',
  news: '/news',
  insights: {
    daily: '/insights/daily',
  },
  memes: {
    daily: '/memes/daily',
  },
  dashboard: '/dashboard',
  feedback: '/feedback',
} as const;
