import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { Usuario } from '../entities/usuario.entity';
import { QueueModule } from '../queue/queue.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatWorkerService } from './chat-worker.service';
import { StreamService } from './stream.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessageEntity, Usuario]),
    QueueModule,
    forwardRef(() => AgentModule),
  ],
  controllers: [ChatController],
  providers: [ChatService, StreamService, ChatWorkerService],
  exports: [ChatService, StreamService],
})
export class ChatModule {}
