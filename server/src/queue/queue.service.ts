import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, PgBoss, SendOptions } from 'pg-boss';
import { CHAT_JOBS_QUEUE } from './queue.constants';

export type QueueHandler<TPayload extends object> = (
  payload: TPayload,
  job: Job<TPayload>,
) => Promise<void> | void;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly boss: PgBoss;
  private readonly workers: Array<{ queueName: string; id: string }> = [];
  private started = false;

  constructor(configService: ConfigService) {
    this.boss = new PgBoss({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async onModuleInit() {
    this.boss.on('error', (error) => {
      this.logger.error(error.message, error.stack);
    });

    await this.boss.start();
    await this.boss.createQueue(CHAT_JOBS_QUEUE);
    this.started = true;
  }

  async sendJob<TPayload extends object>(
    queueName: string,
    data: TPayload,
    options: SendOptions = {},
  ) {
    return this.boss.send(queueName, data, {
      retryLimit: 5,
      retryBackoff: true,
      ...options,
    });
  }

  async registerWorker<TPayload extends object>(
    queueName: string,
    handler: QueueHandler<TPayload>,
  ) {
    const id = await this.boss.work<TPayload>(queueName, async (jobs) => {
      for (const job of jobs) {
        await handler(job.data, job);
      }
    });
    this.workers.push({ queueName, id });
    return id;
  }

  async onModuleDestroy() {
    if (this.started) {
      await Promise.all(
        this.workers.map((worker) =>
          this.boss.offWork(worker.queueName, { id: worker.id, wait: true }),
        ),
      );
      this.workers.length = 0;
      await this.boss.stop({ close: true, graceful: true, timeout: 5000 });
      this.started = false;
    }
  }
}
