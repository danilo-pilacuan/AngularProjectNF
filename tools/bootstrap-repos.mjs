// Installs dependencies in every sibling repo that has a package.json.
// Usage: node tools/bootstrap-repos.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const repos = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'tools' && e.name !== 'docs')
  .map((e) => e.name)
  .filter((name) => existsSync(join(root, name, 'package.json')));

if (repos.length === 0) {
  console.log('No repos with package.json found. Nothing to do.');
  process.exit(0);
}

let failed = false;
for (const repo of repos) {
  console.log(`\n=== ${repo}: npm install ===`);
  const result = spawnSync('npm', ['install'], {
    cwd: join(root, repo),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`FAILED: ${repo} (npm install)`);
    failed = true;
    break;
  }
}
process.exit(failed ? 1 : 0);
