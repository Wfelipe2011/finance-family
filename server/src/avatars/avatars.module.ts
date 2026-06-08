import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvatarAsset } from '../entities/avatar-asset.entity';
import { FamilyGroupSettings } from '../entities/family-group-settings.entity';
import { FamilyGroupsModule } from '../family/family-groups.module';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvatarAsset, FamilyGroupSettings]),
    FamilyGroupsModule,
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService],
})
export class AvatarsModule {}
