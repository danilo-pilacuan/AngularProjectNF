// Starts shell + remotes dev servers in parallel (ports 4300-4304, DEC-001).
// Usage: node tools/start-dev.mjs
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const repos = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'tools' && e.name !== 'docs')
  .map((e) => e.name)
  .filter((name) => {
    const pkg = join(root, name, 'package.json');
    if (!existsSync(pkg)) return false;
    const json = JSON.parse(readFileSync(pkg, 'utf8'));
    return Boolean(json.scripts && json.scripts.start);
  });

if (repos.length === 0) {
  console.log('No repos define "start". Nothing to do.');
  process.exit(0);
}

const children = [];
for (const repo of repos) {
  console.log(`Starting ${repo} (npm start)...`);
  const child = spawn('npm', ['start'], {
    cwd: join(root, repo),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  children.push(child);
  child.on('exit', (code) => console.log(`[${repo}] exited with code ${code}`));
}

const shutdown = () => {
  for (const child of children) {
    try { child.kill(); } catch { /* already gone */ }
  }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
