import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  FamilyGroupDTO,
  FamilyGroupMemberDTO,
  FamilyGroupSettingsDTO,
  UpdateFamilyGroupSettingsDTO,
} from '@fin-ai/shared/group';
import { Repository } from 'typeorm';
import { AvatarAsset } from '../entities/avatar-asset.entity';
import { FamilyGroupMembership } from '../entities/family-group-membership.entity';
import { FamilyGroupSettings } from '../entities/family-group-settings.entity';
import { FamilyGroup } from '../entities/family-group.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class FamilyGroupsService {
  constructor(
    @InjectRepository(FamilyGroup)
    private readonly groupsRepository: Repository<FamilyGroup>,
    @InjectRepository(FamilyGroupMembership)
    private readonly membershipsRepository: Repository<FamilyGroupMembership>,
    @InjectRepository(FamilyGroupSettings)
    private readonly settingsRepository: Repository<FamilyGroupSettings>,
    @InjectRepository(Usuario)
    private readonly usersRepository: Repository<Usuario>,
    @InjectRepository(AvatarAsset)
    private readonly avatarsRepository: Repository<AvatarAsset>,
  ) {}

  async listForUser(usuarioId: number): Promise<FamilyGroupDTO[]> {
    const memberships = await this.membershipsRepository.find({
      where: { usuario_id: usuarioId },
      relations: { group: true },
      order: { group_id: 'ASC' },
    });
    if (memberships.length === 0) {
      const group = await this.ensureDefaultGroupForUser(usuarioId);
      return [this.toGroupDto(group)];
    }
    return memberships.map((membership) => this.toGroupDto(membership.group));
  }

  async resolveDefaultGroup(usuarioId: number) {
    const membership = await this.membershipsRepository.findOne({
      where: { usuario_id: usuarioId },
      relations: { group: true },
      order: { group_id: 'ASC' },
    });
    return membership?.group ?? this.ensureDefaultGroupForUser(usuarioId);
  }

  async assertMember(usuarioId: number, groupId: number) {
    const membership = await this.membershipsRepository.findOne({
      where: { usuario_id: usuarioId, group_id: groupId },
      relations: { group: true },
    });
    if (!membership) {
      throw new ForbiddenException('User is not a member of this family group');
    }
    return membership;
  }

  async getSettings(
    usuarioId: number,
    groupId: number,
  ): Promise<FamilyGroupSettingsDTO> {
    await this.assertMember(usuarioId, groupId);
    const settings = await this.ensureSettings(groupId);
    return this.toSettingsDto(settings);
  }

  async updateSettings(
    usuarioId: number,
    groupId: number,
    dto: UpdateFamilyGroupSettingsDTO,
  ): Promise<FamilyGroupSettingsDTO> {
    await this.assertMember(usuarioId, groupId);
    const settings = await this.ensureSettings(groupId);
    if (dto.jarvisAlwaysOn !== undefined) {
      settings.jarvis_always_on = dto.jarvisAlwaysOn;
    }
    if (dto.jarvisAvatarAssetId !== undefined) {
      if (dto.jarvisAvatarAssetId !== null) {
        const avatar = await this.avatarsRepository.findOne({
          where: {
            id: dto.jarvisAvatarAssetId,
            owner_type: 'agent',
            owner_id: 'jarvis',
            group_id: groupId,
          },
        });
        if (!avatar) {
          throw new NotFoundException('Avatar asset not found');
        }
      }
      settings.jarvis_avatar_asset_id = dto.jarvisAvatarAssetId;
    }
    return this.toSettingsDto(await this.settingsRepository.save(settings));
  }

  async membersForGroup(
    usuarioId: number,
    groupId: number,
  ): Promise<FamilyGroupMemberDTO[]> {
    await this.assertMember(usuarioId, groupId);
    const memberships = await this.membershipsRepository.find({
      where: { group_id: groupId },
      relations: { usuario: true },
      order: { id: 'ASC' },
    });
    return Promise.all(
      memberships.map(async (membership) => {
        const avatar = await this.latestUserAvatar(membership.usuario_id);
        return {
          id: membership.id,
          group_id: membership.group_id,
          usuario_id: membership.usuario_id,
          role: membership.role,
          displayName: membership.usuario.nome,
          avatarUrl: avatar?.public_url ?? null,
          joined_at: membership.joined_at.toISOString(),
        };
      }),
    );
  }

  async jarvisAvatarUrl(groupId: number) {
    const settings = await this.ensureSettings(groupId);
    if (!settings.jarvis_avatar_asset_id) {
      return null;
    }
    const avatar = await this.avatarsRepository.findOne({
      where: { id: settings.jarvis_avatar_asset_id },
    });
    return avatar?.public_url ?? null;
  }

  async latestUserAvatar(usuarioId: number) {
    return this.avatarsRepository.findOne({
      where: { owner_type: 'user', owner_id: String(usuarioId) },
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  private async ensureDefaultGroupForUser(usuarioId: number) {
    const user = await this.usersRepository.findOne({ where: { id: usuarioId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let group = await this.groupsRepository.findOne({
      where: { name: 'Familia' },
    });
    if (!group) {
      group = await this.groupsRepository.save(
        this.groupsRepository.create({ name: 'Familia' }),
      );
    }

    await this.ensureSettings(group.id);
    const existing = await this.membershipsRepository.findOne({
      where: { group_id: group.id, usuario_id: usuarioId },
    });
    if (!existing) {
      const memberCount = await this.membershipsRepository.count({
        where: { group_id: group.id },
      });
      await this.membershipsRepository.save(
        this.membershipsRepository.create({
          group_id: group.id,
          usuario_id: usuarioId,
          role: memberCount === 0 ? 'owner' : 'member',
        }),
      );
    }
    return group;
  }

  private async ensureSettings(groupId: number) {
    let settings = await this.settingsRepository.findOne({
      where: { group_id: groupId },
    });
    if (!settings) {
      settings = await this.settingsRepository.save(
        this.settingsRepository.create({
          group_id: groupId,
          jarvis_always_on: false,
        }),
      );
    }
    return settings;
  }

  private toGroupDto(group: FamilyGroup): FamilyGroupDTO {
    return {
      id: group.id,
      name: group.name,
      created_at: group.created_at.toISOString(),
    };
  }

  private toSettingsDto(settings: FamilyGroupSettings): FamilyGroupSettingsDTO {
    return {
      id: settings.id,
      group_id: settings.group_id,
      jarvisAlwaysOn: settings.jarvis_always_on,
      jarvisAvatarAssetId: settings.jarvis_avatar_asset_id,
      updated_at: settings.updated_at.toISOString(),
    };
  }
}
