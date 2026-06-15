export interface NewsDataArticle {
  article_id: string;
  link: string;
  title: string;
  description: string | null;
  keywords: string[] | null;
  creator: string[] | null;
  coin: string[] | null;
  language: string | null;
  pubDate: string | null;
  image_url: string | null;
  source_id: string | null;
  source_name: string | null;
  source_url: string | null;
}

export interface NewsDataResponse {
  status: string;
  totalResults: number | null;
  results: NewsDataArticle[];
  nextPage: string | null;
}
