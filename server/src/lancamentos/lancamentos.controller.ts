import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/request-user';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { LancamentoFilterDto } from './dto/lancamento-filter.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { LancamentosService } from './lancamentos.service';

@Controller('lancamentos')
export class LancamentosController {
  constructor(private readonly lancamentosService: LancamentosService) {}

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateLancamentoDto,
  ) {
    return this.lancamentosService.create(req.user.userId, dto);
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() filters: LancamentoFilterDto,
  ) {
    return this.lancamentosService.findAll(req.user.userId, filters);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="lancamentos.csv"')
  export(
    @Request() req: AuthenticatedRequest,
    @Query() filters: LancamentoFilterDto,
  ) {
    return this.lancamentosService.exportCsv(req.user.userId, filters);
  }

  @Put(':id')
  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLancamentoDto,
  ) {
    return this.lancamentosService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.lancamentosService.delete(req.user.userId, id);
  }
}

@Controller('groups/:groupId/lancamentos')
export class GroupLancamentosController {
  constructor(private readonly lancamentosService: LancamentosService) {}

  @Post()
  createForGroup(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CreateLancamentoDto,
  ) {
    return this.lancamentosService.createForGroup(
      req.user.userId,
      groupId,
      dto,
    );
  }

  @Get()
  findAllForGroup(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query() filters: LancamentoFilterDto,
  ) {
    return this.lancamentosService.findAllForGroup(
      req.user.userId,
      groupId,
      filters,
    );
  }

  @Put(':id')
  @Patch(':id')
  updateForGroup(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLancamentoDto,
  ) {
    return this.lancamentosService.updateForGroup(
      req.user.userId,
      groupId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteForGroup(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.lancamentosService.deleteForGroup(req.user.userId, groupId, id);
  }
}

@Controller('groups/:groupId/jarvis/drafts')
export class GroupJarvisDraftsController {
  constructor(private readonly lancamentosService: LancamentosService) {}

  @Post(':draftId/confirm')
  confirmDraft(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('draftId') draftId: string,
  ) {
    return this.lancamentosService.confirmDraft(
      req.user.userId,
      groupId,
      draftId,
    );
  }

  @Post(':draftId/reject')
  rejectDraft(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('draftId') draftId: string,
  ) {
    return this.lancamentosService.rejectDraft(
      req.user.userId,
      groupId,
      draftId,
    );
  }
}
