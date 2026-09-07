import { spawnSync } from 'node:child_process';
const result = spawnSync(
  process.execPath,
  ['node_modules/vinext/dist/cli.js', 'build'],
  { env: { ...process.env, GITHUB_PAGES: 'true' }, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
