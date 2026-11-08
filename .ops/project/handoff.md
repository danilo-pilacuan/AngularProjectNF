---
id: project-handoff
tipo: Guide
type: Guide
title: Handoff - contexto de continuidad entre sesiones
description: Documento de soporte para pasar contexto completo a una sesion nueva; el agente lo actualiza al cierre de cada tarea.
estado: vigente
dueno: rol:agente
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T19:55:00Z
relaciona: [ops-readme, project-readme]
status: stable
---

Documento de soporte (no es codigo): condensa el estado del producto, el
entorno local, los comandos de verificacion y el trabajo pendiente para que
una sesion nueva retome el desarrollo sin reexplorar el repositorio.
La politica de mantenimiento vive en las instrucciones del agente del repo
(seccion "Session handoff policy").

Regla: `.ops` organiza y enlaza; la fuente de verdad del avance es
`PROGRESS.md`. Este handoff resume, no duplica el detalle.

## Secciones (orden fijo, mantener al rellenar)

1. Header (blockquote): fecha real de hoy, rama activa y estado del arbol con hashes de commits relevantes.
2. Estado del producto: que es el sistema, fase/release actual, logros recientes.
3. Como usarlo: orden de lectura handoff -> PROGRESS.md -> especificacion de la fase activa.
4. Entorno local: servicios, puertos, env, credenciales demo, limitaciones del entorno (no defectos del producto).
5. Como levantar y verificar: comandos compose/test/E2E, que exige rebuild vs hot reload.
6. Mapa de documentos: tabla de documentos de soporte y cuando se actualiza cada uno.
7. Trabajo en curso y pendiente: lista priorizada; cada item indica si necesita codigo. Si un item se corta por bucle de reintentos (presupuesto de esfuerzo), indicar donde quedo, intentos gastados y que se pidio al usuario.
8. Historial de sesiones: una fila por sesion (alcance y resultado).

Bootstrap: copiar este archivo a `.ops/project/` del nuevo repo y rellenar
las secciones 2-8; la estructura y las reglas son reutilizables tal cual.

---

## Estado actual (2026-11-07, fase 14.5)

> Fecha: 2026-11-07. Rama: n/a en la raiz (orquestador); cada repo del multirepo tiene la suya
> (RC4/dev). Estado: fases 0-8 + 13 + 14 + 14.5 (credenciales persistidas en tabla propia,
> cambio de contrasena, /perfil) implementadas. Backend test_auth 23/23, shared-lib 152/152;
> E2E navegador verificado en dev (8100) y Docker (4400). Pendiente: revision humana para
> estados `verificado` y servicio de API en el compose de Docker. Migracion
> Angular Material 12.5 completada y verificada E2E (12/12 demo). Nueva deuda:
> rutas planas /api/etapas, /api/entregables, /api/bitacora (404 en runtime).

2. **Estado del producto:** ProjectHub, sistema documental para gobernar proyectos de software
   (ciclo de vida de 9 etapas, gates, matriz de responsabilidades, Gantt propio). Fases 0-7
   implementadas: 7 repos Angular 22 con Native Federation (dev 4300-4304, Docker 4400-4404),
   dominio puro en `@projecthub/shared` (98 tests), stores por InjectionToken, ui-lib con
   componentes base, mfe-projects (portafolio/detalle/etapas/presupuesto), mfe-admin
   (usuarios/roles/matriz), mfe-reports (reportes + widget remote-a-remote), mfe-governance
   (gates/entregables + GateStatusWidget), shell con Dashboard de 3 widgets federados,
   UserSwitcher y RemoteFallback.

4. **Entorno local:** Windows, node v24.21.0, npm 11.19.0, Docker 29.8.2. Rango 4200-4204
   ocupado en el host: desarrollo en 4300-4304, Docker en 4400-4404 (DEC-001). TypeScript debe
   ser 6.0.x (peer de @angular/build@22.2.4). `.env` de raiz es de graphify (no tocar);
   `deploy/graphify/` es infraestructura existente ajena a la app. Dev servers vivos en
   4300-4304 (procesos node independientes); stack Docker `projecthub-*` en 4400-4404.

5. **Como levantar y verificar:**
   - Dev: `npm start` en la raiz (o `npx ng serve --port 430x` por repo). Verificar
     `http://localhost:430x/remoteEntry.json` (200) y navegacion desde 4300. Tras alternar
     builds prod/dev, reiniciar los 5 dev servers (import map viejo -> ngDevMode).
   - Docker: `docker compose -f deploy/projecthub/docker-compose.yml build 2>&1 |
     Tee-Object -FilePath .dev-logs/docker-build.log` y luego `up -d`. Verificar
     antiguedad de imagenes (`docker images`), remoteEntry 200 en 4400-4404, manifest con
     URLs 440x, navegacion a las 4 rutas, F5 en /governance y consola sin errores.
   - Tests: `npm test` por repo (vitest). Totales de referencia: shared-lib 98, ui-lib 18,
     mfe-projects 26, mfe-admin 13, mfe-reports 5, mfe-governance 3, shell 6 = 169.
   - Tras cambiar `shared-lib` o `ui-lib`: `npx ng build` en la lib antes de servir las apps
     (las consumen por `file:../<lib>/dist/...`).
   - Politica de comandos: `.ops/development/command-safety.md` (prohibido descartar
     salida de evidencia; builds largos con log; evidencia etiquetada por stack).

