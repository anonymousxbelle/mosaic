import { build } from 'vite';
await build({
  configFile: false,
  define: { 'process.env.NEXT_PUBLIC_CATALOG_API': '""' },
  build: {
    target: 'es2022',
    outDir: 'dist/backend',
    lib: { entry: 'backend/worker.ts', formats: ['es'], fileName: 'worker' },
  },
});
