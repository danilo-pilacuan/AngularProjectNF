/**
 * E2E iteracion 53: semantica append-only de la bitacora en el re-sync
 * (VULN-001, invariante 3.5), contra la demo dockerizada (API 8100).
 *
 * Flujo (solo HTTP, actor real por Bearer):
 *   A. PUT con bitacora: [] -> 200 y el servidor conserva su copia
 *      completa (omision = no-op; un push stale no borra el historial).
 *   B. PUT modificando una entrada vigente -> 422 VALIDACION.
 *   C. PUT agregando una entrada nueva con autorId ajeno al actor -> 422
 *      (la bitacora solo crece por acciones propias; VULN-001).
 *   D. PUT agregando una entrada propia -> 200 y queda registrada.
 *   Limpieza: elimina las filas de la sonda (ids b-e2e-53-*) via psql en
 *   projecthub-db-demo y verifica que la bitacora vuelve al original.
 *
 * Uso: node tools/e2e/e2e-bitacora-append-api.mjs
 */
import { execSync } from 'node:child_process';

const API = 'http://localhost:8100';
const CORREO = 'diana@projecthub.local';
const CONTRASENA = 'projecthub-demo';
const PREFIJO_SONDA = 'b-e2e-53-';

const resultados = [];
const anotar = (ok, etiqueta, detalle = '') => {
  resultados.push({ ok, etiqueta, detalle });
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${etiqueta}${detalle ? ' :: ' + detalle : ''}`);
};

const entradaSonda = (id, autorId, proyectoId) => ({
  id,
  proyectoId,
  autorId,
  fecha: new Date().toISOString(),
  tipo: 'cambio',
  etapaOrigen: null,
  etapaDestino: null,
  comentario: 'Sonda e2e iteracion 53 (se elimina al terminar)',
});

const limpiarFilasSonda = () => {
  execSync(
    `docker exec projecthub-db-demo psql -U projecthub -d projecthub -c "DELETE FROM bitacora WHERE id LIKE '${PREFIJO_SONDA}%'"`,
    { stdio: 'ignore', timeout: 30000 },
  );
};

const idsDe = (bitacora) => bitacora.map((b) => b.id);

try {
  limpiarFilasSonda();

  // Login real (produccion: Bearer).
  const loginResp = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: CORREO, contrasena: CONTRASENA }),
  });
  anotar(loginResp.status === 200, 'login de diana (Bearer)');
  const { token } = await loginResp.json();
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Estado inicial.
  const estadoResp = await fetch(`${API}/api/sincronizacion`, { headers: auth });
  anotar(estadoResp.status === 200, 'GET /api/sincronizacion con sesion');
  const estado = await estadoResp.json();
  const idsOriginales = idsDe(estado.bitacora);
  anotar(idsOriginales.length >= 1, 'bitacora inicial con entradas', `n=${idsOriginales.length}`);
  const proyectoId = estado.proyectos[0].id;

  // A. Borrado total: 200 y conservacion (omision = no-op).
  const borrado = await fetch(`${API}/api/sincronizacion`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ ...estado, bitacora: [] }),
  });
  const borradoOk = borrado.status === 200;
  const borradoCuerpo = borradoOk ? await borrado.json() : null;
  anotar(borradoOk, 'A: PUT con bitacora vacia responde 200');
  anotar(
    borradoOk && JSON.stringify(idsDe(borradoCuerpo.bitacora)) === JSON.stringify(idsOriginales),
    'A: el servidor conserva su bitacora completa (no-op)',
  );

  // B. Modificacion de una entrada vigente: 422.
  const primera = estado.bitacora[0];
  const modificada = [{ ...primera, comentario: 'editado por sonda' }, ...estado.bitacora.slice(1)];
  const modResp = await fetch(`${API}/api/sincronizacion`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ ...estado, bitacora: modificada }),
  });
  anotar(modResp.status === 422, 'B: modificar entrada vigente responde 422');

  // C. Append ajeno (actor diana=u-admin empuja entrada de u-pm): 422.
  const ajena = entradaSonda(`${PREFIJO_SONDA}ajena`, 'u-pm', proyectoId);
  const ajenaResp = await fetch(`${API}/api/sincronizacion`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ ...estado, bitacora: [...estado.bitacora, ajena] }),
  });
  anotar(ajenaResp.status === 422, 'C: append con autorId ajeno responde 422');

  // D. Append propio: 200 y la entrada queda registrada.
  const propia = entradaSonda(`${PREFIJO_SONDA}propia`, 'u-admin', proyectoId);
  const propiaResp = await fetch(`${API}/api/sincronizacion`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ ...estado, bitacora: [...estado.bitacora, propia] }),
  });
  const propiaOk = propiaResp.status === 200;
  anotar(propiaOk, 'D: append propio responde 200');
  if (propiaOk) {
    const trasPush = await propiaResp.json();
    anotar(idsDe(trasPush.bitacora).includes(propia.id), 'D: la entrada propia queda registrada');
  }

  // Limpieza y verificacion final.
  limpiarFilasSonda();
  const finalResp = await fetch(`${API}/api/sincronizacion`, { headers: auth });
  const finalEstado = await finalResp.json();
  anotar(
    JSON.stringify(idsDe(finalEstado.bitacora)) === JSON.stringify(idsOriginales),
    'limpieza: la bitacora vuelve al estado original',
  );
} finally {
  // Garantia: la sonda nunca deja filas propias en la demo.
  try { limpiarFilasSonda(); } catch {}
}

const fallas = resultados.filter((r) => !r.ok);
console.log(`\nRESULTADO: ${resultados.length - fallas.length}/${resultados.length} comprobaciones OK`);
if (fallas.length > 0) {
  console.log('FALLAS:');
  for (const f of fallas) console.log(` - ${f.etiqueta}`);
  process.exit(1);
}
