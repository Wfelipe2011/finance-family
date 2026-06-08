import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Request,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/request-user';
import { UpdateFamilyGroupSettingsDto } from './dto/update-family-group-settings.dto';
import { FamilyGroupsService } from './family-groups.service';

@Controller('groups')
export class FamilyGroupsController {
  constructor(private readonly familyGroupsService: FamilyGroupsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.familyGroupsService.listForUser(req.user.userId);
  }

  @Get('default')
  default(@Request() req: AuthenticatedRequest) {
    return this.familyGroupsService.resolveDefaultGroup(req.user.userId);
  }

  @Get(':groupId/members')
  members(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.familyGroupsService.membersForGroup(req.user.userId, groupId);
  }

  @Get(':groupId/settings')
  settings(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.familyGroupsService.getSettings(req.user.userId, groupId);
  }

  @Put(':groupId/settings')
  updateSettings(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: UpdateFamilyGroupSettingsDto,
  ) {
    return this.familyGroupsService.updateSettings(
      req.user.userId,
      groupId,
      dto,
    );
  }
}
