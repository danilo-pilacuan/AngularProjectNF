#!/usr/bin/env node
// Importer del grafo de trazabilidad de .ops hacia Memgraph (skill graph-ops).
// Node >= 18, sin dependencias: driver Bolt minimo (Bolt v1 + PackStream 1).
// Uso: node ops-graph.mjs <raiz-de-.ops> [--bolt bolt://host:puerto]
// Destino Bolt: --bolt manda; si falta, MEMGRAPH_BOLT_PORT del .env (subiendo desde
// la carpeta de .ops); default bolt://localhost:7687.
// Idempotente: borra el grafo anterior y lo reconstruye desde el Markdown.
// Memgraph es indice derivado de solo-lectura; la fuente de verdad es el Markdown en git.

import net from 'node:net';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const args = process.argv.slice(2);
const opsRootArg = args.find((a) => !a.startsWith('--'));
const opsRoot = resolve(opsRootArg ?? '.ops');
const boltIdx = args.indexOf('--bolt');
const boltFlag = boltIdx >= 0 ? args[boltIdx + 1] : null;

// Lectura uniforme de KEY=valor de un .env (mismo patron que build-graphify.mjs).
function readEnvValue(path, key) {
  if (!path || !existsSync(path)) return null;
  const re = new RegExp(`^\\s*${key}\\s*=\\s*(\\S.*)$`);
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = re.exec(line);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

function findEnvFile(startDir) {
  let dir = resolve(startDir);
  for (;;) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// Destino Bolt: --bolt manda; si no, MEMGRAPH_BOLT_PORT del .env hallado subiendo
// desde la carpeta que contiene la raiz de .ops (convencion del kit); default 7687.
let boltUrl = boltFlag;
let boltSource = 'flag --bolt';
if (!boltUrl) {
  const envFile = findEnvFile(dirname(opsRoot));
  const envPort = envFile ? readEnvValue(envFile, 'MEMGRAPH_BOLT_PORT') : null;
  boltUrl = envPort ? `bolt://localhost:${envPort}` : 'bolt://localhost:7687';
  boltSource = envPort ? `MEMGRAPH_BOLT_PORT del .env (${envFile})` : 'default (sin .env con MEMGRAPH_BOLT_PORT)';
}

if (!existsSync(opsRoot)) {
  console.error(`no existe ${opsRoot}; el kit funciona sin .ops, este importer lo requiere`);
  process.exit(1);
}

// ---------- Packstream (codificar y decodificar) ----------

// ---------- PackStream 1 (el que habla Bolt v1) ----------
// Ojo: en PackStream 1 los marcadores de string/lista/mapa difieren de PackStream 2:
// strings 0xD0/0xD1/0xD2, listas 0xD8/0xD9/0xDA, mapas 0xDB/0xDC/0xDD, structs 0xDE/0xDF.

function packStr(s) {
  const b = Buffer.from(s, 'utf8');
  if (b.length < 16) return Buffer.concat([Buffer.from([0x80 | b.length]), b]);
  if (b.length < 256) return Buffer.concat([Buffer.from([0xd0, b.length]), b]);
  const head = Buffer.alloc(3);
  head[0] = 0xd1;
  head.writeInt16BE(b.length, 1);
  return Buffer.concat([head, b]);
}

function packInt(n) {
  if (n >= -16 && n <= 127) return Buffer.from([n & 0xff]);
  if (n >= -32768 && n <= 32767) {
    const b = Buffer.alloc(3);
    b[0] = 0xc9;
    b.writeInt16BE(n, 1);
    return b;
  }
  const b = Buffer.alloc(5);
  b[0] = 0xca;
  b.writeInt32BE(n, 1);
  return b;
}

function packValue(v) {
  if (typeof v === 'string') return packStr(v);
  if (typeof v === 'number') return packInt(v);
  if (v === null || v === undefined) return Buffer.from([0xc0]);
  if (typeof v === 'boolean') return Buffer.from([v ? 0xc3 : 0xc2]);
  if (Array.isArray(v)) {
    const n = v.length;
    let head;
    if (n < 16) head = Buffer.from([0x90 | n]);
    else if (n < 256) head = Buffer.from([0xd8, n]);
    else {
      head = Buffer.alloc(3);
      head[0] = 0xd9;
      head.writeInt16BE(n, 1);
    }
    return Buffer.concat([head, ...v.map(packValue)]);
  }
  const keys = Object.keys(v);
  const n = keys.length;
  let head;
  if (n < 16) head = Buffer.from([0xa0 | n]);
  else if (n < 256) head = Buffer.from([0xdb, n]);
  else {
    head = Buffer.alloc(3);
    head[0] = 0xdc;
    head.writeInt16BE(n, 1);
  }
  const body = keys.flatMap((k) => [packStr(k), packValue(v[k])]);
  return Buffer.concat([head, ...body]);
}

function unpack(b, offset = 0) {
  const marker = b[offset];
  if (marker >= 0x80 && marker <= 0x8f) {
    const n = marker & 0x0f;
    return { value: b.slice(offset + 1, offset + 1 + n).toString('utf8'), next: offset + 1 + n };
  }
  if (marker >= 0x90 && marker <= 0x9f) {
    const n = marker & 0x0f;
    let off = offset + 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = unpack(b, off);
      out.push(r.value);
      off = r.next;
    }
    return { value: out, next: off };
  }
  if (marker >= 0xa0 && marker <= 0xaf) {
    const n = marker & 0x0f;
    let off = offset + 1;
    const out = {};
    for (let i = 0; i < n; i++) {
      const k = unpack(b, off);
      const v = unpack(b, k.next);
      out[k.value] = v.value;
      off = v.next;
    }
    return { value: out, next: off };
  }
  if (marker === 0xc0) return { value: null, next: offset + 1 };
  if (marker === 0xc1) return { value: b.readDoubleBE(offset + 1), next: offset + 9 };
  if (marker === 0xc2) return { value: false, next: offset + 1 };
  if (marker === 0xc3) return { value: true, next: offset + 1 };
  if (marker === 0xc8) return { value: b.readInt8(offset + 1), next: offset + 2 };
  if (marker === 0xc9) return { value: b.readInt16BE(offset + 1), next: offset + 3 };
  if (marker === 0xca) return { value: b.readInt32BE(offset + 1), next: offset + 5 };
  if (marker === 0xcb) return { value: b.readBigInt64BE(offset + 1), next: offset + 9 };
  if (marker === 0xd8) {
    const n = b[offset + 1];
    let off = offset + 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = unpack(b, off);
      out.push(r.value);
      off = r.next;
    }
    return { value: out, next: off };
  }
  if (marker === 0xd9) {
    const n = b.readInt16BE(offset + 1);
    let off = offset + 3;
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = unpack(b, off);
      out.push(r.value);
      off = r.next;
    }
    return { value: out, next: off };
  }
  if (marker === 0xd0) {
    const n = b[offset + 1];
    return { value: b.slice(offset + 2, offset + 2 + n).toString('utf8'), next: offset + 2 + n };
  }
  if (marker === 0xd1) {
    const n = b.readInt16BE(offset + 1);
    return { value: b.slice(offset + 2, offset + 2 + n).toString('utf8'), next: offset + 2 + n };
  }
  if (marker === 0xdb) {
    const n = b[offset + 1];
    let off = offset + 2;
    const out = {};
    for (let i = 0; i < n; i++) {
      const k = unpack(b, off);
      const v = unpack(b, k.next);
      out[k.value] = v.value;
      off = v.next;
    }
    return { value: out, next: off };
  }
  if (marker >= 0xb0 && marker <= 0xbf) {
    const n = marker & 0x0f;
    const tag = b[offset + 1];
    let off = offset + 2;
    const fields = [];
    for (let i = 0; i < n; i++) {
      const r = unpack(b, off);
      fields.push(r.value);
      off = r.next;
    }
    return { value: { tag, fields }, next: off };
  }
  if (marker <= 0x7f) return { value: marker, next: offset + 1 };
  if (marker >= 0xf0) return { value: marker - 0x100, next: offset + 1 };
  throw new Error(`packstream marker no soportado: 0x${marker.toString(16)} en offset ${offset}`);
}

