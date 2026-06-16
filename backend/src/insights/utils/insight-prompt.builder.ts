import { InsightPromptContext } from '../interfaces/insight-context.interfaces';

const SYSTEM_PROMPT = `You are an educational crypto market assistant.
Use only the facts supplied in the user message.
Produce neutral, educational content that describes current market context.
Do not make unsupported causal claims.
Do not invent statistics, prices, events, or headlines.
Do not predict future prices or returns.
Do not recommend buying, selling, holding, entering, exiting, or timing the market.
Do not suggest an investment opportunity.
Do not include a disclaimer.
Return valid JSON only with exactly two fields: "title" and "insight".
The insight must contain exactly two short sentences.
Do not use Markdown.
Do not include any keys other than "title" and "insight".`;

export function buildInsightSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

function formatMarketFact(
  fact: InsightPromptContext['marketFacts'][number],
): string {
  const price =
    fact.currentPrice === null ? 'unknown' : fact.currentPrice.toString();
  const change =
    fact.changePercentage24h === null
      ? 'unknown'
      : `${fact.changePercentage24h}%`;
  const high = fact.high24h === null ? 'unknown' : fact.high24h.toString();
  const low = fact.low24h === null ? 'unknown' : fact.low24h.toString();

  return `${fact.name} (${fact.symbol}): price ${price}, 24h change ${change}, 24h high ${high}, 24h low ${low}`;
}

function formatNewsFact(
  fact: InsightPromptContext['newsFacts'][number],
): string {
  const description = fact.description?.trim() || 'No description provided';
  return `Headline: ${fact.title}. Description: ${description}`;
}

export function buildInsightUserPrompt(context: InsightPromptContext): string {
  const selectedCoins = context.selectedCoins
    .map((coin) => `${coin.name} (${coin.symbol})`)
    .join(', ');
  const marketFacts = context.marketFacts.map(formatMarketFact).join('\n');
  const newsFacts =
    context.newsFacts.length > 0
      ? context.newsFacts.map(formatNewsFact).join('\n')
      : 'No recent headlines were provided.';

  return [
    `Investor profile: ${context.investorProfile}`,
    `Selected coins: ${selectedCoins}`,
    'Current market facts:',
    marketFacts,
    'Recent headlines:',
    newsFacts,
    'Write a concise educational update using only these facts.',
  ].join('\n');
}

export function buildInsightMessages(
  context: InsightPromptContext,
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: buildInsightSystemPrompt() },
    { role: 'user', content: buildInsightUserPrompt(context) },
  ];
}
