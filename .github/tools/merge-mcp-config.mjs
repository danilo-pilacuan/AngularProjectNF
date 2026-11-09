#!/usr/bin/env node
// Configura los MCP HTTP del stack graphify en <repo>/.vscode/mcp.json.
// Solo se reemplazan las entradas administradas por este kit.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
function option(name, fallback) {
  const index = argv.findIndex((value) => value === name || value.startsWith(`${name}=`));
  if (index < 0) return fallback;
  const value = argv[index].startsWith(`${name}=`) ? argv[index].slice(name.length + 1) : argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`falta el valor de ${name}`);
  return value;
}

const dest = resolve(option('--dest', process.cwd()));

function readEnvValue(envPath, name) {
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => new RegExp(`^\\s*${name}\\s*=\\s*(\\S.*)$`).test(l));
  if (!line) return null;
  const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(\\S.*)$`));
  return m[1].trim().replace(/^["']|["']$/g, '');
}

// Puertos: el flag explicito manda; si el instalador no paso uno, se hereda el
// puerto ya fijado en el .env del destino (fuente de verdad de los servicios
// corriendo). Cae al default solo en instalaciones limpias. Sin esto, una
// reinstalacion sin flags regenera mcp.json con los puertos por defecto y
// desconecta los MCP del editor aunque los servicios sigan en otros puertos.
function resolvePort(flagName, envName, fallback) {
  const flag = option(flagName, null);
  if (flag) return flag;
  const fromEnv = readEnvValue(join(dest, '.env'), envName);
  if (fromEnv) return fromEnv;
  return fallback;
}

const graphifyPort = resolvePort('--graphify-port', 'GRAPHIFY_PORT', '8080');
const memgraphPort = resolvePort('--memgraph-port', 'MEMGRAPH_HTTP_PORT', '8000');
const vscodeDir = join(dest, '.vscode');
const configPath = join(vscodeDir, 'mcp.json');

function readConfig() {
  if (!existsSync(configPath)) return { servers: {} };
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new Error(`no se pudo leer ${configPath} como JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${configPath} debe contener un objeto JSON`);
  }
  if (parsed.servers === undefined) parsed.servers = {};
  if (!parsed.servers || typeof parsed.servers !== 'object' || Array.isArray(parsed.servers)) {
    throw new Error(`${configPath}.servers debe ser un objeto`);
  }
  return parsed;
}

const config = readConfig();
config.servers.graphify = {
  type: 'http',
  url: `http://localhost:${graphifyPort}/mcp`,
  headers: { 'X-API-Key': '${env:GRAPHIFY_API_KEY}' },
};
config.servers['mcp-memgraph'] = {
  type: 'http',
  url: `http://localhost:${memgraphPort}/mcp/`,
};

// VS Code no carga .env: si GRAPHIFY_API_KEY no existe en el entorno del editor,
// ${env:GRAPHIFY_API_KEY} se expande vacio, graphify responde 401 al arrancar y
// cada ventana de agente vuelve a preguntar por autenticar el servidor. Con la
// key persistida a nivel usuario (User scope), la expansion resuelve y el
// arranque autentica sin preguntar. No se escribe el valor en mcp.json (que
// suele versionarse): el secreto vive en el almacen de credenciales del usuario.
// En WSL el valor se propaga a Windows via reg.exe (HKCU\\Environment) porque
// las variables de usuario de WSL no son visibles para el editor Windows.
function setEnvKeyUserScope(name, value) {
  if (!value) return 'omitido (sin valor en .env)';
  if (process.platform === 'win32') {
    execSync(`reg add "HKCU\\Environment" /v ${name} /t REG_SZ /d "${value}" /f`, { stdio: 'ignore' });
    return 'escrita (User scope)';
  }
  try {
    execSync('reg.exe add "HKCU\\Environment" /v ' + name + ' /t REG_SZ /d "' + value + '" /f', { stdio: 'ignore' });
    return 'escrita (User scope via reg.exe)';
  } catch {
    console.error(`aviso: no se pudo propagar ${name} a Windows (WSL); exportala en tu shell para que el editor la vea`);
    return 'no propagada';
  }
}

function readEnvKey(envPath, name) {
  return readEnvValue(envPath, name);
}

const graphifyKey = readEnvKey(join(dest, '.env'), 'GRAPHIFY_API_KEY');
const keyScope = setEnvKeyUserScope('GRAPHIFY_API_KEY', graphifyKey);
console.log(`GRAPHIFY_API_KEY (${keyScope}) para autenticacion MCP sin prompts del editor`);

mkdirSync(vscodeDir, { recursive: true });
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`MCP configurados en ${configPath}: graphify, mcp-memgraph (HTTP)`);
