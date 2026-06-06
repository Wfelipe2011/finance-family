import { mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(baseConfig, {
  test: {
    include: ['**/*.e2e-spec.ts'],
    exclude: ['src/**/*.spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
  },
});
