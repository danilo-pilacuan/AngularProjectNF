---
id: project-handoff
tipo: Guide
type: Guide
title: Handoff - contexto de continuidad entre sesiones
description: Documento de soporte para pasar contexto completo a una sesion nueva; el agente lo actualiza al cierre de cada tarea.
estado: vigente
dueno: rol:agente
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-09T01:15:00Z
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

## Estado actual (2026-11-09, iteracion 61: invariantes de dominio en el re-sync)

> Fecha: 2026-11-09. Rama: n/a en la raiz (orquestador); cada repo del multirepo tiene la suya
> (RC4/dev). Estado: fases 0-8 + 13 + 14 + 14.5 + rutas planas + migracion Angular Material
> (12.5) implementadas. Seguridad: VULN-001/002/003/004/005 mitigadas (ver .ops/security/vulns.md);
> iteracion 53 cerro la parte pendiente de VULN-001: PUT /api/sincronizacion ya no reemplaza la
> bitacora, la fusiona por id (append-only con conservacion: omision = no-op, modificacion 422,
> append ajeno 422); cliente filtra bitacora ajena no confirmada. it55 elimino el selector mock "Usuario activo" (sesion real unicamente); it56 barrido integral verde + RUNBOOK de deploy; it57 corrigio el NG0203 del bootstrap prod (shared-lib 522c78e) y anadio no-cache a remoteEntry.json del shell (deploy ea0867d); it58 aplico el mismo patron a AutenticacionService.resincronizarStores (shared-lib 77bb148): tras un login exitoso ahora si se descarga el estado autoritativo. it60 borro los ultimos
> residuos del era mock: UserSwitcher renombrado a SesionUsuario (shell 7cc4133) y los 50
> literales http://localhost:8100 de los specs unificados en API_BASE_URL_POR_DEFECTO +
> urlApiPorDefecto() (shared-lib 18fd4d8). pytest 140/140+4sk, vitest
> shared-lib 177/177, ruff limpio. Commits: backend 1f8b297, shared-lib 18fd4d8, shell 7cc4133, root 96bd359.
> it61 cerro VULN-005 (backend 8a9de54): escribir_estado_completo ya valida invariantes de dominio
> (avance 0-100, presupuesto finito >= 0, fechas ordenadas, no autoaprobacion) igual que el canal
> normal; pytest 144/144+4sk. Regla nueva: NO correr sondas standalone que importen app.main
> (riesgo de tocar el Postgres demo via load_dotenv); usar pytest para caracterizacion.
> API y db Postgres dockerizadas en el compose demo (deploy 1deb0b8): 8100 con login JWT y
> persistencia real, demo reconstruida con Material y E2E 12/12 con 0 recursos 404 en 4400-4404.
> Pendiente: revision humana de estados
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
   - Iteracion 60 (fin del era mock) -> HECHA (2026-11-09): constante unica
     para la URL base de la API (API_BASE_URL_POR_DEFECTO + urlApiPorDefecto
     en shared-lib 18fd4d8; 50 literales http://localhost:8100 eliminados de
     5 specs) y renombrado UserSwitcher -> SesionUsuario (shell 7cc4133;
     app.ts/app.html/app.spec.ts actualizados; el select mock ya no existia
     desde it55, quedaba el nombre heredado que viaja al bundle prod).
     Verificado: vitest 314/314 en 7 repos, lint raiz 0, build raiz exit 0,
     bundle prod sin 'user-switcher'/'Usuario activo', demo reconstruida
     (manifest 440x, remoteEntry 200 en los 5, chunk servido con
     app-sesion-usuario y sin strings mock), login real de diana 200/200/200.
     Nota: el browser CDP no estaba disponible en esa sesion; verificacion
     por HTTP + bundles servidos. Punteros root 96bd359; 10 repos clean.
   - Iteracion 59 (regresion integral tras it58) -> HECHA (2026-11-09):
     barrido verde: vitest shared-lib 177, shell 29, mfe-projects 29,
     mfe-admin 13, mfe-governance 20, mfe-reports 6, ui-lib 40; pytest
     140+4sk; ruff 0; eslint 7 repos; build raiz 7 repos. Hallazgo menor:
     el spec de login del shell sufria el mismo efecto de it58; corregido
     con el mismo helper (shell f4f992d, solo test).
   - Iteracion 58 (NG0203 en resincronizarStores tras el login) -> HECHA
     (2026-11-09): iniciarSesion() llamaba a sincronizarStores() tras
     await(s) HTTP y la descarga del estado autoritativo fallaba en
     silencio (app quedaba en semilla local hasta F5). Fix shared-lib
     77bb148: Injector capturado en el constructor +
     runInInjectionContext en resincronizarStores (patron it57). Spec
     actualizado: los tests de login exitoso responden las 5 lecturas
     de sincronizacion (antes el test pasaba porque la sync moria en
     silencio: validaba el bug). Verificado: vitest 177/177, build
     shared-lib + shell, rebuild shell demo, e2e banner 9/9 + repush 8/8
     + bitacora-append 10/10, BD demo sin residuos E2E.
   - Iteracion 56 (regresion integral + runbook) -> HECHA (2026-11-09): barrido sin cambios de codigo - vitest shared-lib 177, shell 29, mfe-projects 29, mfe-admin 13, mfe-governance 20, ui-lib 40, mfe-reports 6; pytest 140 passed + 4 skipped; ruff y eslint OK (7 repos); build raiz OK (7 repos). Runbook de deploy nuevo (deploy/projecthub/RUNBOOK.md, commit deploy 721b6a3): env vars (AUTH_SECRET, ALLOWED_ORIGINS, RATE_LIMIT_*), limitador en memoria y multi-instancia (Redis/edge), hardening, verificacion post-despliegue, operacion y limitaciones.
   - Iteracion 55 (sesion real sin selector mock) -> HECHA (2026-11-09): el select de usuario activo del navbar (herencia mock) se elimino junto con todo lo hardcodeado: SesionStore solo acepta usuario fijado por AutenticacionService (fijarUsuario con JWT); sin seleccionar()/usuariosActivos en sesion; catalogo de usuarios del ProjectStore viene del backend; X-Actor-Id fuera del cliente (queda como herramienta de pruebas del backend); guards redirigen a /login sin sesion (sin fallback al dashboard); banner sin lenguaje de modo demo. Totales vitest: shared-lib 177, shell 29, mfe-projects 29, mfe-admin 13, mfe-governance 20. Builds y lint OK en los 7/6 repos. Commits: shared-lib 285a178, shell 130d7ec,
   mfe-projects 1fca9c3, mfe-admin 228dfaf, mfe-governance cee3d22, root cfc5343 (punteros) + d5d7394 (script e2e). La demo docker aun no incluye la iteracion 55 (rebuild pendiente).
   - Iteracion 57 (NG0203 prod + cache + e2e banner) -> HECHA (2026-11-09):
     el smoke de la demo destapo el NG0203 del bootstrap prod (regresion
     de it55: sincronizarStores llamado tras await restauroSesion en el
     initializer). Fix en shared-lib 522c78e (runInInjectionContext tras
     capturar el Injector antes del await); verificado en local y demo
     (rebuild shell, dashboard renderiza, 0 errores NG0*). Ademas:
     no-cache en remoteEntry.json del shell (deploy ea0867d, era
     max-age=3600), e2e-banner-api 9/9 alineado al texto it55, e2e-repush
     8/8, e2e-bitacora-append 10/10, BD demo sin residuos E2E.
   - Iteracion 53 (VULN-001 bitacora) -> HECHA (2026-11-08): backend
     `_fusionar_bitacora` (merge conservador: omision = no-op, modificacion
     422, append ajeno 422; `bitacora_reemplazar()` administrativo) y
     cliente con filtro de bitacora ajena no confirmada (`confirmadas`).
     pytest 136/136, vitest 177/177, ruff limpio. Commits backend 1f8b297,
     shared-lib b7c489f, root b6f7a3f. La demo docker aun no incluye este
     fix (rebuild en iteracion 55).
   - Iteracion 54 (siguiente): smoke de produccion del stack docker demo
     con la API 8100: salud, login diana, remoteEntry 200 en 4400-4404,
     navegacion, F5 profundo, consola limpia, e2e-repush-api.mjs y
     e2e-banner-api.mjs verdes.
   - Iteracion 55: rebuild de imagenes demo con la iteracion 53, runbook
     de deploy (ALLOWED_ORIGINS, AUTH_SECRET, RATE_LIMIT_*, nota Redis
     multi-instancia) y barrido integral de regresion (ng test 7 repos,
     build, lint, pytest).
   - Iteracion 50 (hardening del deploy demo) -> HECHA (2026-11-08):
     nginx no root (nginx.conf propio: listen 8080, pid/temp en /tmp, logs a
     std streams; master y workers uid 101), api como appuser (10001),
     read_only + tmpfs + no-new-privileges en compose (440x -> 8080),
     cabeceras de seguridad y cache no-cache en remoteEntry.json/index.html.
     Demo reconstruida y verificada e2e: 200 en 440x + api/salud, uids y
     secopts por inspect, headers y cache por curl, login en navegador y F5
     en /governance. La demo quedo con la shared-lib de 47-48. Commits
     deploy + root 827f120. Hallazgo nuevo (iteracion 51): un Admin puede
     desactivar a todos los Admin y bloquear el sistema (sin guard de
     ultimo Admin); reproducido en la demo y restaurado por DB.
   - Iteracion 48 (cuenta desactivada) -> HECHA (2026-11-08): backend 403
     USUARIO_INACTIVO cuando el token es valido pero el usuario fue
     desactivado por un Admin (obtener_actor); ApiEnlaceService detecta
     (onCuentaDesactivada, sin limpiar el token), AutenticacionService
     cierra sesion y expone desactivaciones(); shell redirige a
     /login?desactivada=1 con aviso propio. Backend 133/133, shared-lib
     176/176, shell 30/30. Commits backend f8874e6, shared-lib b95f5d4,
     shell fdd6e3f. Pendiente de rebuild demo; no bloquea dev.
   - Iteracion 47 (sesion expirada) -> HECHA (2026-11-08): contrato 401
     SESION_INVALIDA en backend (obtener_actor, token invalido o usuario
     eliminado), deteccion en ApiEnlaceService (limpia token +
     onSesionExpirada), AutenticacionService.expiraciones(), redireccion
     shell a /login?expirada=1 con aviso en pantalla. Backend 132/132,
     shared-lib 174/174, shell 28/28, lint raiz verde. Commits backend
     5e46a39, shared-lib 5932430, shell d2e608e, docs raiz 5febf62.
     Pendiente de rebuild demo (los contenedores 4400-4404 siguen con la
     shared-lib anterior); no bloquea dev.
   - Iteracion 46 (regresion integral) -> HECHA (2026-11-08): tests de los
     6 repos frontend en verde, builds exit 0, lint raiz exit 0. Sin
     cambios de codigo.
   - Iteraciones 44-45 -> HECHAS (2026-11-08): CI del backend
     (.github/workflows/backend-ci.yml: pytest + ruff) y manejo del 429 en
     la UI (LIMITE_INTENTOS con mensaje propio, test nuevo; verificado E2E
     en la demo reconstruida). shared-lib 172/172.
   - Iteracion 43 (demo alineada) -> HECHA (2026-11-08): 5 imagenes demo
     reconstruidas con la shared-lib corregida; E2E de navegador: modo demo
     sin banner falso, login real, ruta profunda con datos, F5 persiste.
   - Iteracion 42 (mitigacion VULN-001, parte segura) -> HECHA (2026-11-08):
     diff de usuarios en el re-sync exige Admin (escalada de roles ->
     409); contrato 13.4 intacto para el resto de colecciones. pytest
     131/131; demo verificada por HTTP. VULN-001 en `mitigado (parcial)`.
     PENDIENTE DEL PROPIETARIO (decision de alcance): inmutabilidad de
     bitacora y gobierno de las demas colecciones en el re-sync total.
   - Iteracion 41 (mitigacion VULN-004) -> HECHA (2026-11-08): CORS via
     `ALLOWED_ORIGINS` (default intacto para dev/demo); pytest 130/130; API
     demo reconstruida y CORS verificado por HTTP. Registro VULN-004 en
     `mitigado`. Despliegue en dominio real: definir ALLOWED_ORIGINS en
     compose/.env.
   - Iteracion 40 (mitigacion VULN-003) -> HECHA (2026-11-08): rate limit en
     memoria en /api/auth/login (correo+IP, 5 fallos/60 s -> 429
     LIMITE_INTENTOS, config por env, sin dependencias nuevas); pytest
     120/120; API demo reconstruida y verificada por HTTP. Registro
     VULN-003 en `mitigado`. Nota: limitador externo (Redis) si hay varias
     instancias, pendiente de despliegue.
   - Iteracion 39 (mitigacion VULN-002) -> HECHA (2026-11-08): los 12 GET de
     dominio exigen `obtener_actor` (solo salud y login publicos); el
     frontend ya no confunde 4xx con caida (banner honesto en modo demo);
     pytest 112/112, vitest 171/171, API demo reconstruida y verificada por
     HTTP (422/200/200, estado 7/6/5/10/5 intacto). Registro VULN-002 en
     `mitigado` (evidencia en la fila).
   - Iteracion 38 (auditoria de seguridad de la API) -> REGISTRADA (2026-11-08):
     4 hallazgos en `.ops/security/vulns.md` (VULN-001 Alta: PUT
     /api/sincronizacion sin validacion de permisos, reproducido por HTTP;
     VULN-002 Media: mitigada en iteracion 39; VULN-003 Media: mitigada en
     iteracion 40; VULN-004 Baja: mitigada en iteracion 41; VULN-001 Alta:
     mitigada en parte en iteracion 42 (diff de usuarios exige Admin;
     decision de alcance pendiente para bitacora y demas colecciones).
   - Iteracion 30 (cierre documental 13.1/13.3/13.4) -> HECHA (2026-11-08):
     los tres items ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ de la seccion 13 pasan a ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ con evidencia acumulada
     (109/109 pytest, auth JWT de fase 14, E2E de hoy con 0 recursos >= 400,
     persistencia F5 re-verificada en iteraciones 23/24). Sin cambios de
     codigo.
   - Iteracion 29 (regresion E2E de exportacion PDF) -> HECHA (2026-11-08):
     rerun de files/e2e-pdf.mjs, 14/14 OK (tablero y presupuesto: dialogo de
     impresion con titulo correcto, secciones y totales, celdas escapadas,
     consola limpia). Sin cambios de codigo.
   - Iteracion 28 (regresion E2E de widgets federados) -> HECHA (2026-11-08):
     rerun de files/e2e-widgets.mjs, 8/8 OK (dashboard 4 widgets, widget
     remote a remote con Intl, selector de proyecto actualiza el resumen, F5
     profundo, consola limpia). Sin cambios de codigo.
   - Iteracion 27 (regresion E2E federado general) -> HECHA (2026-11-08):
     files/e2e-federado.mjs era de la era demo y se adapto a la era de sesion
     real (login por API, header con actor + Cerrar sesion, selector demo
     ausente por diseno, F5 en /governance/bitacora). 10/10 OK, consola
     limpia, 0 recursos 404. Sin cambios de codigo de producto (solo script
     de sesion).
   - Iteracion 26 (regresion E2E del store unico) -> HECHA (2026-11-08):
     rerun de files/e2e-store-unico.mjs, 7/7 OK (sesion compartida en admin,
     lecturas en projects/reports/governance, escritura en projects visible en
     /reports/presupuesto, consola limpia). Sin cambios de codigo.
   - Iteracion 25 (regresion E2E de bitacora federada) -> HECHA (2026-11-08):
     rerun de files/e2e-bitacora.mjs, 11/11 OK (nav, semilla con autores
     resueltos, filtro tipo Cambio, CSV bitacora-YYYY-MM-DD-HHmm.csv, ruta
     profunda sin sesion -> /login?de=..., consola limpia). Sin cambios de
     codigo.
   - Iteracion 24 (regresion E2E de transiciones de etapa) -> HECHA
     (2026-11-08): rerun de files/e2e-transiciones.mjs tras iteracion 22,
     19/19 OK (gate cerrado rechaza, acta + autoaprobacion rechazada +
     aprobacion Sponsor, transicion a Iniciativa con bitacora y gate destino
     recalculado, sin retroceso, persistencia F5, consola limpia). Sin cambios
     de codigo.
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
| 24 | 2026-11-08 | Regresion E2E de transiciones de etapa (files/e2e-transiciones.mjs) tras iteracion 22: gate cerrado rechaza avance, acta cargada + autoaprobacion rechazada + aprobacion Sponsor, transicion a Iniciativa, gate destino recalculado, sin retroceso, F5 persiste, consola limpia | hecho: 19/19 OK, 0 recursos >= 400; sin cambios de codigo; commit raiz docs | Agente |
| 25 | 2026-11-08 | Regresion E2E de bitacora federada (files/e2e-bitacora.mjs): nav de governance, semilla con autores por nombre, filtro tipo Cambio, export CSV con fecha, ruta profunda sin sesion -> /login?de=..., consola limpia | hecho: 11/11 OK, 0 recursos >= 400; sin cambios de codigo; commit raiz docs | Agente |
| 26 | 2026-11-08 | Regresion E2E del store unico (files/e2e-store-unico.mjs): sesion compartida, lecturas cross-MFE, escritura en mfe-projects visible en /reports/presupuesto sin recargar, consola limpia | hecho: 7/7 OK, 0 recursos >= 400; sin cambios de codigo; commit raiz docs | Agente |
| 27 | 2026-11-08 | Regresion E2E federado general (files/e2e-federado.mjs adaptado a la era de sesion real): header con actor autenticado, 4 rutas sin fallback, F5 profundo /governance/bitacora, consola limpia | hecho: 10/10 OK, 0 recursos 404; script de sesion actualizado (era demo -> login real), sin cambios de producto; commit raiz docs | Agente |
| 28 | 2026-11-08 | Regresion E2E de widgets federados (files/e2e-widgets.mjs): dashboard con 4 widgets, widget remote a remote con Intl, selector de proyecto actualiza resumen, F5 profundo, consola limpia | hecho: 8/8 OK, 0 recursos >= 400; sin cambios de codigo; commit raiz docs | Agente |
| 29 | 2026-11-08 | Regresion E2E de exportacion PDF (files/e2e-pdf.mjs): tablero y presupuesto invocan dialogo de impresion con titulo correcto, secciones, totales y celdas escapadas, consola limpia | hecho: 14/14 OK; sin cambios de codigo; commit raiz docs | Agente |
| 30 | 2026-11-08 | Cierre documental de 13.1/13.3/13.4 en docs/funcionalidades.md con evidencia acumulada (pytest 109/109, auth JWT, E2E hoy 0 recursos >= 400, persistencia F5 de iteraciones 23/24) | hecho: seccion 13 completa (13.1-13.4 en ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ); sin cambios de codigo; commit raiz docs | Agente |
| 31 | 2026-11-08 | Barrido integral de calidad tras 19 commits de subrepos: npx ng test en los 7 repos (290 tests), build raiz, lint raiz, pytest backend, remoteEntry/salud 200, navegador integrado en 4300/login | hecho: 7/7 repos verdes (shared 161, ui 40, shell 22, projects 29, admin 13, governance 20, reports 5), build EXIT 0, lint EXIT 0, backend 109/109; hallazgo metodologico documentado (npx vitest run directo no sirve); sin cambios de codigo; commit raiz docs | Agente |
| 32 | 2026-11-08 | Degradacion visible a modo demo: EstadoApi + sondeo /api/salud en ApiEnlaceService, banner de aviso en shell, estado vacio explicito en tablero-general; auditoria DoD de estados en las 9 paginas | hecho: shared-lib 426f196 + shell c0d3c92 + mfe-reports 5f8b6d2; 165+25+6+29 tests verdes, build raiz EXIT 0; navegador: banner aparece con API caida (Playwright) y estado vuelve a disponible al restaurar; demo docker pendiente de rebuild | Agente |
| 33 | 2026-11-08 | Rebuild de la demo docker (5 imagenes) para incluir el banner; leccion: es-module-shims retiene el importmap viejo tras un rebuild y hay que limpiar cache HTTP | hecho: demo 4400-4404 con banner; Playwright: aparece en ~5 s con API caida y se retira al restaurar; nota en deploy/projecthub/README.md (ace10a3); commits raiz 8adfc65 | Agente |
| 34 | 2026-11-08 | E2E automatizado del banner (tools/e2e/e2e-banner-api.mjs): docker stop/start de la API y ciclo completo verificado sin intervencion manual | hecho: 8/8 comprobaciones OK contra demo 4400; commit raiz 19e7ad4 | Agente |
| 35 | 2026-11-08 | Re-empuje automatico de escrituras hechas durante una caida de API: conectarRecuperacion() en SincronizadorEscrituras re-programa el push al volver la API si hubo fallos pendientes | hecho: 168/168 tests shared-lib (3 nuevos), build + eslint limpios, commit shared-lib 33b46eb | Agente |
| 35b | 2026-11-08 | E2E del re-push (tools/e2e/e2e-repush-api.mjs): causa raiz de la fase offline que fallaba en silencio era el step=1000 del input de presupuesto (stepMismatch bloquea el submit sin error visible); el script usa montos multiplos de 1000 y verifica navegacion a detalle | hecho: 8/8 comprobaciones OK contra demo 4400; re-push +1 PUT a los 1521 ms sin interaccion | Agente |
| 36 | 2026-11-08 | step=any en los dos inputs de presupuesto (proyecto-form, proyecto-detalle): el step=1000 bloqueaba en silencio submits con montos arbitrarios; validacion de dominio intacta (>= 0 y finito en guardar()/store) | hecho: eslint 0, tests mfe-projects 29/29, rebuild demo y prueba en vivo con navegador integrado: 1234567 crea proyecto, navega a detalle y persiste (GET devuelve 1234567); commits mfe-projects d298339 | Agente |
| 37 | 2026-11-08 | Regresion E2E contra la demo reconstruida con step=any: banner 8/8 y re-push 8/8 (re-push automatico +1 PUT a los 5118 ms); segundo input verificado en vivo: etapa creada con 987654 y persistida, datos de prueba eliminados | hecho | Agente |
| 38 | 2026-11-08 | Auditoria de seguridad de la API (revision de codigo + pruebas HTTP contra 8100): VULN-001 (Alta) re-sync total sin validacion de permisos (escalada de roles y borrado de bitacora reproducidos), VULN-002 (Media) 12 GET de dominio sin sesion, VULN-003 (Media) login sin rate limit, VULN-004 (Baja) CORS fijo. 3 tests de caracterizacion en test_api.py; estado demo restaurado a semilla exacta tras las pruebas | hecho: backend 112/112 pytest, ruff 0; registro en .ops/security/vulns.md (estados abiertos, decision del propietario) | Agente |
| 39 | 2026-11-08 | Mitigacion VULN-002: obtener_actor en los 12 GET de dominio (solo salud y login publicos); ApiEnlaceService no trata 4xx como caida (modo demo conserva semilla y banner honesto); tests: test_vuln002_mitigado + 2 specs de enlace + sync con 422 | hecho: backend 112/112 pytest, ruff 0; shared-lib 171/171 + build dist; API demo reconstruida (sondas 422/200/200, login Bearer OK, estado 7/6/5/10/5 intacto) | Agente |
| 40 | 2026-11-08 | Mitigacion VULN-003: rate_limit.py nuevo (ventana fija correo+IP, 5 fallos/60 s -> 429 LIMITE_INTENTOS, config RATE_LIMIT_LOGIN_INTENTOS/VENTANA_SEG, solo fallos cuentan) conectado al login; 6 tests unitarios + 2 HTTP | hecho: backend 120/120 pytest, ruff 0; API demo reconstruida y verificada por HTTP (401x5 -> 429, otra cuenta OK); nota Redis en vulns.md | Agente |
| 41 | 2026-11-08 | Mitigacion VULN-004: _origenes_permitidos() en main.py lee ALLOWED_ORIGINS (comas, barras finales, entradas vacias) con default de dev/demo intacto; test_cors.py (5 tests) | hecho: backend 130/130 pytest, ruff 0; API demo reconstruida; CORS por HTTP: origen 4400 recibe ACAO, origen ajeno no | Agente |
| 42 | 2026-11-08 | Mitigacion VULN-001 (parte segura): _validar_diff_usuarios en escribir_estado_completo; alterar usuarios via re-sync exige Admin (409), re-sync sin diff aceptado; 3 tests de mitigacion sustituyen la caracterizacion | hecho: backend 131/131 pytest, ruff 0; demo reconstruida y sonda HTTP: escalada 409 con roles intactos, re-sync PM OK, estado 7/6/5/10/5 | Agente |
| 43 | 2026-11-08 | Demo alineada con las mitigaciones: rebuild de las 5 imagenes front (shared-lib con fix de 4xx embebida) + API; E2E navegador: modo demo sin banner falso (422 esperados en consola), login real Diana, /projects con 6 proyectos reales, F5 persiste sesion y datos | hecho: sin cambios de codigo; ciclo de seguridad VULN-001..004 mitigado y verificado en demo | Agente |
| 44 | 2026-11-08 | CI del backend: .github/workflows/backend-ci.yml (pytest + ruff, Python 3.14, cache pip, memoria) con triggers push/PR en backend/ | hecho: commit raiz f332a25 | Agente |
| 45 | 2026-11-08 | Manejo del 429 en la UI: AutenticacionService.mapearError mapea 429 -> LIMITE_INTENTOS con el mensaje del backend; test nuevo en autenticacion.spec.ts; demo reconstruida y E2E: 401x5 -> 429 con mensaje correcto | hecho: shared-lib 172/172 + build dist; estado demo intacto | Agente |
| 48 | 2026-11-08 | Cuenta desactivada en pleno uso: backend 403 USUARIO_INACTIVO en obtener_actor (token valido, usuario desactivado por Admin); ApiEnlaceService.onCuentaDesactivada (sin limpiar token), AutenticacionService.desactivaciones(); shell redirige a /login?desactivada=1 con aviso propio | hecho: backend 133/133 + ruff 0, shared-lib 176/176 + build, shell 30/30 + build + lint; commits backend f8874e6, shared-lib b95f5d4, shell fdd6e3f | Agente |
| 50 | 2026-11-08 | Hardening del deploy demo: nginx no root (nginx.conf propio, listen 8080, pid/temp en /tmp, logs a std streams), api como appuser 10001, read_only + tmpfs + no-new-privileges, cabeceras de seguridad, cache no-cache en remoteEntry.json/index.html; demo reconstruida y verificada e2e (login navegador, F5, headers, uids) | hecho: demo arriba 200 en 440x + api/salud, docker inspect ro/no-new-privileges, curl headers; commits deploy + root 827f120 | Agente |
| 46 | 2026-11-08 | Barrido integral de regresion tras el ciclo de seguridad: ng test en los 6 repos frontend (todos los archivos en verde), npm run build exit 0 en los 6, lint raiz exit 0; backend 131/131 | hecho: sin cambios de codigo; iteracion de verificacion | Agente |
| 47 | 2026-11-08 | Sesion expirada con token vigente: backend 401 SESION_INVALIDA (obtener_actor, token invalido o usuario eliminado); ApiEnlaceService limpia token + onSesionExpirada; AutenticacionService.expiraciones(); shell redirige a /login?expirada=1 con aviso | hecho: backend 132/132 + ruff 0, shared-lib 174/174 + build, shell 28/28 + build, lint raiz 0; commits backend 5e46a39, shared-lib 5932430, shell d2e608e, raiz 5febf62; demo Docker pendiente de rebuild | Agente |
| 57 | 2026-11-09 | Smoke de la demo: NG0203 en bootstrap prod (regresion it55); fix runInInjectionContext en el initializer (shared-lib 522c78e); no-cache en remoteEntry.json del shell (deploy ea0867d); e2e-banner 9/9 alineado a it55, repush 8/8, bitacora 10/10, BD sin residuos | hecho: vitest 177/177, demo reconstruida y verificada; commits shared-lib 522c78e, deploy ea0867d, raiz 20b1e60 + docs 35d616a | Agente |
| 58 | 2026-11-09 | Mismo patron NG0203 en AutenticacionService.resincronizarStores (tras el login la descarga del estado autoritativo moria en silencio); fix Injector capturado + runInInjectionContext (shared-lib 77bb148); spec de login actualizado (los tests de login exitoso responden las 5 lecturas de sync: antes validaban el bug) | hecho: vitest 177/177, build shared-lib + shell, rebuild shell demo, e2e 9/9 + 8/8 + 10/10, BD sin residuos | Agente |
| 59 | 2026-11-09 | Barrido integral de regresion tras it58 (sin codigo de produccion): vitest 7 repos (177/29/29/13/20/6/40), pytest 140+4sk, ruff 0, eslint 7 repos, build raiz 7 repos; spec de login del shell corregido con el helper de sync (shell f4f992d) | hecho: commits shell f4f992d + raiz punteros; 10 repos clean | Agente |
| 60 | 2026-11-09 | Fin del era mock: UserSwitcher -> SesionUsuario (shell 7cc4133) y constante unica API_BASE_URL_POR_DEFECTO + urlApiPorDefecto() con 50 literales 8100 eliminados de 5 specs (shared-lib 18fd4d8); verificado con vitest 314/314 (7 repos), lint raiz, build raiz, bundle prod sin strings mock y demo HTTP (manifest, remoteEntry x5, chunk limpio, login diana 200/200/200) | hecho: commits shared-lib 18fd4d8, shell 7cc4133, root punteros 96bd359 + docs; 10 repos clean | Agente |
| 61 | 2026-11-09 | VULN-005: invariantes de dominio en escribir_estado_completo (avance 0-100, presupuesto finito >= 0, fechas ordenadas, no autoaprobacion); huecos NaN en crear_proyecto y registrar_consumo; 4 tests nuevos; BD demo verificada intacta tras incidente de sondas standalone | hecho: commit backend 8a9de54, fila VULN-005 en vulns.md, PROGRESS + handoff; pytest 144/144+4sk, ruff 0 | Agente |
