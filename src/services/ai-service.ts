import OpenAI from 'openai';
import { AIServiceError } from '../types/ai';

export class AIService {
  private client: OpenAI;
  private model: string;
  private timeout: number = 30000;

  constructor(endpoint: string, apiKey: string, model: string) {
    this.model = model;

    // Create OpenAI client with custom base URL (supports any OpenAI-compatible API)
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: endpoint.replace('/chat/completions', ''), // Extract base URL
      timeout: this.timeout,
      dangerouslyAllowBrowser: true, // Required for Chrome extensions
    });
  }

  async improveDescription(
    originalText: string,
    promptTemplate: string,
    length: 'concise' | 'standard' | 'detailed' = 'standard',
    customPrompt?: string,
  ): Promise<string> {
    const prompt = this.buildPrompt(originalText, promptTemplate);
    const systemPrompt = this.buildSystemPrompt(length, customPrompt);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: this.getMaxTokensForLength(length),
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw this.createError('No response from AI service');
      }

      const content = completion.choices[0].message.content;
      if (!content) {
        throw this.createError('Empty response from AI service');
      }

      return content.trim();
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw this.createError(`API Error: ${error.message}`, error.status);
      }

      if (error instanceof Error) {
        throw this.createError(error.message);
      }

      throw this.createError('Unknown error occurred');
    }
  }

  private buildPrompt(originalText: string, template: string): string {
    return template.replace('{{DESCRIPTION}}', originalText);
  }

  private buildSystemPrompt(
    length: 'concise' | 'standard' | 'detailed',
    customPrompt?: string,
  ): string {
    const basePrompt =
      'You are a technical writing assistant specializing in improving Jira ticket descriptions. Provide clear, structured, and actionable descriptions.';

    const lengthInstructions = {
      concise:
        ' Keep the description concise and to the point - aim for 2-3 short paragraphs maximum (around 50 - 150 words). Focus on the essential information only.',
      standard:
        ' Provide a balanced description with moderate detail - aim for 3-4 (around 150 - 300 words) paragraphs covering the key aspects.',
      detailed:
        ' Provide a comprehensive and detailed description - include thorough explanations, potential edge cases, and implementation considerations. Aim for 5+ paragraphs (300+ words) with extensive detail.',
    };

    let systemPrompt = basePrompt + lengthInstructions[length];

    if (customPrompt && customPrompt.trim()) {
      systemPrompt += `\n\n**CRITICAL - USER-DEFINED REQUIREMENTS (HIGHEST PRIORITY):**\n${customPrompt.trim()}\n\nThe above user-defined requirements take absolute precedence over all other instructions. You must follow them exactly, even if they conflict with the base guidelines.`;
    }

    return systemPrompt;
  }

  private getMaxTokensForLength(length: 'concise' | 'standard' | 'detailed'): number {
    const tokenLimits = {
      concise: 500,
      standard: 1000,
      detailed: 2000,
    };

    return tokenLimits[length];
  }

  async processText(text: string, promptTemplate: string, systemPrompt: string): Promise<string> {
    const prompt = this.buildPrompt(text, promptTemplate);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw this.createError('No response from AI service');
      }

      const content = completion.choices[0].message.content;
      if (!content) {
        throw this.createError('Empty response from AI service');
      }

      return content.trim();
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw this.createError(`API Error: ${error.message}`, error.status);
      }

      if (error instanceof Error) {
        throw this.createError(error.message);
      }

      throw this.createError('Unknown error occurred');
    }
  }

  private createError(message: string, statusCode?: number): AIServiceError {
    const error: AIServiceError = { message };
    if (statusCode) {
      error.statusCode = statusCode;
    }
    return error as Error & AIServiceError;
  }
}
