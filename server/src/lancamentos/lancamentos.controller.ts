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
