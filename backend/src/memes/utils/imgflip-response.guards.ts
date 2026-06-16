import { BadGatewayException } from '@nestjs/common';
import { CaptionImageResult } from '../interfaces/imgflip.interfaces';

function isNonEmptyUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseImgflipCaptionImageResponse(
  data: unknown,
): CaptionImageResult {
  if (!data || typeof data !== 'object') {
    throw new BadGatewayException('Unable to generate meme');
  }

  const response = data as Record<string, unknown>;

  if (typeof response.success !== 'boolean') {
    throw new BadGatewayException('Unable to generate meme');
  }

  if (!response.success) {
    throw new BadGatewayException('Unable to generate meme');
  }

  if (!response.data || typeof response.data !== 'object') {
    throw new BadGatewayException('Unable to generate meme');
  }

  const imgflipData = response.data as Record<string, unknown>;

  if (!isNonEmptyUrl(imgflipData.url) || !isNonEmptyUrl(imgflipData.page_url)) {
    throw new BadGatewayException('Unable to generate meme');
  }

  return {
    url: imgflipData.url,
    pageUrl: imgflipData.page_url,
  };
}