// ---------- Cliente Bolt minimo ----------

const SIG = { HELLO: 0x01, GOODBYE: 0x02, RUN: 0x10, PULL: 0x3f, SUCCESS: 0x70, RECORD: 0x71, FAILURE: 0x7f };

function chunkFrame(struct) {
  const b = Buffer.alloc(2 + struct.length + 2);
  b.writeUInt16BE(struct.length, 0);
  struct.copy(b, 2);
  b.writeUInt16BE(0, 2 + struct.length);
  return b;
}

function buildMsg(tag, fields) {
  const struct = Buffer.concat([Buffer.from([0xb0 + fields.length, tag]), ...fields]);
  return chunkFrame(struct);
}

function boltQuery(host, port, query, params = {}) {
  return new Promise((resolvePromise, reject) => {
    const sock = net.connect({ host, port });
    let stage = 'handshake';
    let successes = 0;
    let cols = [];
    let buf = Buffer.alloc(0);
    const records = [];
    const versions = Buffer.alloc(16);
    versions.writeUInt32BE(1, 0); // Bolt v1
    sock.setTimeout(15000);
    sock.on('connect', () => sock.write(Buffer.concat([Buffer.from([0x60, 0x60, 0xb0, 0x17]), versions])));
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      try {
        if (stage === 'handshake') {
          if (buf.length < 4) return;
          if (buf.readUInt32BE(0) === 0) {
            sock.destroy();
            return reject(new Error('handshake Bolt rechazado'));
          }
          buf = buf.slice(4); // consumir la respuesta del handshake
          stage = 'hello';
          // Bolt v1 usa INIT (tag 0x01) con 2 campos: client name (string) y auth token (map)
          sock.write(buildMsg(SIG.HELLO, [packStr('ops-graph-poc/0.1'), packValue({ scheme: 'none' })]));
          return;
        }
        // leer todos los mensajes disponibles
        for (;;) {
          if (buf.length < 2) return;
          const len = buf.readUInt16BE(0);
          if (len === 0) { buf = buf.slice(2); continue; }
          if (buf.length < 2 + len) return;
          const body = buf.slice(2, 2 + len);
          buf = buf.slice(2 + len);
          if (body.length === 0) continue;
          const m = unpack(body, 0).value;
          if (m.tag === SIG.FAILURE) {
            sock.destroy();
            return reject(new Error(`Bolt FAILURE: ${JSON.stringify(m.fields[0])}`));
          }
          if (stage === 'hello') {
            if (m.tag !== SIG.SUCCESS) return reject(new Error(`hello fallo: tag 0x${m.tag.toString(16)}`));
            stage = 'run';
            successes = 0;
            sock.write(buildMsg(SIG.RUN, [packStr(query), packValue(params)]));
            // Bolt v1: PULL_ALL no lleva campos (la forma PULL {n} es v3+)
            sock.write(buildMsg(SIG.PULL, []));
            return;
          }
          if (m.tag === SIG.RECORD) {
            // Bolt v1: RECORD lleva la lista de valores en fields[0]
            const vals = Array.isArray(m.fields[0]) ? m.fields[0] : [m.fields[0]];
            records.push(Object.fromEntries(cols.map((c, i) => [c, vals[i]])));
          }
          if (m.tag === SIG.SUCCESS) {
            // RUN y PULL emiten cada uno su SUCCESS; recien tras el segundo el
            // query termino de consumirse y se committeo en el servidor.
            successes++;
            if (successes === 1) cols = (m.fields[0] && m.fields[0].fields) ?? [];
            if (successes >= 2) {
              sock.end();
              return resolvePromise(records);
            }
          }
        }
      } catch (e) {
        sock.destroy();
        reject(e);
      }
    });
    sock.on('timeout', () => { sock.destroy(); reject(new Error('timeout Bolt')); });
    sock.on('error', reject);
  });
}

