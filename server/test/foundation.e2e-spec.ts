import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { ChatWorkerService } from '../src/chat/chat-worker.service';

const describeIfDbAvailable =
  process.env.FINAI_E2E_DB_AVAILABLE === 'true' ? describe : describe.skip;

describeIfDbAvailable('foundation database integration', () => {
  let app: INestApplication;
  let client: Client;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ChatWorkerService)
      .useValue({ onModuleInit: async () => undefined })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
    await app?.close();
  });

  it('creates the usuarios and lancamentos tables', async () => {
    const { rows } = await client.query<{ table_name: string }>(
      `
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name in ('usuarios', 'lancamentos')
        order by table_name
      `,
    );

    expect(rows.map((row) => row.table_name)).toEqual([
      'lancamentos',
      'usuarios',
    ]);
  });

  it('creates the pg-boss schema', async () => {
    const { rows } = await client.query<{ schema_name: string }>(
      `
        select schema_name
        from information_schema.schemata
        where schema_name = 'pgboss'
      `,
    );

    expect(rows).toHaveLength(1);
  });
});
