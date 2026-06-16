import { BadGatewayException } from '@nestjs/common';

export function parseOpenRouterChatCompletionContent(data: unknown): string {
  if (!data || typeof data !== 'object') {
    throw new BadGatewayException('Unable to generate insight');
  }

  const response = data as Record<string, unknown>;

  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    throw new BadGatewayException('Unable to generate insight');
  }

  const choices = response.choices as unknown[];
  const firstChoice = choices[0];

  if (!firstChoice || typeof firstChoice !== 'object') {
    throw new BadGatewayException('Unable to generate insight');
  }

  const message = (firstChoice as Record<string, unknown>).message;

  if (!message || typeof message !== 'object') {
    throw new BadGatewayException('Unable to generate insight');
  }

  const content = (message as Record<string, unknown>).content;

  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new BadGatewayException('Unable to generate insight');
  }

  return content;
}
