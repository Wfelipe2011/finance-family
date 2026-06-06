import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'pg-boss';
import { AgentOrchestratorService } from '../agent/agent-orchestrator.service';
import { CHAT_JOBS_QUEUE } from '../queue/queue.constants';
import { QueueService } from '../queue/queue.service';
import { ChatJobPayload, ChatService } from './chat.service';
import { StreamService } from './stream.service';

@Injectable()
export class ChatWorkerService implements OnModuleInit {
  private readonly logger = new Logger(ChatWorkerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly chatService: ChatService,
    private readonly orchestrator: AgentOrchestratorService,
    private readonly streamService: StreamService,
  ) { }

  async onModuleInit() {
    await this.queueService.registerWorker<ChatJobPayload>(
      CHAT_JOBS_QUEUE,
      (payload, job) => this.handle(payload, job),
    );
  }

  private async handle(payload: ChatJobPayload, job: Job<ChatJobPayload>) {
    try {
      await this.chatService.markProcessing(
        payload.messageId,
        payload.usuarioId,
      );
      const message = await this.orchestrator.process(payload);
      await this.chatService.complete(
        payload.messageId,
        payload.usuarioId,
        message,
      );
      this.streamService.emit(payload.usuarioId, {
        status: 'completed',
        message,
      });
    } catch (error) {
      const metadata = job as unknown as {
        retryCount?: number;
        retryLimit?: number;
      };
      const retryCount = Number(metadata.retryCount ?? 0);
      const retryLimit = Number(metadata.retryLimit ?? 5);
      if (retryCount + 1 >= retryLimit) {
        await this.chatService.fail(payload.messageId, payload.usuarioId);
        this.streamService.emit(payload.usuarioId, {
          status: 'failed',
          message: 'Processing failed',
        });
      }
      this.logger.error(
        error instanceof Error ? error.message : 'Chat job failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
