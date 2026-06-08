import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AgentCommitResult,
  AgentDraftResult,
  AgentRejectedResult,
  LancamentoDTO,
} from '@fin-ai/shared/lancamento';
import { stringify } from 'csv-stringify/sync';
import { Repository } from 'typeorm';
import { JarvisFinanceDraft } from '../entities/jarvis-finance-draft.entity';
import { Lancamento } from '../entities/lancamento.entity';
import { FamilyGroupsService } from '../family/family-groups.service';
import { normalizeCategoria } from './categoria.values';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { LancamentoFilterDto } from './dto/lancamento-filter.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';

@Injectable()
export class LancamentosService {
  constructor(
    @InjectRepository(Lancamento)
    private readonly lancamentosRepository: Repository<Lancamento>,
    @InjectRepository(JarvisFinanceDraft)
    private readonly draftsRepository: Repository<JarvisFinanceDraft>,
    private readonly familyGroupsService: FamilyGroupsService,
  ) {}

  async create(usuarioId: number, dto: CreateLancamentoDto) {
    const group = await this.familyGroupsService.resolveDefaultGroup(usuarioId);
    return this.createForGroup(usuarioId, group.id, dto);
  }

  async createForGroup(
    usuarioId: number,
    groupId: number,
    dto: CreateLancamentoDto,
    requestedByUsuarioId: number | null = null,
  ) {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const lancamento = this.lancamentosRepository.create({
      descricao: dto.descricao,
      valor: dto.valor.toFixed(2),
      data: dto.data,
      categoria: normalizeCategoria(dto.categoria),
      usuario_id: usuarioId,
      group_id: groupId,
      created_by_usuario_id: usuarioId,
      requested_by_usuario_id: requestedByUsuarioId,
    });

    return this.toDto(await this.lancamentosRepository.save(lancamento));
  }

  async findAll(usuarioId: number, filters: LancamentoFilterDto = {}) {
    const group = await this.familyGroupsService.resolveDefaultGroup(usuarioId);
    return this.findAllForGroup(usuarioId, group.id, filters);
  }

  async findAllForGroup(
    usuarioId: number,
    groupId: number,
    filters: LancamentoFilterDto = {},
  ) {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const query = this.lancamentosRepository
      .createQueryBuilder('lancamento')
      .where('lancamento.group_id = :groupId', { groupId })
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
    const lancamento = await this.findAccessible(usuarioId, id);
    return this.updateForGroup(usuarioId, lancamento.group_id, id, dto);
  }

  async updateForGroup(
    usuarioId: number,
    groupId: number | null,
    id: number,
    dto: UpdateLancamentoDto,
  ) {
    if (!groupId) {
      throw new NotFoundException('Lancamento not found');
    }
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const lancamento = await this.findInGroup(groupId, id);
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
    const lancamento = await this.findAccessible(usuarioId, id);
    if (!lancamento.group_id) {
      throw new NotFoundException('Lancamento not found');
    }
    await this.deleteForGroup(usuarioId, lancamento.group_id, id);
  }

  async deleteForGroup(usuarioId: number, groupId: number, id: number) {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const lancamento = await this.findInGroup(groupId, id);
    await this.lancamentosRepository.remove(lancamento);
  }

  async exportCsv(usuarioId: number, filters: LancamentoFilterDto = {}) {
    const rows = await this.findAll(usuarioId, filters);
    return stringify(rows, {
      header: true,
      columns: ['id', 'descricao', 'valor', 'data', 'categoria'],
    });
  }

  async createDraft(
    groupId: number,
    requesterUsuarioId: number,
    sourceMessageId: string | null,
    draft: AgentDraftResult,
  ) {
    await this.familyGroupsService.assertMember(requesterUsuarioId, groupId);
    const row = await this.draftsRepository.save(
      this.draftsRepository.create({
        group_id: groupId,
        requester_usuario_id: requesterUsuarioId,
        source_message_id: sourceMessageId,
        operation: draft.operation,
        payload: draft.payload,
        status: 'pending',
      }),
    );
    return {
      ...draft,
      group_id: groupId,
      draft_id: row.id,
    } satisfies AgentDraftResult;
  }

