/**
 * E2E iteracion 35: re-empuje automatico de escrituras hechas durante una
 * caida de API, contra la demo dockerizada en 4400.
 *
 * Flujo: login -> crear proyecto con API arriba (PUT ok) -> docker stop api
 * -> crear otro proyecto con la API caida usando navegacion client-side
 * (clic en "Nuevo proyecto" del portafolio; la navegacion con page.goto en
 * frio cae en /login porque el guard pierde la sesion) -> docker start api
 * -> el re-push automatico debe disparar un nuevo PUT al cabo del
 * debounce/sondeo, sin intervencion del usuario. La API queda arriba en el
 * finally.
 *
 * Nota (it. 35): el input de presupuesto tiene step=1000; el navegador
 * bloquea el submit por constraint validation cuando el valor viola el step
 * (silencioso, sin error visible). Por eso el presupuesto de prueba SIEMPRE
 * es multiplo de 1000.
 */
import { chromium } from 'file:///C:/USFQ/TESIS/playground/MVP_v1/projects/frontend/node_modules/playwright-core/index.mjs';
import { execSync } from 'node:child_process';

const BASE = 'http://localhost:4400';

const resultado = { ok: true, comprobaciones: [] };
function anotar(nombre, condicion, detalle = '') {
  resultado.comprobaciones.push({ nombre, ok: !!condicion, detalle });
  if (!condicion) resultado.ok = false;
  console.log(`${condicion ? 'OK ' : 'FALLO'} ${nombre}${detalle ? ' -- ' + detalle : ''}`);
}

function docker(accion) {
  execSync(`docker ${accion} projecthub-api-1`, { stdio: 'ignore' });
}

const apiArriba = async () => {
  try {
    const r = await fetch('http://localhost:8100/api/salud');
    return r.ok;
  } catch {
    return false;
  }
};

async function esperar(condicion, maxMs, pasoMs = 250) {
  let valor = await condicion();
  const t0 = Date.now();
  while (!valor && Date.now() - t0 < maxMs) {
    await new Promise((r) => setTimeout(r, pasoMs));
    valor = await condicion();
  }
  return valor;
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[type=email]', { timeout: 30000 });
  await page.locator('input[type=email]').fill('diana@projecthub.local');
  await page.locator('input[type=password]').fill('projecthub-demo');
  await page.locator('button[type=submit]').first().click();
  await page.waitForTimeout(3000);
}

async function llenarFormulario(page, nombre, descripcion, presupuesto, fecha) {
  await page.locator('input[type=text]').first().fill(nombre);
  await page.locator('textarea').first().fill(descripcion);
  await page.locator('input[type=number]').first().fill(presupuesto);
  await page.locator('input[type=date]').first().fill(fecha);
}

const browser = await chromium.launch({ headless: true });
try {
  anotar('pre: API arriba', await apiArriba());

  const page = await browser.newPage();
  const puts = [];
  page.on('request', (r) => {
    if (r.method() === 'PUT' && r.url().includes('/api/sincronizacion')) {
      puts.push({ t: Date.now(), url: r.url() });
    }
  });

  // 1. Login con API arriba.
  await login(page);

  // 2. Cambio con API arriba: crear proyecto (PUT ok).
  await page.goto(`${BASE}/projects/nuevo`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('input[type=text]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  const nombreUp = 'E2E RePush UP ' + Date.now();
  await llenarFormulario(page, nombreUp, 'Proyecto creado con API arriba por e2e-repush-api.mjs', '5000000', '2026-12-31');
  await page.locator('button', { hasText: 'Crear proyecto' }).first().click({ timeout: 20000 });
  await page.waitForTimeout(2500);
  const previos = puts.length;
  anotar('PUT con API arriba salio', previos > 0, `${previos} PUT(s)`);

  // 3. Cambio con API caida: cargar el portafolio CON la API arriba (toda
  // carga en frio con la API caida redirige a /login y pierde el contexto),
  // detener la API y recien ahi navegar client-side al formulario.
  await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('a', { hasText: 'Nuevo proyecto', timeout: 30000 });
  docker('stop');
  anotar('API detenida', await esperar(async () => !(await apiArriba()), 15000));
  await page.locator('a', { hasText: 'Nuevo proyecto' }).first().click({ timeout: 20000 });
  await page.waitForSelector('input[type=text]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  const nombreOffline = 'E2E RePush OFFLINE ' + Date.now();
  await llenarFormulario(page, nombreOffline, 'Proyecto escrito durante la caida', '5000000', '2026-12-15');
  await page.locator('button', { hasText: 'Crear proyecto' }).first().click({ timeout: 20000 });
  await page.waitForTimeout(2500);
  const enDetalleOffline = page.url().includes('/projects/detalle/');
  anotar('guardar() ejecuto offline (navego a detalle)', enDetalleOffline, page.url());
  const putsOffline = puts.length - previos;
  anotar('PUT offline emitido (falla por API caida)', putsOffline > 0, `${putsOffline} PUT(s)`);

  // 4. Restaurar: sin tocar nada, el re-push automatico debe salir solo.
  docker('start');
  anotar('API restaurada', await esperar(apiArriba, 20000));
  const t0 = Date.now();
  const rePush = await esperar(async () => puts.length > previos + putsOffline, 45000);
  anotar(
    're-push automatico tras recuperar (sin interaccion)',
    rePush,
    `+${puts.length - previos - putsOffline} PUT(s) en ${Date.now() - t0}ms`,
  );

  // 5. La app sigue viva: el dashboard responde tras todo el ciclo.
  await page.goto(`${BASE}/projects`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  const enVista = await page.locator('table, mat-card, app-proyecto-lista, main').first().isVisible().catch(() => false);
  anotar('app operativa al final del ciclo', enVista);
} catch (e) {
  anotar('error inesperado', false, String(e).slice(0, 200));
} finally {
  try {
    execSync('docker start projecthub-api-1', { stdio: 'ignore' });
  } catch {}
  await browser.close();
  const ok = resultado.comprobaciones.filter((c) => c.ok).length;
  console.log(`\n${ok}/${resultado.comprobaciones.length} comprobaciones OK -> ${resultado.ok ? 'EXITOSO' : 'CON FALLOS'}`);
  process.exit(resultado.ok ? 0 : 1);
}