// ---------- Parseo de documentos .ops ----------

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// ---------- Main ----------

const files = walk(opsRoot).filter((f) => f.endsWith('.md'));
const nodes = [];
const edges = [];
const seenIds = new Map();

for (const f of files) {
  const fm = frontmatter(readFileSync(f, 'utf8'));
  const id = fm.id;
  if (!id) continue;
  if (seenIds.has(id)) {
    console.error(`aviso: id duplicado "${id}" en ${relative(opsRoot, f)} (se ignora la segunda copia)`);
    continue;
  }
  seenIds.set(id, f);
  nodes.push({
    id,
    tipo: fm.tipo ?? fm.type ?? 'Doc',
    estado: fm.estado ?? 'n/a',
    title: fm.title ?? id,
    file: relative(opsRoot, f).split('\\').join('/'),
  });
}

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const fm = frontmatter(text);
  const id = fm.id;
  if (!id || seenIds.get(id) !== f) continue;
  const rel = fm.relaciona;
  if (rel) {
    const targets = rel.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const t of targets) edges.push({ from: id, to: t, type: 'RELACIONA' });
  }
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    let target = m[1];
    if (/^(https?:|mailto:|#)/i.test(target)) continue;
    target = target.split('#')[0];
    if (!target || target.includes('<')) continue;
    const resolved = resolve(dirname(f), target);
    const hit = [...seenIds.entries()].find(([, path]) => resolve(path) === resolved);
    if (hit && hit[0] !== id) edges.push({ from: id, to: hit[0], type: 'ENLAZA' });
  }
}

