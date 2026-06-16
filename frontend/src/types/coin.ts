export interface Coin {
  id: number;
  coingeckoId: string;
  symbol: string;
  name: string;
}

export interface CoinsListResponse {
  items: Coin[];
}
