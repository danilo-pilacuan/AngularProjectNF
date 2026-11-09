#!/usr/bin/env node
// Orquestador de graphify: levanta los servicios MCP (graphify + memgraph) con
// docker compose usando las recetas versionadas en deploy/graphify/ del repo
// (copiadas al destino por el instalador del kit).
// Node >= 18, sin dependencias.
// Uso: node tools/build-graphify.mjs [opciones] [comando]
//   comandos:  up (default) | down | extract | update | status
//   opciones:  --dockerhub        usa la imagen sinfallas/remote-graphify de Docker Hub
//                              (pull + up --no-build) en vez de construir la local
//              --env-file PATH   .env alternativo (default: <raiz repo>/.env)
// Requisitos: Docker + .env en la raiz del repo (ver .env.example; OPENAI_*
// opcionales para extract, GRAPHIFY_API_KEY y MEMGRAPH_* opcionales).

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative, isAbsolute, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// Raiz del repo que hospeda los servicios: padre de tools/. En el repo fuente
// es <repo>/tools/..; instalado por el kit vive en <dest>/.github/tools/, asi
// que se sube un nivel mas para no tomar .github/ como raiz.
const toolsParent = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = basename(toolsParent) === '.github' ? dirname(toolsParent) : toolsParent;
const deploySrc = join(repoRoot, 'deploy', 'graphify');
const deployOut = join(deploySrc, 'dist');

// Lectura uniforme de KEY=valor de un .env (resolvePorts la usa; checkEnv
// mantiene sus propios regex para distinguir falta de archivo de falta de valor).
function readEnvValue(path, key) {
  if (!path || !existsSync(path)) return null;
  const line = readFileSync(path, 'utf8').split(/\r?\n/)
    .find((l) => new RegExp(`^\\s*${key}\\s*=\\s*(\\S.*)$`).test(l));
  if (!line) return null;
  return line.match(new RegExp(`^\\s*${key}\\s*=\\s*(\\S.*)$`))[1].trim().replace(/^["']|["']$/g, '');
}

// Puertos para el smoke: los del .env resuelto mandan (compose los usa para
// publicar); el entorno del proceso es el fallback.
function resolvePorts() {
  let filePorts = {};
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(GRAPHIFY_PORT|MEMGRAPH_HTTP_PORT)\s*=\s*(\S+)/);
      if (m) filePorts[m[1]] = m[2];
    }
  }
  return {
    graphify: filePorts.GRAPHIFY_PORT || process.env.GRAPHIFY_PORT || '8080',
    memgraph: filePorts.MEMGRAPH_HTTP_PORT || process.env.MEMGRAPH_HTTP_PORT || '8000',
  };
}

// --- Argumentos: comando = primer token no flag; --env-file RUTA (espacio o =)
const argv = process.argv.slice(2);
let useDockerhub = false;
let envFileArg = null;
let cmd = 'up';
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dockerhub') useDockerhub = true;
  else if (a === '--env-file' && argv[i + 1]) { envFileArg = argv[++i]; }
  else if (a.startsWith('--env-file=')) envFileArg = a.slice('--env-file='.length);
  else if (!a.startsWith('--')) { cmd = a; break; }
}

const known = ['up', 'down', 'extract', 'update', 'status'];
if (!known.includes(cmd)) {
  console.error(`uso: node tools/build-graphify.mjs [--dockerhub] [--env-file PATH] [${known.join('|')}]`);
  process.exit(2);
}
const envFile = envFileArg ? (isAbsolute(envFileArg) ? envFileArg : resolve(process.cwd(), envFileArg)) : join(repoRoot, '.env');

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

