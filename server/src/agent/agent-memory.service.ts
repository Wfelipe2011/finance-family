import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';
import type { DurableMemoryInput } from './agent-memory.schemas';

const RAW_MEDIA_PATTERNS = [
  /data:(audio|image)\/[a-z0-9.+-]+;base64,/i,
  /"data"\s*:/i,
  /"attachment\.data"\s*:/i,
  /\b[A-Za-z0-9+/]{160,}={0,2}\b/,
];

@Injectable()
export class AgentMemoryService implements OnModuleInit, OnModuleDestroy {
  readonly checkpointer: PostgresSaver;
  readonly store: PostgresStore;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.getConnectionString();
    const schema = this.getSchema();
    this.checkpointer = PostgresSaver.fromConnString(connectionString, {
      schema,
    });
    this.store = PostgresStore.fromConnString(connectionString, {
      schema,
    });
  }

  async onModuleInit() {
    await this.checkpointer.setup();
    await this.store.setup();
  }

  async onModuleDestroy() {
    await this.store.stop();
    await this.checkpointer.end();
  }

  getConnectionString() {
    return (
      this.configService.get<string>('AGENT_MEMORY_DATABASE_URL') ??
      this.configService.getOrThrow<string>('DATABASE_URL')
    );
  }

  getSchema() {
    return this.configService.get<string>('AGENT_MEMORY_SCHEMA') ?? 'public';
  }

  threadIdFor(usuarioId: number) {
    return `finai:user:${usuarioId}`;
  }

  namespaceFor(usuarioId: number, scope = 'profile') {
    return ['finai', 'users', String(usuarioId), scope];
  }

  async searchUserMemories(
    usuarioId: number,
    options: { consulta?: string; tipo?: string; limite?: number } = {},
  ) {
    const results = await this.store.search(this.namespaceFor(usuarioId), {
      query: options.consulta,
      filter: options.tipo ? { tipo: options.tipo } : undefined,
      limit: options.limite ?? 5,
      mode: 'text',
    });

    return results.map((item) => ({
      key: item.key,
      value: item.value,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async saveUserMemory(usuarioId: number, input: DurableMemoryInput) {
    const safeValue = this.assertMemorySafe({
      ...input,
      savedAt: new Date().toISOString(),
    });
    const key = this.keyFor(input);
    await this.store.put(this.namespaceFor(usuarioId), key, safeValue, false);
    return { key, value: safeValue };
  }

  assertMemorySafe<T extends Record<string, unknown>>(value: T): T {
    const serialized = JSON.stringify(value);
    if (RAW_MEDIA_PATTERNS.some((pattern) => pattern.test(serialized))) {
      throw new Error('raw media payloads cannot be stored in agent memory');
    }
    return value;
  }

  isMemorySafeText(value: string) {
    return !RAW_MEDIA_PATTERNS.some((pattern) => pattern.test(value));
  }

  private keyFor(input: DurableMemoryInput) {
    const raw = `${input.tipo}:${input.chave}`;
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 120);
  }
}
