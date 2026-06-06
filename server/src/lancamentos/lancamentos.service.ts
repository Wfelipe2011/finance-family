import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { LancamentoDTO } from '@fin-ai/shared/lancamento';
import { stringify } from 'csv-stringify/sync';
import { Repository } from 'typeorm';
import { Lancamento } from '../entities/lancamento.entity';
import { normalizeCategoria } from './categoria.values';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { LancamentoFilterDto } from './dto/lancamento-filter.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';

@Injectable()
export class LancamentosService {
  constructor(
    @InjectRepository(Lancamento)
    private readonly lancamentosRepository: Repository<Lancamento>,
  ) {}

  async create(usuarioId: number, dto: CreateLancamentoDto) {
    const lancamento = this.lancamentosRepository.create({
      descricao: dto.descricao,
      valor: dto.valor.toFixed(2),
      data: dto.data,
      categoria: normalizeCategoria(dto.categoria),
      usuario_id: usuarioId,
    });

    return this.toDto(await this.lancamentosRepository.save(lancamento));
  }

  async findAll(usuarioId: number, filters: LancamentoFilterDto = {}) {
    const query = this.lancamentosRepository
      .createQueryBuilder('lancamento')
      .where('lancamento.usuario_id = :usuarioId', { usuarioId })
      .orderBy('lancamento.data', 'DESC')
      .addOrderBy('lancamento.id', 'DESC');

    if (filters.dataInicio) {
      query.andWhere('lancamento.data >= :dataInicio', {
        dataInicio: filters.dataInicio,
      });
    }

    if (filters.dataFim) {
      query.andWhere('lancamento.data <= :dataFim', {
        dataFim: filters.dataFim,
      });
    }

    if (filters.categoria) {
      query.andWhere('lancamento.categoria = :categoria', {
        categoria: normalizeCategoria(filters.categoria),
      });
    }

    return (await query.getMany()).map((lancamento) => this.toDto(lancamento));
  }

  async update(usuarioId: number, id: number, dto: UpdateLancamentoDto) {
    const lancamento = await this.findOwned(usuarioId, id);
    if (dto.descricao !== undefined) {
      lancamento.descricao = dto.descricao;
    }
    if (dto.valor !== undefined) {
      lancamento.valor = dto.valor.toFixed(2);
    }
    if (dto.categoria !== undefined) {
      lancamento.categoria = normalizeCategoria(dto.categoria);
    }
    if (dto.data !== undefined) {
      lancamento.data = dto.data;
    }

    return this.toDto(await this.lancamentosRepository.save(lancamento));
  }

  async delete(usuarioId: number, id: number) {
    const lancamento = await this.findOwned(usuarioId, id);
    await this.lancamentosRepository.remove(lancamento);
  }

  async exportCsv(usuarioId: number, filters: LancamentoFilterDto = {}) {
    const rows = await this.findAll(usuarioId, filters);
    return stringify(rows, {
      header: true,
      columns: ['id', 'descricao', 'valor', 'data', 'categoria'],
    });
  }

  private async findOwned(usuarioId: number, id: number) {
    const lancamento = await this.lancamentosRepository.findOne({
      where: { id, usuario_id: usuarioId },
    });

    if (!lancamento) {
      throw new NotFoundException('Lancamento not found');
    }

    return lancamento;
  }

  private toDto(lancamento: Lancamento): LancamentoDTO {
    return {
      id: lancamento.id,
      descricao: lancamento.descricao,
      valor: Number(lancamento.valor),
      data: lancamento.data,
      categoria: lancamento.categoria as LancamentoDTO['categoria'],
      usuario_id: lancamento.usuario_id,
      created_at: lancamento.created_at.toISOString(),
    };
  }
}
