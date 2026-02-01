import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  CONFIGURATION_SERVICE,
  ConfigurationService,
} from '@src/domain/ports/configuration.service';
import {
  LOGGER_SERVICE,
  LoggerService,
} from '@src/domain/ports/logger.service';
import { ConfigKeys } from '@src/config/config-keys';
import { SyncTelegramUpdatesUseCase } from '@src/application/use-cases/telegram/sync-telegram-updates.use-case';

@Injectable()
export class TelegramPollingService {
  private isRunning = false;
  private lastTickAt = 0;

  constructor(
    @Inject(CONFIGURATION_SERVICE)
    private readonly config: ConfigurationService,
    private readonly syncTelegramUpdates: SyncTelegramUpdatesUseCase,
    @Inject(LOGGER_SERVICE) private readonly logger: LoggerService,
  ) {}

  @Interval(500)
  async tick(): Promise<void> {
    const enabled =
      this.config.get(ConfigKeys.TELEGRAM_POLLING_ENABLED) === 'true';

    if (!enabled) {
      return;
    }

    if (this.isRunning) {
      return;
    }

    const intervalMs = Math.max(
      250,
      this.config.getNumber(ConfigKeys.TELEGRAM_POLL_INTERVAL_MS) ?? 2000,
    );

    const now = Date.now();
    if (now - this.lastTickAt < intervalMs) {
      return;
    }
    this.lastTickAt = now;

    this.isRunning = true;
    const start = Date.now();

    try {
      const out = await this.syncTelegramUpdates.execute({
        limit:
          this.config.getNumber(ConfigKeys.TELEGRAM_GETUPDATES_LIMIT) ?? 50,
        timeoutSeconds:
          this.config.getNumber(
            ConfigKeys.TELEGRAM_GETUPDATES_TIMEOUT_SECONDS,
          ) ?? 0,
      });

      this.logger.info('telegram.poll.tick', {
        durationMs: Date.now() - start,
        intervalMs,
        ...out,
      });
    } catch (err: any) {
      this.logger.error('telegram.poll.error', {
        durationMs: Date.now() - start,
        message: err?.message,
      });
    } finally {
      this.isRunning = false;
    }
  }
}
