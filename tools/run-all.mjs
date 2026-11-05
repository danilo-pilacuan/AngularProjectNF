// Runs a script in every sibling repo that defines it. Multirepo orchestrator.
// Usage: node tools/run-all.mjs <script> [args...]
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const script = process.argv[2];
if (!script) {
  console.error('Usage: node tools/run-all.mjs <script>');
  process.exit(1);
}

const repos = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'tools' && e.name !== 'docs')
  .map((e) => e.name)
  .filter((name) => {
    const pkg = join(root, name, 'package.json');
    if (!existsSync(pkg)) return false;
    const json = JSON.parse(readFileSync(pkg, 'utf8'));
    return Boolean(json.scripts && json.scripts[script]);
  });

if (repos.length === 0) {
  console.log(`No repos define "${script}". Nothing to do.`);
  process.exit(0);
}

let failed = false;
for (const repo of repos) {
  console.log(`\n=== ${repo}: npm run ${script} ===`);
  const result = spawnSync('npm', ['run', script, ...process.argv.slice(3)], {
    cwd: join(root, repo),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`FAILED: ${repo} (${script})`);
    failed = true;
    break;
  }
}
process.exit(failed ? 1 : 0);
