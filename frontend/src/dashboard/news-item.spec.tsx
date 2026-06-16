import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NewsItem } from './NewsItem';
import type { DashboardFeedbackController } from './use-dashboard-feedback';
import type { NewsItem as NewsItemType } from './dashboard.types';

const mockFeedback: DashboardFeedbackController = {
  getVote: () => null,
  isSaving: () => false,
  getError: () => null,
  vote: vi.fn(),
};

const baseItem: NewsItemType = {
  id: 'news-1',
  title: 'Bitcoin market update',
  description: 'Short summary of the latest market activity.',
  url: 'https://example.com/news/bitcoin',
  imageUrl: null,
  sourceName: 'Crypto Daily',
  sourceUrl: 'https://example.com',
  creator: null,
  relatedCoins: ['BTC'],
  publishedAt: '2026-06-14T19:30:38.000Z',
  feedbackContentId: 'news-1',
};

describe('NewsItem thumbnail layout', () => {
  it('reserves the same thumbnail container with and without an image', () => {
    const { rerender } = render(
      <NewsItem item={{ ...baseItem, imageUrl: null }} feedback={mockFeedback} />,
    );

    const withoutImage = screen.getByTestId('news-article-thumbnail');
    expect(withoutImage).toHaveStyle({ width: '72px', height: '72px' });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    rerender(
      <NewsItem
        item={{ ...baseItem, imageUrl: 'https://example.com/article.jpg' }}
        feedback={mockFeedback}
      />,
    );

    const withImage = screen.getByTestId('news-article-thumbnail');
    expect(withImage).toHaveStyle({ width: '72px', height: '72px' });
    expect(
      screen.getByRole('img', { name: 'Article image for Bitcoin market update' }),
    ).toBeInTheDocument();
  });

  it('falls back to the placeholder when the image fails to load', () => {
    render(
      <NewsItem
        item={{ ...baseItem, imageUrl: 'https://example.com/broken.jpg' }}
        feedback={mockFeedback}
      />,
    );

    const image = screen.getByRole('img', { name: 'Article image for Bitcoin market update' });
    fireEvent.error(image);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('news-article-thumbnail')).toHaveStyle({
      width: '72px',
      height: '72px',
    });
  });
});
