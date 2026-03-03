import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider, AiProviderConfig } from '../ai.interface';
import { AiExplanationResponse } from '../../../types';
import logger from '../../../config/logger';

export class GoogleProvider implements AiProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Google API key is required for GoogleProvider');
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-1.5-pro';
    this.maxRetries = config.maxRetries || 3;
    this.timeoutMs = config.timeoutMs || 30000;

    logger.info('GoogleProvider initialized', { model: this.model });
  }

  getProviderName(): string {
    return 'google';
  }

  async generateExplanation(
    questionText: string,
    options: Record<string, string>,
    correctAnswer: string,
    userAnswer?: string
  ): Promise<AiExplanationResponse> {
    const prompt = this.buildPrompt(questionText, options, correctAnswer, userAnswer);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug(`GoogleProvider: attempt ${attempt}/${this.maxRetries}`);

        const model = this.genAI.getGenerativeModel({ model: this.model });

        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI request timeout')), this.timeoutMs)
          ),
        ]);

        const response = result.response;
        const text = response.text();

        // Parse JSON from response (strip markdown if present)
        let jsonStr = text;
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr) as AiExplanationResponse;
        return parsed;
      } catch (error) {
        logger.error(`GoogleProvider attempt ${attempt} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (attempt === this.maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('All retry attempts exhausted');
  }

  private buildPrompt(
    questionText: string,
    options: Record<string, string>,
    correctAnswer: string,
    userAnswer?: string
  ): string {
    const optionsText = Object.entries(options)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `You are an expert exam preparation tutor. Analyze this question and provide a detailed explanation.

QUESTION:
${questionText}

OPTIONS:
${optionsText}

CORRECT ANSWER: ${correctAnswer}
${userAnswer ? `USER'S ANSWER: ${userAnswer}` : ''}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no extra text. Use this exact structure:
{
  "stepByStep": "Step-by-step explanation of how to arrive at the correct answer",
  "conceptual": "Deep conceptual explanation of the underlying topic",
  "examOriented": "Exam-specific tips and what to look for in similar questions",
  "correctAnswerExplanation": "Why the correct answer is right",
  "wrongOptionsExplanation": {
    "A": "Why option A is wrong (or right if it's the correct answer)",
    "B": "Why option B is wrong (or right if it's the correct answer)",
    "C": "Why option C is wrong (or right if it's the correct answer)",
    "D": "Why option D is wrong (or right if it's the correct answer)"
  },
  "examTrap": "Common trap or mistake students make with this type of question",
  "memoryTrick": "A memorable trick or mnemonic to remember the concept"
}`;
  }
}
