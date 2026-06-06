import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5433/fin_ai_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL ?? 'http://localhost:11434/v1';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-key';

const stateFile = resolve(process.cwd(), '.vitest-e2e-db-state');

process.env.FINAI_E2E_DB_AVAILABLE =
  existsSync(stateFile) && readFileSync(stateFile, 'utf8') === 'available'
    ? 'true'
    : 'false';
