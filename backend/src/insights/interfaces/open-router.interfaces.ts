export interface OpenRouterChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface OpenRouterChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