7. **Trabajo en curso y pendiente:**
   - Servicio de API dentro del compose de Docker (4400-4404): hoy los
     frontends construidos llaman a `http://localhost:8100` por defecto
     (`API_BASE_URL`, shared-lib/api-enlace.ts); el nginx del shell no
     proxifica `/api` (POST responde 405 via SPA fallback). Hace falta un
     servicio `api` en `deploy/projecthub/docker-compose.yml` + override de
     `API_BASE_URL` por build/runtime. Necesita codigo.
   - Revision humana de estados `implementado` -> `verificado` (fases 0-14.5).
     No necesita codigo; la evidencia esta en PROGRESS.md.
   - Docker (4400-4404) sin reconstruir desde fase 14: las imagenes no incluyen
     la fase de autenticacion ni la pantalla de login. Necesita rebuild si se
     quiere verificar el stack Docker.

8. **Historial de sesiones:**

| fecha | alcance | resultado |
|---|---|---|
| 2026-11-05 (1) | Bootstrap .ops, plan de 9 fases, pivote multirepo (DEC-003) | fase 0: 7 repos + federacion + dominio (31 tests) + Docker 4400-4404 verificados |
| 2026-11-05 (2) | Fases 1-7: dominio completo, stores, ui-lib, 4 MFEs, shell dashboard | 169 tests verdes, 7 builds prod exit 0; fix start-dev.mjs; commits 86a4567, b5bfb26, 7ae2a6a, ac51a34 |
| 2026-11-05 (3) | Politica de comandos, rebuild Docker, fix de rutas del shell, verificacion E2E | command-safety.md; .dockerignore con **/ (contexto 1.7GB -> ~4 min); fix NG04014 en shell (342593b); verificado dev y docker de punta a punta; commits raiz 9a50792 |---|
| 2026-11-05 | Bootstrap `.ops` (OKF 0.2), REQ-001..011, plan 9 fases, BL-001..013, DEC-001/002, scaffold de referencia Angular 22 | hecho |
| 2026-11-05 | Pivote multirepo (DEC-003): correccion de especificaciones (funcionalidades 8.1, plan, backlog, fase-0, IMPL-001/002), limpieza de `projecthub-ref/` | hecho |
| 2026-11-05 | IMPL-001: 7 repos multirepo + federacion operativa (dev 4300-4304, fix ngDevMode, smoke completo) + deploy Docker 4400-4404 (Dockerfiles, nginx SPA+CORS, compose, manifest 440x) verificado de punta a punta | hecho |
| 2026-11-05 | IMPL-002: dominio puro en shared-lib (catalogos, errores, ciclo de vida, matriz 9x10, modelos, calculos) + 31 tests vitest en verde + build de lib | hecho |
| 2026-11-06 (fase 13.4, cierre) | Refresco de stores desde respuesta del servidor (supresion de eco por identidad), provider `proporcionarSincronizacionBackend()` (fix NG0203), restauracion de exposes federados perdidos en shell y 4 remotes, E2E con navegador contra dev 4300-4304 + backend 8100/Postgres (creacion de proyecto via UI, persistencia, recuperacion tras F5) | hecho: shared-lib 137/137, apps 5/5 verdes, builds prod 5/5; commits shared-lib feat + 5 apps fix. Leccion: cambiar exposes de `federation.config.mjs` exige reiniciar dev servers |
| 2026-11-06 (fase 14, autenticacion real) | Backend auth (login JWT HS256, /me, PBKDF2, credenciales demo, Bearer prioridad sobre X-Actor-Id), AutenticacionService/TokenAlmacen en shared-lib, Bearer automatico en ApiEnlaceService, pantalla /login + guard + cierre de sesion en shell, fix de tests hermeticos (conftest DATABASE_URL), E2E navegador completa (login, F5, escritura persistida con token, logout) | hecho: backend 101/101, shared-lib 148/148, shell 20/20, remotes y ui-lib verdes, builds 5/5; docs/funcionalidades.md 14.1-14.4 y plan.md actualizados |
| 2026-11-07 (migracion Material por componentes) | Cierre 12.5 por repo: ui-lib 9b8c11b, mfe-projects 7c915f6, mfe-admin d3d90ba, mfe-reports d9fe54c, mfe-governance 800a575, shell a057140 (mat-select/mat-button/ph-form-field + dedupe Material en vitest) | hecho: shell 20/20 tests, build 150.99 kB, arbol limpio en 9 repos; PROGRESS.md actualizado |
| 2026-11-07 (verificacion federada post-Material) | E2E Playwright tras a057140: fix de dev server obsoleto (chunk con UserSwitcher antiguo), relanzamiento ng serve 4300, 12/12 comprobaciones demo OK (mat-select, overlay, cambio de usuario, 4 rutas sin fallback, F5 profundo, consola limpia); detectadas rutas planas 404 del backend | hecho: evidencia en PROGRESS.md y session files; deuda de rutas registrada en pendientes |
| 2026-11-08 (rutas planas + fix push demo) | Backend: GET /api/etapas, /api/entregables, /api/bitacora planos + tests (109/109). shared-lib: actorId() null sin sesion y empujar() no envia en modo demo (153/153); rebuild dist + reinicio de servers con cache limpia. E2E: 12/12 con 0 recursos 404 | hecho: commits backend 96fa534, shared-lib 3f48335; deuda de rutas planas cerrada en esta seccion |
