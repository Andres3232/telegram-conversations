import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';

import { ConfigKeys } from '@src/config/config-keys';
import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import { AIResponder, GenerateReplyInput } from '@src/domain/ports/ai-responder';
import { LOGGER_SERVICE, LoggerService } from '@src/domain/ports/logger.service';

@Injectable()
export class OpenAiResponder implements AIResponder {
  private readonly client: OpenAI;

  constructor(
  @Inject(CONFIGURATION_SERVICE)
  private readonly config: ConfigurationService,
  @Inject(LOGGER_SERVICE)
  private readonly logger: LoggerService,
  ) {
    const apiKey = this.config.get(ConfigKeys.OPENAI_API_KEY);
    this.client = new OpenAI({ apiKey });
  }

  async generateReply(input: GenerateReplyInput): Promise<string> {
    const model =
      this.config.get(ConfigKeys.OPENAI_MODEL) || 'gpt-4o-mini';
    const incoming = input.incomingText?.trim() ?? '';


    try {
      const res = await this.client.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 2,
        messages: [
          {
            role: 'system',
            content:
              'Sos un bot amable y conciso. Respondé en español. No uses emojis. Máximo 1 o 2 frases. Si el mensaje es vacío, pedí aclaración.',
          },
          {
            role: 'user',
            content: incoming || '(mensaje vacío)',
          },
        ],
      });

      const text = res.choices?.[0]?.message?.content?.trim();
      if (!text) {
        this.logger.warn('ai.openai.empty_response', { model });
        return 'No llegué a entender el mensaje. ¿Me lo repetís?';
      }

      return text;
    } catch (err: any) {
      // No logueamos apiKey ni datos sensibles.
      this.logger.error('ai.openai.request_failed', {
        model,
        errorName: err?.name,
        errorMessage: err?.message,
        status: err?.status,
        code: err?.code,
        type: err?.type,
      });

      // Dejamos que el caller haga fallback si corresponde.
      throw err;
    }
  }
}
