#!/usr/bin/env node
// Contador de intentos del presupuesto de esfuerzo (secciones "Reglas de
// trabajo" y "Presupuesto de esfuerzo" del nucleo de instrucciones).
// El interruptor es contable, no subjetivo: contabiliza repeticiones del mismo
// tipo de accion sobre el mismo objetivo y devuelve un veredicto por exit code.
// Es una cinta de seguridad: frena reintentos, no sustituye el criterio.
// Node >= 18, sin dependencias.
//
// Uso:
//   node loop-guard.mjs bump --accion retry-command --objetivo "npm test" --evidencia "exit 1"
//   node loop-guard.mjs status
//   node loop-guard.mjs status --objetivo "npm test"
//   node loop-guard.mjs mark-closed --objetivo "npm test"   (el usuario decidio; reinicia)
//
// Exit codes: 0 = continua | 1 = modo-plan (consultar al usuario, sin herramientas)
//             2 = tope-emergencia (cerrar el turno con informe y plan)
// El contador vive en `.ops/loop-guard.json` (estado efimero de sesion).

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { cwd } from 'node:process';

const LEDGER_PATH = join(cwd(), '.ops', 'loop-guard.json');
const PLAN_AT = 3;
const EMERGENCY_AT = 10;
const ACCIONES = 'retry-command | rewrite-file | reread-docs | fix-error';

const USAGE = `uso:
  node loop-guard.mjs bump --accion <tipo> --objetivo <objetivo> [--evidencia <texto>]
      <tipo>: ${ACCIONES}
  node loop-guard.mjs status [--objetivo <objetivo>]
  node loop-guard.mjs mark-closed --objetivo <objetivo>`;

// ---------- argumentos ----------
const [cmd, ...rest] = process.argv.slice(2);
const flags = {};
for (let i = 0; i < rest.length; i += 2) {
  if (!rest[i].startsWith('--') || i + 1 >= rest.length) {
    console.error(`${USAGE}`);
    process.exit(1);
  }
  flags[rest[i].slice(2)] = rest[i + 1];
}
for (const v of Object.values(flags)) {
  if (v === '' || v.length > 500) {
    console.error('loop-guard: valores de --accion/--objetivo/--evidencia vacios o > 500 caracteres');
    process.exit(1);
  }
}

function clave(accion, objetivo) {
  return `${accion}|${objetivo}`;
}

// ---------- ledger ----------
function readLedger() {
  if (!existsSync(LEDGER_PATH)) return { version: 1, entries: [] };
  try {
    const parsed = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
    if (!Array.isArray(parsed.entries)) throw new Error('sin entries');
    return parsed;
  } catch {
    console.error(`loop-guard: ledger ilegible o corrupto, se reinicia -> ${LEDGER_PATH}`);
    return { version: 1, entries: [] };
  }
}

function writeLedger(ledger) {
  mkdirSync(dirname(LEDGER_PATH), { recursive: true });
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n');
}

function veredicto(intentos) {
  if (intentos >= EMERGENCY_AT) return 'tope-emergencia';
  if (intentos >= PLAN_AT) return 'modo-plan';
  return 'continua';
}

// ---------- comandos ----------
if (cmd === 'bump') {
  const { accion, objetivo, evidencia } = flags;
  if (!accion || !objetivo) {
    console.error(`${USAGE}`);
    process.exit(1);
  }
  const ledger = readLedger();
  const c = clave(accion, objetivo);
  let entry = ledger.entries.find((e) => e.clave === c);
  if (!entry) {
    entry = { clave: c, accion, objetivo, intentos: 0, veredicto: 'continua', ultimaEvidencia: '', actualizado: '' };
    ledger.entries.push(entry);
  }
  entry.intentos += 1;
  entry.ultimaEvidencia = evidencia ?? '';
  entry.actualizado = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  entry.veredicto = veredicto(entry.intentos);
  writeLedger(ledger);
  console.log(`loop-guard: ${entry.intentos} intento(s) de "${accion}" sobre "${objetivo}"`);
  console.log(`veredicto: ${entry.veredicto}`);
  if (entry.veredicto === 'modo-plan') {
    console.log(`-> deja de ejecutar; consulta al usuario en texto plano (que intentaste, ultimo error, 2-3 caminos) y no uses herramientas hasta responder`);
  } else if (entry.veredicto === 'tope-emergencia') {
    console.log('-> cierra el turno con el informe del bloqueo y el plan propuesto; no sigas iterando');
  }
  process.exit(entry.veredicto === 'continua' ? 0 : entry.veredicto === 'modo-plan' ? 1 : 2);
} else if (cmd === 'status') {
  const ledger = readLedger();
  const entries = flags.objetivo
    ? ledger.entries.filter((e) => e.objetivo === flags.objetivo)
    : ledger.entries;
  if (!entries.length) {
    console.log('loop-guard: sin intentos registrados');
    process.exit(0);
  }
  for (const e of entries.sort((a, b) => b.intentos - a.intentos)) {
    console.log(`[${e.veredicto}] ${e.intentos}x ${e.clave}${e.ultimaEvidencia ? ` :: ${e.ultimaEvidencia}` : ''}`);
  }
  process.exit(entries.some((e) => e.veredicto === 'tope-emergencia') ? 2 : entries.some((e) => e.veredicto === 'modo-plan') ? 1 : 0);
} else if (cmd === 'mark-closed') {
  const { objetivo } = flags;
  if (!objetivo) {
    console.error(`${USAGE}`);
    process.exit(1);
  }
  const ledger = readLedger();
  const before = ledger.entries.length;
  ledger.entries = ledger.entries.filter((e) => e.objetivo !== objetivo);
  if (!before) {
    console.log(`loop-guard: nada que cerrar para "${objetivo}"`);
    process.exit(0);
  }
  if (ledger.entries.length === 0 && existsSync(LEDGER_PATH)) unlinkSync(LEDGER_PATH);
  else writeLedger(ledger);
  console.log(`loop-guard: cerrado por el usuario -> "${objetivo}" (contador reiniciado)`);
  process.exit(0);
} else {
  console.error(`${USAGE}`);
  process.exit(1);
}
