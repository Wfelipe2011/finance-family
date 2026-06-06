import swc from 'unplugin-swc';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@fin-ai/shared/chat',
        replacement: resolve(__dirname, '../shared/types/chat.ts'),
      },
      {
        find: '@fin-ai/shared/lancamento',
        replacement: resolve(__dirname, '../shared/types/lancamento.ts'),
      },
      {
        find: '@fin-ai/shared',
        replacement: resolve(__dirname, '../shared/types/index.ts'),
      },
      {
        find: 'src',
        replacement: resolve(__dirname, 'src'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
  },
});
