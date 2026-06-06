import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentMemoryService } from '../src/agent/agent-memory.service';

const describeIfDbAvailable =
  process.env.FINAI_E2E_DB_AVAILABLE === 'true' ? describe : describe.skip;

function config() {
  return {
    get: (key: string) =>
      key === 'DATABASE_URL' ? process.env.DATABASE_URL : undefined,
    getOrThrow: (key: string) => {
      const value = key === 'DATABASE_URL' ? process.env.DATABASE_URL : null;
      if (!value) {
        throw new Error(`${key} missing`);
      }
      return value;
    },
  } as never;
}

describeIfDbAvailable('agent memory integration', () => {
  let client: Client;
  let memory: AgentMemoryService;

  beforeAll(async () => {
    memory = new AgentMemoryService(config());
    await memory.onModuleInit();

    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    await client.query('truncate table "public".store');
  });

  afterAll(async () => {
    await client?.end();
    await memory?.onModuleDestroy();
  });

  it('keeps long-term memory isolated per user namespace', async () => {
    await memory.saveUserMemory(1, {
      tipo: 'preferencia_categoria_comerciante',
      chave: 'mercado padrão',
      conteudo: 'Mercado Exemplo deve usar Alimentação',
      origem: 'usuario_declarou',
      confianca: 'alta',
      comerciante: 'Mercado Exemplo',
      categoria: 'Alimentação',
    });

    const userOne = await memory.searchUserMemories(1, {
      tipo: 'preferencia_categoria_comerciante',
    });
    const userTwo = await memory.searchUserMemories(2, {
      tipo: 'preferencia_categoria_comerciante',
    });

    expect(userOne).toHaveLength(1);
    expect(userOne[0].value.conteudo).toContain('Mercado Exemplo');
    expect(userTwo).toHaveLength(0);
  });

  it('persists long-term memory facts for later reads by the same user', async () => {
    await memory.saveUserMemory(3, {
      tipo: 'preferencia_comunicacao',
      chave: 'respostas curtas',
      conteudo: 'Prefere respostas curtas sobre gastos do mes',
      origem: 'usuario_declarou',
      confianca: 'alta',
    });

    const laterMemory = new AgentMemoryService(config());
    try {
      await laterMemory.onModuleInit();
      const saved = await laterMemory.searchUserMemories(3, {
        tipo: 'preferencia_comunicacao',
      });

      expect(saved).toHaveLength(1);
      expect(saved[0].value.chave).toBe('respostas curtas');
    } finally {
      await laterMemory.onModuleDestroy();
    }
  });
});
