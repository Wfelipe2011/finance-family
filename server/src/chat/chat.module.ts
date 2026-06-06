import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { QueueModule } from '../queue/queue.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatWorkerService } from './chat-worker.service';
import { StreamService } from './stream.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessageEntity]),
    QueueModule,
    forwardRef(() => AgentModule),
  ],
  controllers: [ChatController],
  providers: [ChatService, StreamService, ChatWorkerService],
  exports: [ChatService, StreamService],
})
export class ChatModule {}
