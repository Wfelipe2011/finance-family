import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AgentOrchestratorService } from '../src/agent/agent-orchestrator.service';

export async function setupTestApp() {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AgentOrchestratorService)
    .useValue({ process: () => Promise.resolve('Processado com sucesso') })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return { app, request: request(app.getHttpServer()) };
}

export async function closeTestApp(app: INestApplication | undefined) {
  await app?.close();
}
