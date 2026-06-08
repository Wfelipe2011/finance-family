import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lancamento } from '../entities/lancamento.entity';
import { Usuario } from '../entities/usuario.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { IAConfig } from '../entities/ia-config.entity';
import { AvatarAsset } from '../entities/avatar-asset.entity';
import { DatabaseBackfillService } from './database-backfill.service';
import { FamilyGroup } from '../entities/family-group.entity';
import { FamilyGroupMembership } from '../entities/family-group-membership.entity';
import { FamilyGroupSettings } from '../entities/family-group-settings.entity';
import { JarvisFinanceDraft } from '../entities/jarvis-finance-draft.entity';

const entities = [
  Usuario,
  Lancamento,
  ChatMessage,
  IAConfig,
  FamilyGroup,
  FamilyGroupMembership,
  FamilyGroupSettings,
  AvatarAsset,
  JarvisFinanceDraft,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        entities,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
      }),
    }),
  ],
  providers: [DatabaseBackfillService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
