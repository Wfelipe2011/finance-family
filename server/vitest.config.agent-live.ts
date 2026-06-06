import { mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(baseConfig, {
  test: {
    include: ['test/**/*.agent-live-spec.ts'],
    exclude: ['src/**/*.spec.ts', '**/*.e2e-spec.ts'],
    globalSetup: ['./test/agent-live/global-setup.ts'],
    setupFiles: ['./test/agent-live/setup.ts'],
    fileParallelism: false,
    testTimeout: 120000,
    hookTimeout: 60000,
  },
});