// Variables pasadas al proceso de compose: conmutador de imagen (--dockerhub).
// GRAPHIFY_WORKSPACE ya puede venir del entorno/.env; no la toca si no esta.
function composeEnv() {
  const env = { ...process.env };
  if (useDockerhub) env.GRAPHIFY_IMAGE = 'sinfallas/remote-graphify:latest';
  // workspace: por defecto la raiz donde corre el orquestador (afuera de
  // deploy/graphify); compose usa ${GRAPHIFY_WORKSPACE:-..} y montar ".."
  // apuntaria a deploy/ (sin graphify-out ni repos indexado).
  if (!env.GRAPHIFY_WORKSPACE) env.GRAPHIFY_WORKSPACE = repoRoot;
  // Nombre de proyecto compose unico por instalacion (hash corto de la raiz):
  // evita que dos instalaciones en carpetas distintas compartan contenedores.
  env.COMPOSE_PROJECT_NAME = 'graphify-' + createHash('sha1').update(repoRoot.toLowerCase()).digest('hex').slice(0, 8);
  return env;
}

function compose(args, extra = {}) {
  // docker es un ejecutable nativo (docker.exe en Windows): no requiere shell.
  const r = spawnSync('docker', ['compose', '--env-file', envFile, ...args], {
    cwd: deployOut,
    env: composeEnv(),
    stdio: 'inherit',
    ...extra,
  });
  if (r.error && r.error.code === 'ENOENT') die('docker no encontrado en PATH');
  if (r.status !== 0) die(`docker compose ${args.join(' ')} fallo (exit ${r.status})`, r.status ?? 1);
}
// Emitir deploy/graphify/dist (idempotente: copia local de la receta fuente,
// para que compose corra sin tocar la fuente versionada). Se copia entrada por
// entrada excluyendo dist/ porque cpSync rechaza copiar una carpeta dentro de
// si misma (dist vive dentro de la carpeta fuente).
function emitDist() {
  if (!statSync(deploySrc, { throwIfNoEntry: false })?.isDirectory()) {
    die(`no existe ${deploySrc}; recetas faltantes (instala el kit con su carpeta deploy/)`);
  }
  rmSync(deployOut, { recursive: true, force: true });
  mkdirSync(deployOut, { recursive: true });
  for (const entry of readdirSync(deploySrc, { withFileTypes: true })) {
    if (entry.name === 'dist') continue;
    cpSync(join(deploySrc, entry.name), join(deployOut, entry.name), { recursive: true });
  }
  const rel = relative(repoRoot, deployOut).split('\\').join('/');
  console.log(`${rel} emitido desde deploy/graphify/ (receta fuente versionada)`);
}

// .env: obligatorio solo para extract; para up, aviso (serve sin GRAPHIFY_API_KEY
// cae a sin auth). Si el usuario pasa --env-file, esa ruta es la que manda.
function checkEnv() {
  if (!existsSync(envFile)) {
    if (cmd === 'extract') die(`extract requiere .env con OPENAI_* (no existe: ${envFile}); usa --env-file o crea el archivo (plantilla: .env.example)`);
    console.error(`aviso: falta .env (${envFile}); copia .env.example a .env`);
    console.error('  (extract necesita OPENAI_BASE_URL/OPENAI_MODEL/OPENAI_API_KEY; GRAPHIFY_API_KEY para auth MCP)');
    return;
  }
  const env = readFileSync(envFile, 'utf8');
  if (cmd === 'extract') {
    if (!/^\s*OPENAI_BASE_URL\s*=/m.test(env)) die('extract requiere OPENAI_BASE_URL en el .env (endpoint OpenAI-compatible)');
    if (!/^\s*OPENAI_API_KEY\s*=\s*\S/m.test(env)) die('extract requiere OPENAI_API_KEY con valor en el .env');
  }
}

