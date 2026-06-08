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
  ) {}

  async onModuleInit() {
    await this.queueService.registerWorker<ChatJobPayload>(
      CHAT_JOBS_QUEUE,
      (payload, job) => this.handle(payload, job),
    );
  }

  private async handle(payload: ChatJobPayload, job: Job<ChatJobPayload>) {
    const jobId = String(job.id);
    try {
      const emitStatus = async (
        status: 'transcribing' | 'processing_ia',
        message: string,
      ) => {
        await this.chatService.updateStatus(
          payload.messageId,
          payload.groupId,
          status,
        );
        this.streamService.emitGroup(payload.groupId, {
          type: 'message.status',
          status,
          message,
          jobId,
          messageId: payload.messageId,
        });
      };

      const assistant = await this.chatService.startAssistantMessage(
        payload.messageId,
        payload.usuarioId,
        payload.groupId,
      );
      const message = await this.orchestrator.process(payload, {
        onTranscribing: () =>
          emitStatus('transcribing', 'Extraindo dados do arquivo'),
        onProcessingIa: () => emitStatus('processing_ia', 'Processando com IA'),
        onToken: async (delta) =>
          this.chatService.appendAssistantDelta(
            assistant.id,
            payload.groupId,
            delta,
            jobId,
          ),
      });
      await this.chatService.complete(
        payload.messageId,
        payload.usuarioId,
        payload.groupId,
        message,
        assistant.id,
      );
      this.streamService.emitGroup(payload.groupId, {
        type: 'message.status',
        status: 'completed',
        message,
        jobId,
        messageId: payload.messageId,
      });
    } catch (error) {
      const metadata = job as unknown as {
        retryCount?: number;
        retryLimit?: number;
      };
      const retryCount = Number(metadata.retryCount ?? 0);
      const retryLimit = Number(metadata.retryLimit ?? 5);
      if (retryCount + 1 >= retryLimit) {
        await this.chatService.fail(payload.messageId, payload.groupId);
        this.streamService.emitGroup(payload.groupId, {
          type: 'assistant.failed',
          status: 'failed',
          message: 'Nao foi possivel processar sua mensagem agora.',
          jobId,
          messageId: payload.messageId,
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
