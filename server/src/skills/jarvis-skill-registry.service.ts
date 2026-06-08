import { Injectable } from '@nestjs/common';
import type { JarvisSkillDTO, JarvisSkillId } from '@fin-ai/shared/skill';

export type JarvisSkillDefinition = JarvisSkillDTO & {
  id: JarvisSkillId;
  prompt: string;
  toolNames: string[];
  ttlInteractions: number;
  intentPattern: RegExp;
};

type ActiveSkillState = {
  ids: JarvisSkillId[];
  remaining: number;
};

@Injectable()
export class JarvisSkillRegistryService {
  private readonly activeByGroup = new Map<number, ActiveSkillState>();

  private readonly skills: JarvisSkillDefinition[] = [
    {
      id: 'finance_crud',
      displayName: 'Financas: lancamentos',
      description:
        'Cria, edita, apaga e prepara rascunhos de lancamentos financeiros.',
      enabled: true,
      ttlInteractions: 2,
      toolNames: [
        'adicionar_gasto_db',
        'editar_gasto_db',
        'apagar_gasto_db',
        'consultar_gastos_db',
        'salvar_memoria_grupo',
        'consultar_memoria_grupo',
      ],
      intentPattern:
        /(gastei|adicione|adicionar|registre|registrar|crie|lance|edite|editar|apague|apagar|delete|remova|remover|confirmar|confirma)/i,
      prompt:
        'Skill finance_crud: para mutacoes financeiras, gere rascunhos claros antes de qualquer gravacao. Se faltar descricao, valor, categoria ou alvo, faca uma pergunta curta.',
    },
    {
      id: 'finance_query',
      displayName: 'Financas: consultas',
      description: 'Consulta listas, totais e filtros de lancamentos.',
      enabled: true,
      ttlInteractions: 2,
      toolNames: ['consultar_gastos_db', 'consultar_memoria_grupo'],
      intentPattern:
        /(quanto|total|gastos?|lancamentos?|despesas?|receitas?|categoria|mes|semana|hoje|ontem|lista|liste|consultar|consulta)/i,
      prompt:
        'Skill finance_query: responda consultas financeiras usando apenas leituras do grupo. Nao ofereca criar, editar ou apagar.',
    },
    {
      id: 'finance_report',
      displayName: 'Financas: relatorios',
      description: 'Resume periodos, categorias e tendencias financeiras.',
      enabled: true,
      ttlInteractions: 2,
      toolNames: ['consultar_gastos_db', 'consultar_memoria_grupo'],
      intentPattern: /(relatorio|relatorio|resumo|balanco|tendencia|periodo)/i,
      prompt:
        'Skill finance_report: produza resumos curtos por periodo e categoria, com proximos passos praticos.',
    },
  ];

  list(): JarvisSkillDTO[] {
    return this.skills.map(({ id, displayName, description, enabled }) => ({
      id,
      displayName,
      description,
      enabled,
    }));
  }

  selectFor(groupId: number, input: string): JarvisSkillDefinition[] {
    const selected = this.skills.filter(
      (skill) => skill.enabled && skill.intentPattern.test(input),
    );
    if (selected.length > 0) {
      const ttl = Math.max(...selected.map((skill) => skill.ttlInteractions));
      this.activeByGroup.set(groupId, {
        ids: selected.map((skill) => skill.id),
        remaining: ttl,
      });
      return selected;
    }

    const active = this.activeByGroup.get(groupId);
    if (!active || active.remaining <= 0) {
      this.activeByGroup.delete(groupId);
      return [];
    }

    active.remaining -= 1;
    if (active.remaining <= 0) {
      this.activeByGroup.delete(groupId);
    } else {
      this.activeByGroup.set(groupId, active);
    }

    return this.skills.filter((skill) => active.ids.includes(skill.id));
  }
}
