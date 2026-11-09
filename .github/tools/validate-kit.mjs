#!/usr/bin/env node
// Validador del kit de personalizacion. Node >= 18, sin dependencias.
// Comprueba: frontmatter de SKILL.md (spec Agent Skills), ids unicos, enlaces
// internos, tokens de proyectos ajenos, tamano del nucleo, dependencia dura de
// AGENTS.md (el kit funciona sin el), citas fragiles a reglas por numero,
// formato estandarizado de `fecha`, espejos tools/.github-tools sincronizados y
// formato de archivos (K-12).
// Limitacion conocida: los checks de frontmatter (id, fecha) y dependencias son
// regex sobre texto plano, no parseo YAML completo; si cambia la estructura del
// frontmatter, revisalos a mano.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve, basename, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PROJECT_TOKENS = [
  'digitalme', 'danilo', 'usfq', '3ea12c7', 'bge-m3', 'multilingual-e5',
  'pgvector', 'fastapi', 'langgraph', '13000', '18000', '15432', '8100', '18081',
];
const CORE_MAX_LINES = 80;
const EFFECTIVE_CONTEXT_MAX_LINES = 1500;
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors = [];

const rel = (p) => relative(kitRoot, p).split('\\').join('/');
const read = (p) => readFileSync(p, 'utf8');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

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

// 1. SKILL.md conforme a la especificacion de Agent Skills (todas las skills)
const skillsDir = join(kitRoot, 'skills');
const skillDirs = existsSync(skillsDir)
  ? readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  : [];
