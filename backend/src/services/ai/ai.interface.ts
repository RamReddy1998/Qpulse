import { AiExplanationResponse } from '../../types';

export interface AiProviderConfig {
  apiKey?: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface AiProvider {
  /**
   * Generate an explanation for a question
   */
  generateExplanation(
    questionText: string,
    options: Record<string, string>,
    correctAnswer: string,
    userAnswer?: string
  ): Promise<AiExplanationResponse>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}