// Smoke test: el MCP de graphify responde y exige auth (401/403) o saluda 200/4xx
// de protocolo; 000 = sin respuesta. Reintenta unos segundos: uvicorn tarda en
// arrancar y `up -d` devuelve antes de que el puerto este listo.
// H-04/H-06: el GET de sondeo a endpoints MCP HTTP sin cabeceras de protocolo
// suele responder 4xx (405/406) o resetear la conexion; eso es senal de servicio
// VIVO (solo responde a POST con JSON-RPC). 000 sostenido si que indica caida.
async function smoke() {
  const probe = async (url, headers = {}) => {
    try {
      const r = await fetch(url, { headers });
      return { status: `${r.status}`, alive: true };
    } catch {
      // Reset/abort de conexiones sin cabeceras MCP: un GET simple con curl
      // responde 406, asi que reintenta antes de declarar caido (H-06).
      for (let i = 0; i < 2; i++) {
        await new Promise((r) => setTimeout(r, 300));
        try {
          const r = await fetch(url, { headers });
          return { status: `${r.status}`, alive: true };
        } catch { /* sigue caido por ahora */ }
      }
      return { status: '000', alive: false };
    }
  };
  const servicesUp = spawnSync('docker', ['compose', '--env-file', envFile, 'ps', '--quiet', '--status', 'running'], {
    cwd: deployOut,
    env: composeEnv(),
    encoding: 'utf8',
  });
  const upCount = (servicesUp.stdout || '').split('\n').filter((l) => l.trim()).length;
  if (upCount === 0) {
    console.log('smoke omitido: no hay servicios corriendo (levanta con "node tools/build-graphify.mjs up")');
    return;
  }
  // Reintentos por servicio (H-04): el arranque puede tardar y `up -d` retorna antes.
  let gNoAuth = '000';
  let alive = false;
  const { graphify: graphifyPort, memgraph: memgraphPort } = resolvePorts();
  for (let i = 0; i < 10 && !alive; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
    const res = await probe(`http://localhost:${graphifyPort}/mcp`);
    alive = res.alive;
    gNoAuth = res.status;
  }
  const gAuth = await probe(`http://localhost:${graphifyPort}/mcp`, { 'X-API-Key': 'smoke-invalid-key' });
  // mcp-memgraph: 4xx de protocolo = vivo; 000 = caido. Mismos reintentos que
  // graphify: uvicorn tarda ~1.5s en bind y un solo intento da falsos 000.
  let m = { status: '000', alive: false };
  for (let i = 0; i < 10 && !m.alive; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
    m = await probe(`http://localhost:${memgraphPort}/mcp/`);
  }
  console.log(`smoke: graphify :${graphifyPort}/mcp sin-auth=${gNoAuth} con-key=${gAuth.status} | memgraph :${memgraphPort}/mcp/ =${m.status}`);
  if (!alive) {
    console.error('graphify MCP no responde tras 10s: revisa docker compose logs graphify');
    process.exit(1);
  }
  if (gNoAuth !== '401' && gNoAuth !== '403' && gNoAuth !== '200') {
    console.log('nota: respuesta inesperada del endpoint MCP (puede ser 4xx de protocolo); revisa logs si algo falla');
  }
  if (gNoAuth === '200') {
    console.log('aviso: /mcp responde 200 sin API key; define GRAPHIFY_API_KEY en .env para exigir auth');
  }
  if (!m.alive) {
    console.error(`memgraph MCP no responde en :${memgraphPort}/mcp/ (000 con reintentos): revisa docker compose logs mcp-memgraph`);
    process.exit(1);
  }
  // Verificacion de conexion real (Bolt end-to-end): el MCP puede estar vivo
  // pero sin Bolt detras. `list_databases` NO sirve como prueba: es una tool
  // enlatada que responde isError=false con [{"name":"memgraph","current":true}]
  // incluso con memgraph Exited 137 (verificado en laboratorio). La unica prueba
  // real es ejecutar una query trivial contra Bolt: error de conexion => sin Bolt.
  const boltOk = await probeMcpTool(memgraphPort, 'run_cypher_query', { query: 'RETURN 1' });
  if (!boltOk) {
    console.error(`memgraph MCP vivo en :${memgraphPort} pero sin Bolt alcanzable (revisa MEMGRAPH_URL en deploy/graphify/docker-compose.yml; levanta con "node tools/build-graphify.mjs up")`);
    process.exit(1);
  }
}

