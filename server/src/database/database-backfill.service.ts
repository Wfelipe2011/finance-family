import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, IsNull } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { FamilyGroup } from '../entities/family-group.entity';
import { FamilyGroupMembership } from '../entities/family-group-membership.entity';
import { FamilyGroupSettings } from '../entities/family-group-settings.entity';
import { Lancamento } from '../entities/lancamento.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class DatabaseBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseBackfillService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return;
    }

    await this.ensureDefaultFamilyGroup();
  }

  private async ensureDefaultFamilyGroup() {
    await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(Usuario, { order: { id: 'ASC' } });
      if (users.length === 0) {
        return;
      }

      let group = await manager.findOne(FamilyGroup, {
        where: { name: 'Familia' },
      });

      if (!group) {
        group = await manager.save(
          manager.create(FamilyGroup, { name: 'Familia' }),
        );
      }

      const settings = await manager.findOne(FamilyGroupSettings, {
        where: { group_id: group.id },
      });
      if (!settings) {
        await manager.save(
          manager.create(FamilyGroupSettings, {
            group_id: group.id,
            jarvis_always_on: false,
          }),
        );
      }

      for (const [index, user] of users.entries()) {
        const existing = await manager.findOne(FamilyGroupMembership, {
          where: { group_id: group.id, usuario_id: user.id },
        });
        if (!existing) {
          await manager.save(
            manager.create(FamilyGroupMembership, {
              group_id: group.id,
              usuario_id: user.id,
              role: index === 0 ? 'owner' : 'member',
            }),
          );
        }
      }

      await manager.update(
        ChatMessage,
        { group_id: IsNull() },
        {
          group_id: group.id,
          author_type: 'user',
        },
      );
      await manager.query(
        'UPDATE chat_messages SET author_usuario_id = usuario_id WHERE author_usuario_id IS NULL',
      );

      await manager.update(
        Lancamento,
        { group_id: IsNull() },
        { group_id: group.id },
      );
      await manager.query(
        'UPDATE lancamentos SET created_by_usuario_id = usuario_id WHERE created_by_usuario_id IS NULL',
      );

      this.logger.log(
        `Default family group ${group.id} ensured for ${users.length} users`,
      );
    });
  }
}
