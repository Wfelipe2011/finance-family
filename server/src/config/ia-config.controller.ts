import { Body, Controller, Get, Patch, Put, Request } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/request-user';
import { UpdateIAConfigDto } from './dto/update-ia-config.dto';
import { IAConfigService } from './ia-config.service';

@Controller('config/ia')
export class IAConfigController {
  constructor(private readonly iaConfigService: IAConfigService) {}

  @Get()
  get(@Request() req: AuthenticatedRequest) {
    return this.iaConfigService.get(req.user.userId);
  }

  @Put()
  @Patch()
  update(@Request() req: AuthenticatedRequest, @Body() dto: UpdateIAConfigDto) {
    return this.iaConfigService.update(req.user.userId, dto);
  }
}
