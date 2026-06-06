import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(process.cwd(), '..');
const composeFile = resolve(projectRoot, 'docker-compose.test.yml');
const stateFile = resolve(process.cwd(), '.vitest-e2e-db-state');

function runDockerCompose(args: string[]) {
  execFileSync('docker', ['compose', '-f', composeFile, ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}

export default function setup() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5433/fin_ai_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' });
    runDockerCompose(['up', '-d', '--wait', 'db-test']);
    writeFileSync(stateFile, 'available');
  } catch {
    writeFileSync(stateFile, 'unavailable');
    return () => {
      rmSync(stateFile, { force: true });
    };
  }

  return () => {
    runDockerCompose(['down', '-v']);
    rmSync(stateFile, { force: true });
  };
}
