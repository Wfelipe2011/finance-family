import { afterEach, describe, expect, it } from 'vitest';
import { AgentMemoryService } from './agent-memory.service';

function config(overrides: Record<string, string | undefined> = {}) {
  const values = {
    DATABASE_URL: 'postgres://postgres:postgres@localhost:5433/fin_ai_test',
    ...overrides,
  };

  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const value = values[key];
      if (!value) {
        throw new Error(`${key} missing`);
      }
      return value;
    },
  } as never;
}

describe('AgentMemoryService', () => {
  let service: AgentMemoryService | undefined;

  afterEach(async () => {
    await service?.onModuleDestroy();
    service = undefined;
  });

  it('creates deterministic user-scoped thread IDs and namespaces', () => {
    service = new AgentMemoryService(config());

    expect(service.threadIdFor(42)).toBe('finai:user:42');
    expect(service.namespaceFor(42)).toEqual([
      'finai',
      'users',
      '42',
      'profile',
    ]);
    expect(service.namespaceFor(42, 'preferences')).toEqual([
      'finai',
      'users',
      '42',
      'preferences',
    ]);
  });

  it('prefers the memory connection string override when configured', () => {
    service = new AgentMemoryService(
      config({ AGENT_MEMORY_DATABASE_URL: 'postgres://memory/db' }),
    );

    expect(service.getConnectionString()).toBe('postgres://memory/db');
  });

  it('rejects raw base64 and data URLs from memory values', () => {
    service = new AgentMemoryService(config());

    expect(() =>
      service?.assertMemorySafe({
        payload: 'data:image/png;base64,abcd',
      }),
    ).toThrow(/raw media/);

    expect(() =>
      service?.assertMemorySafe({
        payload:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),
    ).toThrow(/raw media/);
  });
});
