import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvatarAsset } from '../entities/avatar-asset.entity';
import { FamilyGroupMembership } from '../entities/family-group-membership.entity';
import { FamilyGroupSettings } from '../entities/family-group-settings.entity';
import { FamilyGroup } from '../entities/family-group.entity';
import { Usuario } from '../entities/usuario.entity';
import { FamilyGroupsController } from './family-groups.controller';
import { FamilyGroupsService } from './family-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FamilyGroup,
      FamilyGroupMembership,
      FamilyGroupSettings,
      Usuario,
      AvatarAsset,
    ]),
  ],
  controllers: [FamilyGroupsController],
  providers: [FamilyGroupsService],
  exports: [FamilyGroupsService],
})
export class FamilyGroupsModule {}