  async confirmLatestPendingDraft(
    usuarioId: number,
    groupId: number,
  ): Promise<AgentCommitResult | AgentRejectedResult> {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const draft = await this.draftsRepository.findOne({
      where: { group_id: groupId, status: 'pending' },
      order: { created_at: 'DESC' },
    });
    if (!draft) {
      return {
        status: 'rejected',
        missing_fields: ['draft_id'],
        reason: 'Nao ha rascunho financeiro pendente para confirmar.',
      };
    }
    return this.confirmDraft(usuarioId, groupId, draft.id);
  }

  async confirmDraft(
    usuarioId: number,
    groupId: number,
    draftId: string,
  ): Promise<AgentCommitResult | AgentRejectedResult> {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const draft = await this.findPendingDraft(groupId, draftId);
    const committed = await this.commitDraftPayload(usuarioId, draft);
    draft.status = 'confirmed';
    draft.resolved_by_usuario_id = usuarioId;
    await this.draftsRepository.save(draft);
    return committed;
  }

  async rejectDraft(usuarioId: number, groupId: number, draftId: string) {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const draft = await this.findPendingDraft(groupId, draftId);
    draft.status = 'rejected';
    draft.resolved_by_usuario_id = usuarioId;
    await this.draftsRepository.save(draft);
    return { status: 'rejected' as const, draft_id: draft.id };
  }

  private async commitDraftPayload(
    usuarioId: number,
    draft: JarvisFinanceDraft,
  ): Promise<AgentCommitResult | AgentRejectedResult> {
    if (draft.operation === 'create') {
      const payload = draft.payload as Partial<CreateLancamentoDto>;
      if (!payload.descricao || !payload.valor || !payload.categoria) {
        return {
          status: 'rejected',
          missing_fields: ['descricao', 'valor', 'categoria'].filter(
            (field) => !payload[field as keyof CreateLancamentoDto],
          ),
          reason: 'Rascunho sem dados suficientes para confirmar.',
        };
      }
      const row = await this.createForGroup(
        usuarioId,
        draft.group_id,
        payload as CreateLancamentoDto,
        draft.requester_usuario_id,
      );
      return {
        status: 'commit',
        operation: 'create',
        payload: row,
        message: `Lancamento ${row.descricao} confirmado.`,
      };
    }

    if (draft.operation === 'edit') {
      const payload = draft.payload as UpdateLancamentoDto & { id?: number };
      if (!payload.id) {
        return {
          status: 'rejected',
          missing_fields: ['id'],
          reason: 'Rascunho sem lancamento alvo para editar.',
        };
      }
      const { id, ...dto } = payload;
      const row = await this.updateForGroup(usuarioId, draft.group_id, id, dto);
      return {
        status: 'commit',
        operation: 'edit',
        payload: row,
        message: `Lancamento ${id} atualizado.`,
      };
    }

    if (draft.operation === 'delete') {
      const payload = draft.payload as { id?: number };
      if (!payload.id) {
        return {
          status: 'rejected',
          missing_fields: ['id'],
          reason: 'Rascunho sem lancamento alvo para apagar.',
        };
      }
      await this.deleteForGroup(usuarioId, draft.group_id, payload.id);
      return {
        status: 'commit',
        operation: 'delete',
        payload,
        message: `Lancamento ${payload.id} apagado.`,
      };
    }

    return {
      status: 'rejected',
      missing_fields: ['operation'],
      reason: 'Operacao financeira desconhecida.',
    };
  }

  private async findPendingDraft(groupId: number, draftId: string) {
    const draft = await this.draftsRepository.findOne({
      where: { id: draftId, group_id: groupId, status: 'pending' },
    });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }
    return draft;
  }

  private async findAccessible(usuarioId: number, id: number) {
    const lancamento = await this.lancamentosRepository.findOne({
      where: { id },
    });
    if (!lancamento?.group_id) {
      throw new NotFoundException('Lancamento not found');
    }
    try {
      await this.familyGroupsService.assertMember(usuarioId, lancamento.group_id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw new NotFoundException('Lancamento not found');
      }
      throw error;
    }
    return lancamento;
  }

  private async findInGroup(groupId: number, id: number) {
    const lancamento = await this.lancamentosRepository.findOne({
      where: { id, group_id: groupId },
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
      group_id: lancamento.group_id ?? undefined,
      created_by_usuario_id: lancamento.created_by_usuario_id ?? undefined,
      requested_by_usuario_id: lancamento.requested_by_usuario_id,
      created_at: lancamento.created_at.toISOString(),
    };
  }
}
