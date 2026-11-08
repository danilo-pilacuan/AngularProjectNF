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

## Estado actual (2026-11-08, fase 14.5 + demo completa + fix widget)

> Fecha: 2026-11-08. Rama: n/a en la raiz (orquestador); cada repo del multirepo tiene la suya
> (RC4/dev). Estado: fases 0-8 + 13 + 14 + 14.5 + rutas planas + migracion Angular Material
> (12.5) implementadas. API y db Postgres dockerizadas en el compose demo (deploy 1deb0b8):
> 8100 con login JWT y persistencia real, demo reconstruida con Material y E2E 12/12 con 0
> recursos 404 en 4400-4404. Widget remote-a-remote RESUELTO (2026-11-08, shared-lib 7e840ec
> + shell 58661b5 + mfe-reports 8b5481a): token REMOTE_MODULE_LOADER en @projecthub/shared;
> E2E dev 4300 8/8 OK. Lint formal (deuda 11.4) HECHO (2026-11-08): eslint 9 + angular-eslint
> 22 en los 7 repos frontend con commits 8ef80c9, ec15cff, 0e81473, 8e0df10, daf2e3f,
> b1a671b, 15b77bf; prefijos ph (API publica) / app (resto). Lint backend HECHO (2026-11-08):
> ruff 0.17.4 (pyproject.toml, E/F/I/B/UP) en el backend, check exit 0, pytest 109/109,
> commit 5ba04b5. Pagina de documentos/entregables en mfe-governance HECHA (2026-11-08,
> commits shared-lib fe863d0 + mfe-governance b7c5acc): primer contenido real del remote,
> gate con resumen aprobados/pendientes/faltantes. Pendiente: revision humana de estados
> `verificado` y gate de lint en el DoD.

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
   - API demo: el compose incluye `api` (8100) y `db` (postgres, host 5434);
     `docker compose -f deploy/projecthub/docker-compose.yml up -d api` levanta ambos.
     Verificar `curl http://localhost:8100/api/salud`, login (diana@projecthub.local /
     projecthub-demo) y GET /api/sincronizacion con Bearer. DATABASE_URL y AUTH_SECRET
     aceptan override por entorno (ver docker-compose.yml).
   - Tests: `npm test` por repo (vitest). Totales de referencia: shared-lib 153,
     ui-lib 18, mfe-projects 26, mfe-admin 13, mfe-reports 5, mfe-governance 11,
     shell 20 = 246 (+109 pytest del backend).
   - Tras cambiar `shared-lib` o `ui-lib`: `npx ng build` en la lib antes de servir las apps
     (las consumen por `file:../<lib>/dist/...`).
   - Politica de comandos: `.ops/development/command-safety.md` (prohibido descartar
     salida de evidencia; builds largos con log; evidencia etiquetada por stack).

