import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { AvatarAssetDTO } from '@fin-ai/shared/avatar';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { AvatarAsset } from '../entities/avatar-asset.entity';
import { FamilyGroupSettings } from '../entities/family-group-settings.entity';
import { FamilyGroupsService } from '../family/family-groups.service';

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Injectable()
export class AvatarsService {
  constructor(
    @InjectRepository(AvatarAsset)
    private readonly avatarsRepository: Repository<AvatarAsset>,
    @InjectRepository(FamilyGroupSettings)
    private readonly settingsRepository: Repository<FamilyGroupSettings>,
    private readonly familyGroupsService: FamilyGroupsService,
    private readonly configService: ConfigService,
  ) {}

  async uploadUserAvatar(usuarioId: number, file?: Express.Multer.File) {
    const avatar = await this.persistAvatar({
      file,
      ownerType: 'user',
      ownerId: String(usuarioId),
      groupId: null,
    });
    return { avatar };
  }

  async uploadJarvisAvatar(
    usuarioId: number,
    groupId: number,
    file?: Express.Multer.File,
  ) {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const avatar = await this.persistAvatar({
      file,
      ownerType: 'agent',
      ownerId: 'jarvis',
      groupId,
    });
    const settings = await this.settingsRepository.findOne({
      where: { group_id: groupId },
    });
    if (!settings) {
      throw new NotFoundException('Group settings not found');
    }
    settings.jarvis_avatar_asset_id = avatar.id;
    await this.settingsRepository.save(settings);
    return { avatar };
  }

  private async persistAvatar(options: {
    file?: Express.Multer.File;
    ownerType: 'user' | 'agent';
    ownerId: string;
    groupId: number | null;
  }): Promise<AvatarAssetDTO> {
    const { file, ownerType, ownerId, groupId } = options;
    if (!file) {
      throw new BadRequestException('avatar file is required');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Invalid avatar file type');
    }
    if (file.size > this.maxSizeBytes()) {
      throw new BadRequestException('Avatar file is too large');
    }

    const directory = join(this.uploadDir(), 'avatars');
    await mkdir(directory, { recursive: true });
    const filename = `${ownerType}-${ownerId}-${randomUUID()}${this.extensionFor(file)}`;
    const storagePath = join(directory, filename);
    await writeFile(storagePath, file.buffer);

    const publicUrl = `${this.publicBaseUrl()}/avatars/${filename}`;
    const row = await this.avatarsRepository.save(
      this.avatarsRepository.create({
        owner_type: ownerType,
        owner_id: ownerId,
        group_id: groupId,
        storage_path: storagePath,
        public_url: publicUrl,
        mime_type: file.mimetype,
        size: file.size,
      }),
    );

    return this.toDto(row);
  }

  private toDto(avatar: AvatarAsset): AvatarAssetDTO {
    return {
      id: avatar.id,
      ownerType: avatar.owner_type,
      ownerId: avatar.owner_id,
      group_id: avatar.group_id,
      publicUrl: avatar.public_url,
      mimeType: avatar.mime_type,
      size: avatar.size,
      created_at: avatar.created_at.toISOString(),
    };
  }

  private uploadDir() {
    return this.configService.get<string>('UPLOAD_DIR') ?? './uploads';
  }

  private publicBaseUrl() {
    return this.configService.get<string>('UPLOAD_PUBLIC_URL') ?? '/uploads';
  }

  private maxSizeBytes() {
    return Number(this.configService.get<string>('AVATAR_MAX_BYTES') ?? 5242880);
  }

  private extensionFor(file: Express.Multer.File) {
    const extension = extname(file.originalname || '').toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) {
      return extension;
    }
    if (file.mimetype === 'image/png') {
      return '.png';
    }
    if (file.mimetype === 'image/webp') {
      return '.webp';
    }
    return '.jpg';
  }
}
