import { defineConfig } from 'tsup';

export default defineConfig([
  {
    platform: 'node',
    format: 'cjs',
    treeshake: true,
    clean: false,
    sourcemap: true,
    entryPoints: {
      server: 'src/server/index.ts',
    },
    outDir: 'build',
  },
  {
    platform: 'node',
    format: 'cjs',
    treeshake: true,
    clean: false,
    sourcemap: true,
    entryPoints: {
      thumbnails: 'src/offload/thumbnails.ts',
    },
    outDir: 'build/offload',
  },
]);