console.log(`grafo extraido: ${nodes.length} nodos, ${edges.length} aristas desde ${files.length} archivos .md`);

const [host, port] = boltUrl.replace('bolt://', '').split(':');

async function main() {
  await boltQuery(host, Number(port), 'MATCH (n) DETACH DELETE n;');
  for (const n of nodes) {
    await boltQuery(host, Number(port),
      'CREATE (d:Doc {id: $id, tipo: $tipo, estado: $estado, title: $title, file: $file})', n);
  }
  for (const e of edges) {
    await boltQuery(host, Number(port),
      `MATCH (a:Doc {id: $from}), (b:Doc {id: $to}) CREATE (a)-[:${e.type}]->(b)`,
      { from: e.from, to: e.to });
  }
  console.log(`cargado en Memgraph (${boltUrl}; destino resuelto por ${boltSource})`);

  // Queries de valor
  // Impacto: solo si se define OPS_IMPACT_ID (id del documento a analizar).
  const impactId = process.env.OPS_IMPACT_ID;
  if (impactId) {
    const impact = await boltQuery(host, Number(port),
      'MATCH (req:Doc {id: $id})<-[r*1..3]-(down) RETURN DISTINCT down.id AS afectado, down.file AS archivo',
      { id: impactId });
    console.log(`\nimpacto de ${impactId} (${impact.length} documentos):`);
    for (const row of impact) console.log(`  - ${row.afectado} (${row.archivo})`);
  }

  const byState = await boltQuery(host, Number(port),
    'MATCH (d:Doc) RETURN d.tipo AS tipo, d.estado AS estado, count(*) AS total ORDER BY tipo, estado');
  console.log(`\ndocumentos por tipo/estado:`);
  for (const row of byState) console.log(`  - ${row.tipo}/${row.estado}: ${row.total}`);

  const orphans = await boltQuery(host, Number(port),
    'MATCH (d:Doc) OPTIONAL MATCH (d)-[r]-() WITH d, count(r) AS grado WHERE grado = 0 RETURN d.id AS huerfano, d.file AS archivo');
  console.log(`\nhuerfanos (${orphans.length}):`);
  for (const row of orphans) console.log(`  - ${row.huerfano} (${row.archivo})`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
