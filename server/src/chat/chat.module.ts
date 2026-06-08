import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { AvatarAsset } from '../entities/avatar-asset.entity';
import { Usuario } from '../entities/usuario.entity';
import { FamilyGroupSettings } from '../entities/family-group-settings.entity';
import { FamilyGroupsModule } from '../family/family-groups.module';
import { QueueModule } from '../queue/queue.module';
import { ChatController, GroupChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatWorkerService } from './chat-worker.service';
import { StreamService } from './stream.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatMessageEntity,
      Usuario,
      AvatarAsset,
      FamilyGroupSettings,
    ]),
    QueueModule,
    FamilyGroupsModule,
    forwardRef(() => AgentModule),
  ],
  controllers: [ChatController, GroupChatController],
  providers: [ChatService, StreamService, ChatWorkerService],
  exports: [ChatService, StreamService],
})
export class ChatModule {}
