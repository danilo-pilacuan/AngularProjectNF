// Verificacion E2E del banner de estado de API (item 11.6 de docs/funcionalidades.md).
// Requiere la demo dockerizada: shell en 4400, API en 8100 (compose deploy/projecthub).
// Uso: node e2e-banner-api.mjs
// Nota: el banner depende del sondeo de /api/salud; al reconstruir imagenes hay que
// limpiar la cache HTTP del navegador (el script usa contexto nuevo, sin cache).
import { chromium } from 'file:///C:/USFQ/TESIS/playground/MVP_v1/projects/frontend/node_modules/playwright-core/index.mjs';
import { execSync } from 'node:child_process';

const SHELL = 'http://localhost:4400';
const API = 'http://localhost:8100/api/salud';

const resultados = [];
const anotar = (ok, etiqueta, detalle = '') => {
  resultados.push({ ok, etiqueta, detalle });
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${etiqueta}${detalle ? ' :: ' + detalle : ''}`);
};

const apiArriba = () => {
  try {
    const out = execSync(`curl -s -o /dev/null -w "%{http_code}" ${API}`, { encoding: 'utf8', timeout: 10000 });
    return out.trim() === '200';
  } catch {
    return false;
  }
};

const apiControl = (accion) => {
  execSync(`docker ${accion} projecthub-api-1`, { encoding: 'utf8', timeout: 60000 });
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errores = [];
page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 140)); });
page.on('pageerror', (err) => errores.push(`[pageerror] ${err.message.slice(0, 140)}`));

try {
  // 0. Estado inicial: API arriba y banner ausente.
  if (!apiArriba()) {
    apiControl('start projecthub-api-1');
    for (let i = 0; i < 10 && !apiArriba(); i++) await new Promise((r) => setTimeout(r, 1000));
  }
  anotar(apiArriba(), 'API arriba al iniciar', API);

  await page.goto(SHELL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);
  const bannerInicial = await page.locator('.shell-banner-api').count();
  anotar(bannerInicial === 0, 'sin banner con la API disponible', `count=${bannerInicial}`);

  // 1. Caida: detener el contenedor de la API; el banner debe aparecer (~5 s de sondeo).
  apiControl('stop projecthub-api-1');
  await page.waitForSelector('.shell-banner-api', { state: 'visible', timeout: 30000 });
  const texto = (await page.locator('.shell-banner-api').innerText()).replace(/\s+/g, ' ');
  anotar(texto.includes('Sin conexion con el backend'), 'banner aparece con la API caida', texto.slice(0, 120));
  anotar(texto.includes('modo demo'), 'banner anuncia modo demo', texto.slice(0, 120));

  // 2. La app sigue operando en modo demo (el dashboard no se rompe).
  const cuerpo = await page.locator('body').innerText();
  anotar(cuerpo.includes('Dashboard'), 'dashboard sigue renderizando durante la caida');

  // 3. Recuperacion: arrancar la API; el banner debe desaparecer en el proximo sondeo (<=15 s).
  apiControl('start projecthub-api-1');
  for (let i = 0; i < 12 && !apiArriba(); i++) await new Promise((r) => setTimeout(r, 1000));
  anotar(apiArriba(), 'API restaurada');
  await page.waitForSelector('.shell-banner-api', { state: 'detached', timeout: 30000 });
  anotar(true, 'banner se retira al recuperar la API');

  // 4. Consola sin errores de Angular tras el ciclo completo.
  const graves = errores.filter((e) => e.includes('NG0') || e.startsWith('[pageerror]') || e.includes('not a function'));
  anotar(graves.length === 0, 'consola sin errores graves durante el ciclo', graves.slice(0, 3).join(' | '));
} finally {
  // Garantia: dejar la API arriba pase lo que pase.
  try { apiControl('start projecthub-api-1'); } catch {}
  await browser.close();
}

const fallas = resultados.filter((r) => !r.ok);
console.log(`\nRESULTADO: ${resultados.length - fallas.length}/${resultados.length} comprobaciones OK`);
if (fallas.length > 0) {
  console.log('FALLAS:');
  for (const f of fallas) console.log(` - ${f.etiqueta}`);
  process.exit(1);
}