if (!skillDirs.includes('ops-lifecycle')) {
  errors.push('falta skills/ops-lifecycle/SKILL.md');
}
for (const name of skillDirs) {
  const skillPath = join(skillsDir, name, 'SKILL.md');
  if (!existsSync(skillPath)) {
    errors.push(`falta skills/${name}/SKILL.md`);
    continue;
  }
  const fm = frontmatter(read(skillPath));
  if (!fm.name || !NAME_RE.test(fm.name)) {
    errors.push(`skills/${name}/SKILL.md: name invalido ("${fm.name ?? ''}"); debe cumplir ${NAME_RE}`);
  } else if (fm.name.length > 64) {
    errors.push(`skills/${name}/SKILL.md: name excede 64 caracteres (${fm.name.length})`);
  } else if (fm.name !== name) {
    errors.push(`skills/${name}/SKILL.md: name "${fm.name}" no coincide con el directorio "${name}"`);
  }
  const desc = (fm.description ?? '').replace(/^["']|["']$/g, '');
  if (!desc) errors.push(`skills/${name}/SKILL.md: falta description`);
  else if (desc.length > 1024) errors.push(`skills/${name}/SKILL.md: description excede 1024 caracteres (${desc.length})`);
}

// 1b. graph-ops es opcional: sin dependencia dura de Memgraph (el kit funciona sin el)
const graphOpsPath = join(skillsDir, 'graph-ops', 'SKILL.md');
if (existsSync(graphOpsPath)) {
  const text = read(graphOpsPath);
  const HARD_GRAPH_DEPS = [
    /siempre\s+(ejecuta|corre|usa)\s+(el\s+)?(importer|memgraph)/i,
    /requerido|obligatorio|prerrequisito/i,
    /MCP_READ_ONLY\s*=\s*false/i,
  ];
  for (const pattern of HARD_GRAPH_DEPS) {
    if (pattern.test(text)) {
      errors.push(`skills/graph-ops/SKILL.md: dependencia dura de Memgraph -> "${pattern.exec(text)[0]}"`);
    }
  }
}

// 1c. Presupuesto de esfuerzo: el corte contable debe estar clavado en el kit
// (nucleo y skill) y la opcion del nucleo debe declararse obligatoria, no optativa.
{
  const corePath = join(kitRoot, 'copilot-instructions.md');
  if (existsSync(corePath)) {
    const core = read(corePath);
    if (!/##\s+Presupuesto de esfuerzo/.test(core)) {
      errors.push('copilot-instructions.md: falta la seccion "Presupuesto de esfuerzo"');
    }
    if (!/A las 3 repeticiones \(modo plan, obligatorio\)/.test(core)) {
      errors.push('copilot-instructions.md: falta el corte de 3 repeticiones con consulta obligatoria al usuario');
    }
    if (!/A las 10 \(tope de emergencia\)/.test(core)) {
      errors.push('copilot-instructions.md: falta el tope de emergencia de 10 repeticiones');
    }
  }
  const lifecyclePath = join(skillsDir, 'ops-lifecycle', 'SKILL.md');
  if (existsSync(lifecyclePath)) {
    const skill = read(lifecyclePath);
    if (!/##\s+Presupuesto de esfuerzo/.test(skill)) {
      errors.push('skills/ops-lifecycle/SKILL.md: falta la seccion "Presupuesto de esfuerzo"');
    }
    if (!/A las 3\s+repeticiones, para y consulta al usuario/.test(skill)) {
      errors.push('skills/ops-lifecycle/SKILL.md: falta el corte de 3 repeticiones con consulta al usuario');
    }
    if (!/A las 10,\s+termina el turno/.test(skill)) {
      errors.push('skills/ops-lifecycle/SKILL.md: falta el tope de emergencia de 10 repeticiones');
    }
  }
}

// 2. Ids unicos en todos los .md
const mdFiles = walk(kitRoot).filter((f) => f.endsWith('.md'));
const seenIds = new Map();
for (const f of mdFiles) {
  const id = frontmatter(read(f)).id;
  if (!id) continue;
  if (seenIds.has(id)) errors.push(`id duplicado "${id}": ${rel(seenIds.get(id))} y ${rel(f)}`);
  else seenIds.set(id, f);
}

// 2b. Presupuesto de esfuerzo: nadie declara el bump opcional para el agente
// (la TOOL es opcional; hacer la cuenta nunca lo es).
for (const f of mdFiles) {
  const text = read(f);
  if (/presupuesto de esfuerzo/i.test(text) && /bump\s+es\s+opcional/i.test(text)) {
    errors.push(`${rel(f)}: el bump del presupuesto no es opcional para el agente`);
  }
}

// 2c. (K-01) Toda plantilla del arbol .ops con `fecha` declara tambien `updated`:
//      la fecha de ultima revision es la señal de frescura que consumen los loops.
const isTemplateish = (p) => rel(p).includes('reference/tree/') || rel(p).includes('reference/templates/');
for (const f of mdFiles.filter(isTemplateish)) {
  const fm = frontmatter(read(f));
  if (fm.fecha && !fm.updated) errors.push(`${rel(f)}: falta campo "updated" junto a "fecha"`);
}

// 2d. (K-02) Los ids citados en `relaciona:` existen en el kit (o al menos en
//      algun documento, cuerpo incluido). Solo se marcan refs estructuradas
//      rotas (REQ-007, BL-012...), no prosa libre.
const KNOWN_ID_RE = /^(REQ|BL|QT|IMPL|DEC|RSK|BUG|MIG|REL|RUN|VULN|PROG)-\d+/;
const allKitText = mdFiles.map((f) => read(f)).join('\n');
for (const f of mdFiles) {
  const raw = frontmatter(read(f)).relaciona;
  if (!raw) continue;
  for (const ref of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!KNOWN_ID_RE.test(ref)) continue;
    if (!allKitText.includes(ref)) errors.push(`${rel(f)}: relaciona id inexistente -> "${ref}"`);
  }
}

// 3. Enlaces relativos internos no rotos
for (const f of mdFiles) {
  const dir = dirname(f);
  for (const m of read(f).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    let target = m[1];
    if (/^(https?:|mailto:|#)/i.test(target)) continue;
    target = target.split('#')[0];
    if (!target || target.includes('<')) continue;
    if (!existsSync(resolve(dir, target))) errors.push(`${rel(f)}: enlace roto -> ${target}`);
  }
}

// 4. Sin tokens de proyecto (el propio validador queda excluido)
const tokenFiles = walk(kitRoot).filter(
  (f) => !f.startsWith(join(kitRoot, 'tools')) &&
    (f.endsWith('.md') || f.endsWith('.yml') || f.endsWith('.yaml') || basename(f) === 'LICENSE'),
);
for (const f of tokenFiles) {
  const text = read(f).toLowerCase();
  for (const token of PROJECT_TOKENS) {
    if (text.includes(token)) errors.push(`${rel(f)}: token de proyecto "${token}"`);
  }
}

// 5. Nucleo de instrucciones dentro del limite
const corePath = join(kitRoot, 'copilot-instructions.md');
if (!existsSync(corePath)) {
  errors.push('falta copilot-instructions.md');
} else {
  const lines = read(corePath).split(/\r?\n/).length;
  if (lines > CORE_MAX_LINES) {
    errors.push(`copilot-instructions.md: ${lines} lineas (maximo ${CORE_MAX_LINES})`);
  }
}

// 5b. Conjunto efectivo de contexto persistente (nucleo + SKILL.md de skills instaladas)
let effectiveLines = existsSync(corePath) ? read(corePath).split(/\r?\n/).length : 0;
const skillFiles = [];
for (const f of mdFiles) {
  if (f.split(sep).includes('SKILL.md')) skillFiles.push(f);
}
for (const f of skillFiles) {
  effectiveLines += read(f).split(/\r?\n/).length;
}
const effectiveSet = `conjunto efectivo de contexto persistente: nucleo + ${skillFiles.length} SKILL.md = ${effectiveLines} lineas`;
console.log(`[info] ${effectiveSet}`);
if (effectiveLines > EFFECTIVE_CONTEXT_MAX_LINES) {
  errors.push(`${effectiveSet} excede ${EFFECTIVE_CONTEXT_MAX_LINES} (guia: nucleo ligero + carga bajo demanda)`);
}

// 6. Sin dependencia dura del rulebook: el kit funciona sin AGENTS.md
const AGENTS_HARD_DEPS = [
  /resource:\s*\.\.\/\.\.\/AGENTS\.md/i,
  /seccion\s+\d+\s+de\s+AGENTS\.md/i,
  /AGENTS\.md\s+seccion\s+\d+/i,
  /regla\s+\d+\s+de\s+la\s+seccion\s+0/i,
  /secciones?\s+\d+\s+(u|y)\s+\d+/i,
];
// 7. Auto-referencias fragiles: las plantillas citan reglas por su texto corto,
// nunca por numero (la numeracion de "Reglas duras" puede reordenarse).
const FRAGILE_RULE_REFS = [
  /regla\s+\d+/i,
  /reglas?\s+\d+\s+y\s+\d+/i,
  /\(regla\s+\d+\)/i,
];
for (const f of mdFiles) {
  const text = read(f);
  for (const pattern of AGENTS_HARD_DEPS) {
    if (pattern.test(text)) {
      errors.push(`${rel(f)}: dependencia dura de AGENTS.md -> ${pattern.source}`);
    }
  }
  for (const pattern of FRAGILE_RULE_REFS) {
    if (pattern.test(text)) {
      errors.push(`${rel(f)}: cita fragil de regla por numero -> "${pattern.exec(text)[0]}"`);
    }
  }
  const fmText = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (fmText) {
    const fecha = /^fecha:\s*(.+)$/m.exec(fmText[1]);
    if (fecha) {
      const v = fecha[1].trim();
      const ts = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v);
      const ph = /^<YYYY-MM-DDThh:mm:ssZ>$/.test(v);
      if (!ts && !ph) errors.push(`${rel(f)}: fecha no estandarizada -> "${v}"`);
    }
  }
}

// 8. (K-12) Formato de archivos: sin BOM en texto del kit; .md/.sh siempre LF
//      (un BOM rompe frontmatter y shebangs; CRLF en .sh rompe ejecutores).
const TEXT_EXTS = new Set(['.md', '.mjs', '.sh', '.ps1', '.yml', '.yaml', '.json', '.txt']);
for (const f of walk(kitRoot)) {
  if (!TEXT_EXTS.has(f.slice(f.lastIndexOf('.')))) continue;
  const buf = readFileSync(f);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    errors.push(`${rel(f)}: archivo con BOM`);
  }
  const ext = f.slice(f.lastIndexOf('.'));
  if ((ext === '.md' || ext === '.sh') && buf.includes(13)) {
    errors.push(`${rel(f)}: fin de linea CRLF (usar LF)`);
  }
}

// 9. Guarda anti-drift de espejos (solo repo fuente del kit): los .mjs de
// my-custom-kit/tools/ y sus copias en .github/tools/ del repo deben ser
// identicos con EOL normalizado (git autocrlf oculta diffs solo-EOL y dejo un
// validador viejo empaquetado; leccion del drift 8d61434).
{
  const kitTools = join(kitRoot, 'tools');
  const mirrorTools = resolve(kitRoot, '..', '.github', 'tools');
  if (existsSync(mirrorTools) && resolve(mirrorTools) !== resolve(kitTools)) {
    const normText = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    for (const f of readdirSync(kitTools)) {
      if (!f.endsWith('.mjs')) continue;
      const mirrorPath = join(mirrorTools, f);
      if (!existsSync(mirrorPath)) continue;
      if (normText(join(kitTools, f)) !== normText(mirrorPath)) {
        errors.push(`espejo desincronizado: tools/${f} difiere de .github/tools/${f} (EOL-normalizado); propaga la copia con node fs.copyFileSync`);
      }
    }
  }
}

// Version del kit: .github/KIT_VERSION (estampada por el instalador) en un
// destino instalado; kit.json en el repositorio fuente. Informativo, no fatal.
const kitVersionPath = join(kitRoot, 'KIT_VERSION');
const kitJsonPath = join(kitRoot, 'kit.json');
if (existsSync(kitVersionPath)) {
  console.log(`[info] version del kit instalado: ${read(kitVersionPath).split(/\r?\n/)[0].trim()}`);
} else if (existsSync(kitJsonPath)) {
  console.log(`[info] version del kit (repositorio fuente): ${JSON.parse(read(kitJsonPath)).version}`);
} else {
  console.log('[info] KIT_VERSION no encontrada: no se puede verificar la version del kit (instalacion manual?)');
}

if (errors.length) {
  console.error(`validacion del kit: ${errors.length} error(es)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`validacion del kit OK: ${mdFiles.length} archivos .md revisados`);

// Frescura del grafo de conocimiento (informativo, nunca fatal): el MCP sirve
// el graph.json que haya, aunque este semanas detras del codigo. Sin este
// aviso, nadie nota que el grafo obsoleto hasta que las respuestas del agente
// empiezan a citar simbolos que ya no existen.
const graphPath = join(kitRoot, '..', 'graphify-out', 'graph.json');
if (existsSync(graphPath)) {
  const ageH = Math.round((Date.now() - statSync(graphPath).mtimeMs) / 3600000);
  let headLine = null;
  try {
    const head = spawnSync('git', ['-C', kitRoot, 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' });
    if (head.status === 0 && head.stdout.trim()) headLine = head.stdout.trim();
  } catch { /* git ausente o no es repo: solo se reporta la antiguedad */ }
  console.log(`[info] grafo de conocimiento: graphify-out/graph.json generado hace ~${ageH} h${headLine ? `, ultimo commit del repo: ${headLine}` : ''}`);
  if (ageH > 336) {
    console.log('[info] grafo posiblemente obsoleto (>14 dias): corre "node tools/build-graphify.mjs update" (incremental, sin LLM) o "extract"');
  }
} else {
  console.log('[info] grafo de conocimiento: no existe graphify-out/graph.json (opcional; el kit funciona sin el)');
}