// Handshake MCP minimo (initialize -> initialized -> tools/call) contra el MCP
// de memgraph; devuelve true si la tool respondio sin error de protocolo.
async function probeMcpTool(memgraphPort, toolName, toolArgs = {}) {
  const post = async (body, sid) => {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    if (sid) headers['mcp-session-id'] = sid;
    const r = await fetch(`http://localhost:${memgraphPort}/mcp`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    // El id de sesion viaja en headers, no en el body (SSE).
    return { sid: r.headers.get('mcp-session-id'), text: await r.text() };
  };
  try {
    const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } } });
    if (!init.sid) return false;
    await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, init.sid);
    const call = await post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: toolName, arguments: toolArgs } }, init.sid);
    return !call.text.includes('"isError":true') && !call.text.includes('"error"');
  } catch {
    return false;
  }
}

if (cmd === 'up') {
  emitDist();
  checkEnv();
  if (useDockerhub) {
    console.log('modo dockerhub: usando imagen sinfallas/remote-graphify:latest (sin build local)');
    compose(['pull', '--ignore-buildable', 'graphify']);
    compose(['up', '-d', '--no-build']);
  } else {
    if (!existsSync(join(repoRoot, 'graphify-out', 'graph.json'))) {
      console.log('nota: no existe graphify-out/graph.json en la raiz; corre "node tools/build-graphify.mjs extract" para crear el grafo');
    }
    compose(['up', '-d']);
  }
  await smoke();
  const ports = resolvePorts();
  console.log('listo: graphify MCP en http://localhost:' + ports.graphify + '/mcp (streamable-http) y memgraph MCP en http://localhost:' + ports.memgraph + '/mcp/');
} else if (cmd === 'down') {
  emitDist();
  compose(['down']);
  console.log('servicios graphify/memgraph detenidos');} else if (cmd === 'extract') {
  emitDist();
  checkEnv();
  // Build completo: el perfil "build" monta el workspace rw y escribe graphify-out/.
  compose(['--profile', 'build', 'run', '--rm', 'graphify-build']);
  console.log('grafo generado en <workspace>/graphify-out/graph.json; el serve lo recarga solo (hot-reload)');
} else if (cmd === 'update') {
  emitDist();
  // Update incremental (codigo, sin LLM); usa el .graphify_root guardado por extract.
  compose(['--profile', 'update', 'run', '--rm', 'graphify-update']);
  console.log('grafo incremental actualizado (codigo sin LLM); el serve hace hot-reload de graph.json');
} else if (cmd === 'status') {
  emitDist();
  compose(['ps']);
  // Frescura del grafo: sin esto, status solo dice "servicios vivos" y el grafo
  // puede estar semanas detras del codigo sin que nadie lo note (el MCP sirve
  // el archivo que hay, aunque este obsoleto). Mide la antiguedad del
  // graph.json y la compara con el ultimo commit del repo indexado.
  const graphPath = join(repoRoot, 'graphify-out', 'graph.json');
  if (existsSync(graphPath)) {
    const ageH = ((Date.now() - statSync(graphPath).mtimeMs) / 3600000).toFixed(1);
    console.log(`grafo: graphify-out/graph.json presente, generado hace ${ageH} h`);
    try {
      const head = spawnSync('git', ['-C', repoRoot, 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' });
      if (head.status === 0 && head.stdout.trim()) {
        console.log(`grafo: ultimo commit del workspace: ${head.stdout.trim()} (corre "node tools/build-graphify.mjs update" si el grafo quedo detras)`);
      }
    } catch { /* git ausente o no es repo: la antiguedad ya se reporto */ }
  } else {
    console.log('grafo: SIN graphify-out/graph.json (corre "node tools/build-graphify.mjs extract")');
  }
  await smoke();
}
