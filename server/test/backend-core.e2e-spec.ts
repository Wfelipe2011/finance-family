import { INestApplication } from '@nestjs/common';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CategoriaEnum } from '@fin-ai/shared/lancamento';
import { closeTestApp, setupTestApp } from './setup-test-app';
import { StreamService } from '../src/chat/stream.service';

const describeIfDbAvailable =
  process.env.FINAI_E2E_DB_AVAILABLE === 'true' ? describe : describe.skip;

describeIfDbAvailable('backend-core integration', () => {
  let app: INestApplication;
  let http: Awaited<ReturnType<typeof setupTestApp>>['request'];
  let client: Client;
  let tokenA: string;
  let tokenB: string;
  let lancamentoA: number;

  beforeAll(async () => {
    const testApp = await setupTestApp();
    app = testApp.app;
    http = testApp.request;

    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    await client.query(
      'truncate table chat_messages, ia_configs, lancamentos, usuarios restart identity cascade',
    );
  });

  afterAll(async () => {
    await closeTestApp(app);
    await client?.end();
  });

  it('registers users with bcrypt hashes and rejects duplicates', async () => {
    const email = `user-a-${Date.now()}@fin.ai`;
    const created = await http
      .post('/users')
      .send({ nome: 'User A', email, password: 'secret123' })
      .expect(201);

    expect(created.body).toMatchObject({ id: 1, nome: 'User A', email });
    expect(created.body.password_hash).toBeUndefined();

    const { rows } = await client.query<{ password_hash: string }>(
      'select password_hash from usuarios where email = $1',
      [email],
    );
    expect(rows[0].password_hash).toMatch(/^\$2/);
    expect(rows[0].password_hash).not.toBe('secret123');

    await http
      .post('/users')
      .send({ nome: 'User A', email, password: 'secret123' })
      .expect(409);

    await http
      .post('/users')
      .send({
        nome: 'User B',
        email: `user-b-${Date.now()}@fin.ai`,
        password: 'secret123',
      })
      .expect(201);
  });

  it('logs in and protects profile with JWT', async () => {
    const users = await client.query<{ email: string }>(
      'select email from usuarios order by id',
    );
    const emailA = users.rows[0].email;
    const emailB = users.rows[1].email;

    await http
      .post('/auth/login')
      .send({ email: 'missing@fin.ai', password: 'x' })
      .expect(401);
    await http
      .post('/auth/login')
      .send({ email: emailA, password: 'wrong' })
      .expect(401);

    tokenA = (
      await http
        .post('/auth/login')
        .send({ email: emailA, password: 'secret123' })
        .expect(200)
    ).body.access_token;
    tokenB = (
      await http
        .post('/auth/login')
        .send({ email: emailB, password: 'secret123' })
        .expect(200)
    ).body.access_token;

    await http.get('/auth/profile').expect(401);
    const profile = await http
      .get('/auth/profile')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(profile.body).toMatchObject({ userId: 1, username: emailA });
  });

  it('creates, filters, updates, exports, and deletes scoped lancamentos', async () => {
    const created = await http
      .post('/lancamentos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        descricao: 'Mercado',
        valor: 123.45,
        categoria: CategoriaEnum.Alimentacao,
        data: '2026-01-10',
      })
      .expect(201);

    lancamentoA = created.body.id;
    expect(created.body.usuario_id).toBe(1);

    await http
      .post('/lancamentos')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        descricao: 'Onibus',
        valor: 8,
        categoria: CategoriaEnum.Transporte,
        data: '2026-01-11',
      })
      .expect(201);

    const moradia = await http
      .post('/lancamentos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        descricao: 'Aluguel',
        valor: 1200,
        categoria: CategoriaEnum.Moradia,
        data: '2026-01-12',
      })
      .expect(201);
    expect(moradia.body.categoria).toBe(CategoriaEnum.Moradia);

    const legacy = await http
      .post('/lancamentos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        descricao: 'Remedio',
        valor: 40,
        categoria: 'Saúde',
        data: '2026-01-13',
      })
      .expect(201);
    expect(legacy.body.categoria).toBe(CategoriaEnum.Saude);

    await http
      .post('/lancamentos')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        descricao: 'Invalido',
        valor: 10,
        categoria: 'InvalidCategory',
        data: '2026-01-14',
      })
      .expect(400);

    const list = await http
      .get(
        '/lancamentos?dataInicio=2026-01-01&dataFim=2026-01-31&categoria=Alimentação',
      )
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].descricao).toBe('Mercado');

    await http
      .put(`/lancamentos/${lancamentoA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ valor: 1 })
      .expect(404);

    await http
      .put(`/lancamentos/${lancamentoA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ valor: 150 })
      .expect(200)
      .expect(({ body }) => expect(body.valor).toBe(150));

    const csv = await http
      .get('/lancamentos/export')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.headers['content-disposition']).toContain('lancamentos.csv');
    expect(csv.text).toContain('id,descricao,valor,data,categoria');

    await http
      .delete(`/lancamentos/${lancamentoA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);
  });

  it('stores IA config per user and masks apiKey', async () => {
    await http
      .put('/config/ia')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ baseUrl: 'http://localhost:1234/v1', apiKey: 'sk-secret-1234' })
      .expect(200);

    const configA = await http
      .get('/config/ia')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(configA.body).toEqual({
      baseUrl: 'http://localhost:1234/v1',
      apiKey: '****1234',
    });

    const configB = await http
      .get('/config/ia')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(configB.body.baseUrl).not.toBe('http://localhost:1234/v1');
  });

  it('accepts chat text and wav messages, rejects invalid file type, and streams events', async () => {
    const text = await http
      .post('/chat/message')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('content', 'Quanto gastei?')
      .expect(202);
    expect(text.body.status).toBe('job_created');
    expect(text.body.jobId).toBeTruthy();

    await http
      .post('/chat/message')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', Buffer.from('RIFF....WAVEfmt '), {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      })
      .expect(202);

    await http
      .post('/chat/message')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', Buffer.from('bad'), {
        filename: 'bad.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    const streamService = app.get(StreamService);
    const received = new Promise((resolve) => {
      const subscription = streamService.stream(1).subscribe((event) => {
        subscription.unsubscribe();
        resolve(event.data);
      });
    });
    streamService.emit(1, { status: 'completed', message: 'ok' });
    await expect(received).resolves.toEqual({
      status: 'completed',
      message: 'ok',
    });
  });
});