7. **Trabajo en curso y pendiente:**
   - Iteracion 23 (regresion E2E de flujos de escritura) -> HECHA (2026-11-08):
     rerun de files/e2e-flujos.mjs tras el cambio de UI de la iteracion 22,
     14/14 OK (proyecto + etapa + F5 + entregable + autoaprobacion rechazada +
     aprobacion Sponsor + gate + proteccion sin sesion + consola limpia).
     Sin cambios de codigo.
   - Iteracion 22 (nombres de usuario resueltos en la UI) -> HECHA (2026-11-08):
     portafolio/detalle/CSV ya muestran nombres (UsuarioStore) en vez de IDs
     crudos; ID tecnico como tooltip; ph-pill con input title opcional
     (ui-lib 583281e). Verificado con tests (ui-lib 40/40, mfe-projects 29/29),
     lint, builds y navegador integrado sobre shell 4300. Commits mfe-projects
     11020cb + e989b70; docs 2.2/2.4 actualizados.
   - Iteracion 21 (E2E de filtros de listas) -> HECHA (2026-11-08): rerun de
     files/e2e-filtros.mjs tras reinicio del equipo, 12/12 OK (portafolio,
     documentos, bitacora, usuarios, consola limpia incl. NG0956). Sin cambios
     de codigo; docs/funcionalidades.md 2.3 actualizado; commit raiz a586d91.
   - Revision humana de estados `implementado` -> `verificado` (fases 0-14.5,
     demo Docker y fix del widget). No necesita codigo; la evidencia esta en
     PROGRESS.md.
   - Cerrado (2026-11-08): widget remote-a-remote (mfe-reports ->
     ProjectSummaryWidget de mfe-projects) colgaba en "Cargando widget...".
     Causa: copia del runtime NF sin inicializar enlineada en el chunk
     expuesto (federationPromise pendiente eterno). Solucion: token
     REMOTE_MODULE_LOADER en @projecthub/shared (shared-lib 7e840ec, shell
     58661b5, mfe-reports 8b5481a, provider en app.config de los 3 remotes
     restantes). Compartir el runtime NF como shared fue descartado (rompe el
     boot en dev: el import map solo existe tras initFederation). Evidencia:
     chunks expuestos sin runtime, tests 219/219 + backend 109/109, E2E dev
     4300 8/8 con F5 y consola limpia.

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
| 2026-11-08 (API + db en compose demo) | deploy: api.Dockerfile (python 3.14, uvicorn 8100) + servicios api/db en docker-compose.yml (Postgres 17 demo en 5434, AUTH_SECRET >= 32 bytes). Verificado: salud, login JWT, sincronizacion (7/6/5/10/5), persistencia psql. Rebuild de los 5 frontends demo (ahora con Material + login) y E2E demo 12/12 con 0 404 | hecho: commit deploy 1deb0b8; backend/shared-lib sin cambios; uvicorn dev detenido, 8100 es de la API dockerizada |
| 2026-11-08 (widget remote-a-remote) | Fix definitivo del hang del widget federado remote a remote: token REMOTE_MODULE_LOADER en @projecthub/shared (patron SESION_STORE), providers en los 5 app.config, consumidores via remoteModuleLoader() con validacion de export; descartado compartir el runtime NF (rompe boot dev). Evidencia: 10 chunks expuestos sin runtime, tests 219/219 + backend 109/109, E2E dev 4300 8/8 con login real y F5 | hecho: commits shared-lib 7e840ec, shell 58661b5, mfe-reports 8b5481a, mfe-projects 85b9fee, mfe-admin 50dc27e, mfe-governance 71d2ec5; E2E actualizado a login real (token JWT persiste, el modo demo no) |
| 2026-11-08 (lint backend ruff) | Cierre de la deuda 11.4 en el backend: pyproject.toml con ruff 0.17.4 (E/F/I/B/UP, line 120, B008 extendido para Depends de FastAPI), 121 -> 0 errores (E402 logger, UP031 f-strings con textos de error intactos, ruff format en 10 archivos), pytest 109/109 tras el formato, ruff>=0.17 en requirements.txt | hecho: commit backend 5ba04b5; lint formal cerrado en los 8 repos |
| 2026-11-08 (validacion en demo Docker) | El fix REMOTE_MODULE_LOADER validado en la demo prod-like 4400: imagenes 440x ya contienen el token (verificado con grep dentro de imagenes shell y mfe-reports), contenedores recreados con up -d; E2E demo 8/8 con login real (dashboard 4 widgets, widget remote a remote con avance Intl, F5, consola limpia, 0 recursos >= 400) | hecho: sin cambios de codigo; evidencia en PROGRESS.md 2026-11-08 |
| 2026-11-08 (iteracion 21: E2E filtros) | Rerun de e2e-filtros.mjs tras reinicio del equipo: 12/12 OK (portafolio con filtro etapa y busqueda, documentos cambia gate/tabla, bitacora filtra por proyecto, usuarios + formulario roles, consola limpia incl. NG0956, 0 recursos >= 400) | hecho: docs/funcionalidades.md 2.3 actualizado; commit raiz a586d91 |
| 2026-11-08 (lint formal 7 repos) | eslint 9 + angular-eslint 22 (flat config) en shell, mfe-projects, mfe-reports, mfe-admin, mfe-governance, shared-lib y ui-lib; fixes de imports sin uso y hosts de spec a app-*; en ui-lib, configs duales de directive-selector (atributo camelCase + elemento kebab-case anidados en un arreglo) para validar la @Directive ph-data-table-column. Lint+tests+build verdes en los 7; tests 237 frontend sin cambio | hecho: commits shell 8ef80c9, mfe-projects ec15cff, mfe-reports 0e81473, mfe-admin 8e0df10, mfe-governance daf2e3f, shared-lib b1a671b, ui-lib 15b77bf; pendiente lint backend (ruff) |
| 2026-11-08 (pagina documentos/gates) | Primera pagina real de mfe-governance: Documentos y entregables (filtro de proyecto, tarjeta de gate con aprobados/pendientes/faltantes, tabla con aprobacion por matriz, carga v1 pendiente, casos limite autor-propio y proyecto no activo). Dominio: EstadoGate.aprobados en shared con test | hecho: mfe-governance 11/11 (antes 2), build+lint exit 0, shared-lib 153/153; commits shared-lib fe863d0, mfe-governance b7c5acc |
| 2026-11-08 (iteraciones 2-3: Material y store unico) | mat-checkbox para dependencias de etapa en proyecto-detalle (ultimo control nativo, cierra 12.4); E2E federado del store unico 7/7 (sesion compartida, lecturas cross-MFE, escritura en mfe-projects visible en /reports/presupuesto, consola limpia) y segunda corrida idempotente 7/7; proyecto de prueba cancelado via API | hecho: 8.4 marcado con evidencia; commits mfe-projects be5afd3, raiz docs 8b71e43 + commit de esta sesion |
| 2026-11-08 (iteracion 4: pagina bitacora cross-proyecto) | Pagina Bitacora en mfe-governance (ruta /governance/bitacora): solo lectura, lista la bitacora de todo el portafolio con filtros por proyecto y tipo, transiciones legibles (Origen -> Destino) y autores resueltos; reusa ph-data-table, ph-permission-banner e intl.fecha. Fix del spec: asercion de orden por fecha formateada era lexicografica (no cronologica) y se reemplazo por primera fila = registro mas reciente | hecho: 3.8 en docs/funcionalidades.md; mfe-governance 18/18, build+lint exit 0; commit mfe-governance (feat governance) |
| 2026-11-08 (iteracion 5: mejoras de bitacora) | Detalle de proyecto (mfe-projects): bitacora con fecha formateada (intl.fecha), autor resuelto por nombre y etiqueta de tipo; bug de fechas corregido (recortar ISO a YYYY-MM-DD retrocedia un dia en UTC-negativo, ahora se formatea el ISO completo). Pagina Bitacora (mfe-governance): boton Exportar CSV (helpers serializarCsv/descargarArchivo/nombreConFecha de @projecthub/shared, patron de mfe-reports/presupuesto). 2 tests nuevos de export | hecho: notas en 2.4, 3.5 y 7.5; mfe-governance 20/20, mfe-projects 26/26, build+lint exit 0; commits mfe-projects 14d1eec, mfe-governance 01ef742 |
| 2026-11-08 (iteracion 6: e2e federado de bitacora + nav del remote) | E2E federado de la pagina Bitacora 11/11 (login real, link en nav, URL directa, render de semilla, filtro por tipo, descarga CSV real bitacora-YYYY-MM-DD-HHmm.csv, ruta profunda sin sesion redirige a /login con query de, consola limpia). Hallazgo: en federado el app.html del remote nunca se renderiza (el shell monta las rutas del remote directamente); se agrego app-nav-governance dentro de las paginas Documentos y Bitacora con test propio | hecho: mfe-governance 22/22, build+lint exit 0, commit 0103a1a; E2E en session-state files/e2e-bitacora.mjs |
| 2026-11-08 (iteracion 7: catalogo compartido de tipos de bitacora) | Deduplicacion: TIPOS_BITACORA / TipoBitacora / ETIQUETA_TIPO_BITACORA en shared-lib domain/catalogos con specs propios; BitacoraEntrada.tipo tipada; mfe-governance y mfe-projects consumen el catalogo en vez de constantes/ternarios locales | hecho: shared-lib 157/157, mfe-governance 22/22, mfe-projects 26/26, build+lint exit 0 en los 3; commits shared-lib aac61cc, mfe-governance 0404ae5, mfe-projects 245d5e8 |
| 2026-11-08 (iteracion 8: componente generico ph-section-nav) | ph-section-nav en ui-lib (pills RouterLinkActive, links/ariaLabel/exact, exact solo en el primer enlace); consumido por tablero-general y presupuesto (mfe-reports) y usuarios y matriz (mfe-admin, matriz pierde su boton puntual); specs de tablero-general y presupuesto con provideRouter nuevo; fix NG2012 (PromptDialogService era servicio en imports) | hecho: ui-lib 30/30, mfe-reports 5/5, mfe-admin 13/13, build+lint exit 0 en los 3; commits ui-lib 2705727, mfe-reports 2515df3, mfe-admin c7c1e4b; pendiente: deduplicar NavGovernance sobre ph-section-nav |
| 2026-11-08 (iteracion 9: dedupe de NavGovernance) | NavGovernance (ts/html/scss/spec) eliminado; Documentos y Bitacora usan ph-section-nav con navLinks locales; comportamiento identico (exact raiz + prefijo bitacora) | hecho: mfe-governance 20/20, build+lint exit 0; commit mfe-governance 1e37c1d |
| 2026-11-08 (iteracion 10: fechaHora en IntlFormat) | IntlFormat fechaHora()/fechaHoraSegundos() (es-CO 12 h, '-' en null/invalid); Bitacora de mfe-governance y bitacora de proyecto-detalle (mfe-projects) consumen fechaHora; asercion de orden del spec de bitacora actualizada al formato 12 h | hecho: ui-lib 32/32, mfe-governance 20/20, mfe-projects 26/26, build+lint exit 0; commits ui-lib 982ca32, mfe-governance 41cb28b, mfe-projects 08dd5a4 |
| 2026-11-08 (iteracion 11: tabla presupuesto sobre ph-data-table) | Auditoria Material transversal: botones ya en Material en los 5 apps; ph-data-table gana input pie (mat-footer-row reutilizando plantillas #cell); presupuesto (mfe-reports) migrado de tabla nativa a ph-data-table con totales en el pie | hecho: ui-lib 34/34, mfe-reports 5/5, build+lint exit 0; commits ui-lib 8148391, mfe-reports 671dca1; pendiente: matriz de mfe-admin (tabla cruzada, decidir si mat-table aporta) |
| 2026-11-08 (iteracion 12: matriz sobre mat-table) | Ultima tabla nativa (matriz de mfe-admin) migrada a <table mat-table> con 11 columnas explicitas (etapa + 10 acciones); celdas conservan td.celda/.vacia y title; spec vigente pasa sin cambios | hecho: mfe-admin 13/13, build+lint exit 0; commit mfe-admin c2d7f58 |
| 2026-11-08 (iteracion 13: widget remote-a-remote en runtime) | Cierre del caveat de 11.5: E2E federado 8/8 (mfe-reports consume ProjectSummaryWidget de mfe-projects, cambio de proyecto, F5, consola limpia). Incidente previo diagnosticado: todos los Module caian al fallback silencioso del shell sin errores visibles por build desactualizado (HMR cache) en dev servers 4300/4302; reinicio del ng serve restauro los 3 remotes | hecho: E2E 8/8 con evidencia en PROGRESS.md; docs/funcionalidades.md 11.5 actualizado; commit raiz 0e0ea1a (docs) |
| 2026-11-08 (iteracion 14: observabilidad del fallback federado) | Bateria de regresion federada en verde tras reiniciar dev servers: e2e-federado 12/12, e2e-widgets 8/8, e2e-store-unico 7/7, e2e-bitacora 11/11 (38 checks). Mejora de observabilidad: cargaRemote() en shell app.routes.ts registra en consola el remote y el error real antes de recurrir al fallback silencioso; loader inyectable para unit tests | hecho: shell 22/22 (2 specs nuevos), build+lint exit 0; commit shell a003638 |
| 2026-11-08 (iteracion 15: ph-pill generico en ui-lib) | Nuevo Pill (ph-pill) en ui-lib con tono (ok|info|warn|danger|neutral|primario) y contenido requerido sobre tokens --ph-color-*; migrados gate Abierto/Cerrado, estado de entregable (documentos) y tipo de registro (bitacora) de mfe-governance; eliminados los bloques .pill duplicados de documentos.scss y bitacora.scss (-37 lineas); chips del gate se conservan (conteo) como candidato futuro | hecho: ui-lib 37/37 (3 specs nuevos), mfe-governance 20/20, build+lint exit 0 en ambos; commits ui-lib 01a1448, mfe-governance 93720f2 |
| 2026-11-08 (iteracion 16: chips del gate y metadata sobre ph-pill) | Chips de conteo del gate (documentos) y metadata de proyecto-detalle (mfe-projects) migrados a ph-pill; ph-pill normalizado al formato chip (0.15rem 0.6rem, 0.75rem, sin uppercase, tono neutral como variante metadata); eliminados los ultimos estilos .chip hand-rolled de ambos SCSS; ph-stage-badge intacto (decision 12.3) | hecho: ui-lib 37/37, mfe-governance 20/20, mfe-projects 26/26, build+lint exit 0 en los 3; commits ui-lib dad3e6c, mfe-governance c4ebebd, mfe-projects fd88177 |
| 17 | 2026-11-08 | prompt-dialog de ui-lib migrado a mat-form-field + matInput (DEC-005); eliminado el ultimo input nativo hand-rolled; ui-lib 38/38 build+lint ok; commit 78baba2 | Agente |
| 2026-11-08 02:57 | E2E 38/38 tras relanzar dev servers (build viejo enmascaraba iteraciones 15-17); bitacora/prompt-dialog/ph-pill verificados en runtime |
| 18 | 2026-11-08 | Exportacion PDF de reportes (7.5) sin dependencias: generarHtmlPdf/imprimirPdf en shared-lib; botones y tablas en tablero-general y presupuesto (mfe-reports); E2E nuevo e2e-pdf 14/14 + regresion 52/52 checks; leccion: reiniciar ng serve si el dist de shared-lib se reconstruye en caliente (watcher envenenado) | hecho: shared-lib 161/161, mfe-reports 5/5, build+lint exit 0; commits shared-lib 7f16aca, mfe-reports 4549935 | Agente |
| 19 | 2026-11-08 | E2E de flujos de escritura por UI (e2e-flujos, 14/14): crear proyecto -> etapa -> entregable en /governance -> autoaprobacion rechazada (mensaje de dominio) -> aprobacion por Sergio (Sponsor) -> gate visible -> proteccion sin sesion -> F5 y consola limpia. Hallazgos: ruta real de Documentos es /governance (path '' del remote; /governance/documentos cae al fallback del shell); quirks Playwright+Material (aria-disabled en mat-option); sin bug de producto | hecho: bateria escritura 14/14, regresion bitacora 11/11 durante diagnostico; scripts en files/ de sesion | Agente |
| 2026-11-08 (iteracion 20) | E2E de gate de etapa por UI (files/e2e-transiciones.mjs, 19/19): proyecto nuevo -> gate cerrado con mensaje de dominio -> acta cargada -> autoaprobacion rechazada -> aprobacion Sponsor -> transicion Planteamiento->Iniciativa -> bitacora -> gate recalculado (Falta entregable: Documento de iniciativa) -> sin retroceso -> F5 persiste -> consola limpia. Fixes NG0956: track \ en transiciones/faltantes/pendientesAprobacion (proyecto-detalle) y en roles de user-switcher (shell). Commits: mfe-projects 033d300, shell 05eb519. Script E2E en files/ de sesion (no commiteado por politico). | hecho |
| 2026-11-08 (iteracion 21, cortada por reinicio) | E2E de filtros de listas (files/e2e-filtros.mjs en files/ de sesion): script creado y 2 fixes de asercion aplicados; primera corrida 7/9 con fallos del script (no de producto); lint de los 7 repos frontend en verde | pendiente: relanzar dev servers 4300-4304 (npm start) y backend 8100 (docker compose en deploy/), rerun e2e-filtros.mjs y cerrar la iteracion |
| 22 | 2026-11-08 | Nombres de usuario resueltos en la UI (portafolio/detalle/CSV) via UsuarioStore, ID tecnico como tooltip, ph-pill con input title opcional; verificado con tests, lint, builds y navegador integrado (login -> portafolio -> detalle p1) | hecho: ui-lib 40/40, mfe-projects 29/29, build+lint exit 0; commits mfe-projects 11020cb + e989b70, ui-lib 583281e; docs 2.2/2.4 | Agente |
| 23 | 2026-11-08 | Regresion E2E de flujos de escritura (files/e2e-flujos.mjs) tras el cambio de UI de la iteracion 22: proyecto + etapa + F5 + entregable + autoaprobacion rechazada + aprobacion Sponsor + gate + proteccion sin sesion + consola limpia | hecho: 14/14 OK, 0 recursos >= 400; sin cambios de codigo; commit raiz docs | Agente |
