# PROGRESS.md - ProjectHub

Log de avance dia a dia. Fuente de verdad del avance; `.ops` lo organiza y enlaza.

## 2026-11-05

- Sesion: arranque del proyecto. Bootstrap de `.ops/` (OKF 0.2) con arboles product, project,
  governance, qa, implementations y templates; plan de 9 fases derivado de
  `docs/funcionalidades.md`; backlog inicial BL-001..BL-013; REQ-001..REQ-011 propuestos.
- Entorno verificado: node v24.21.0, npm 11.19.0, Docker 29.8.2, Docker Compose v5.6.0.
- Restriccion de puertos: el rango 4200-4204 esta ocupado en el host. Decision de entorno:
  desarrollo local en 4300-4304 (shell 4300, mfe-projects 4301, mfe-reports 4302, mfe-admin
  4303, mfe-governance 4304); Docker publica en 4400-4404. Los puertos del rulebook (4200-4204)
  quedan como contrato logico; el mapeo fisico vive en configuracion (env/compose), nunca en
  literales de codigo.
- Siguiente paso: fase 0 - workspace Angular 22 + Native Federation + modelos.
- Pivote de arquitectura (instruccion del propietario): multirepo, no monorepo. Un repositorio
  Git por desarrollo: `shell`, `mfe-projects`, `mfe-reports`, `mfe-admin`, `mfe-governance`,
  `shared-lib`, `ui-lib`, `deploy` (docker/compose) y `backend` (placeholder documentado).
  Registrado como DEC-003 (abierta, resolucion del propietario) y aplicado a las
  especificaciones: docs/funcionalidades.md 8.1, plan.md, backlog, fase-0, IMPL-001, IMPL-002.
  AGENTS.md seccion 1 (Estructura) queda contradicha; su correccion la pide el propietario.
- Limpieza: eliminado `projecthub-ref/` (scaffold de referencia). El `package.json` de raiz
  queda como orquestador de scripts (sin codigo de app); `node_modules` de raiz se elimina
  cuando los repos tengan sus propias dependencias.
- Siguiente paso: fase 0 - scaffold de repos multirepo (shell host + 4 remotes + 2 libs +
  deploy) con puertos 4300-4304 en dev y 4400-4404 en Docker.
- Fase 0 ejecutada (IMPL-001): 7 repos con git propio (shell, mfe-projects, mfe-reports,
  mfe-admin, mfe-governance, shared-lib, ui-lib) + raiz orquestadora (tools/run-all.mjs,
  start-dev.mjs, bootstrap-repos.mjs). Libs consumidas por `file:../<lib>/dist/...`.
  Builds prod exit 0 en los 7. Smoke dev 4300-4304: remoteEntry 200 en los 5, navegacion,
  F5 en ruta profunda. Fix ngDevMode (define en main.ts antes de initFederation).
  Leccion: el dev server NF contamina dist con artefactos -dev; para Docker, build fresco.
- Deploy Docker (IMPL-001, item 8.3): `deploy/projecthub/` con shell.Dockerfile,
  remote.Dockerfile (parametrizado por ARG_REPO), nginx con SPA fallback y CORS (el runtime
  del shell hace fetch cross-origin de remoteEntry.json; nginx reemplaza add_header
  heredado cuando el location define el suyo), compose 4400-4404 y manifest Docker con
  URLs 440x. 5 imagenes construidas; stack verificado: remoteEntry 200 en 4400-4404,
  navegacion a las 4 rutas, F5 en /governance, consola limpia. `.dockerignore` en raiz
  (node_modules/dist/.git fuera del contexto).
- Backend placeholder (item 10.3 fuera de alcance): `backend/README.md` documenta el
  contrato previsto (FastAPI); sin codigo ejecutable.
- IMPL-002 (dominio en shared-lib): catalogos, errores (6 subclases con mensajes en
  espanol), grafo de ciclo de vida con retrocesos acotados, matriz de permisos 9x10,
  modelos (Proyecto, EtapaTrabajo, Usuario, Entregable, BitacoraEntrada, PermisoMatriz),
  calculos (avance ponderado por duracion, presupuesto/consumo, desviacion, validaciones).
  Scaffold Angular del generador eliminado; public-api.ts exporta solo dominio puro.
  Tests: 31 en verde (vitest). Build de la lib exit 0.
- Singleton check: ninguna app importa todavia `@projecthub/shared` (solo declarada en
  package.json por `file:`). Angular/rxjs/tslib ya viajan como singletons con strictVersion
  en los remoteEntry. Al importar la lib, agregarla al shared config de cada federation
  config.
- Siguiente paso: commits por repo; luego fase 1 (stores + sesion) segun plan.

## Fases 1-7 (registro consolidado de sesiones previas)

- Fase 1 (dominio): ciclo de vida completo de 9 etapas con transiciones y retrocesos
  acotados, gates de etapa (checklist de entregables + aprobaciones), matriz de permisos
  9x10, errores de dominio con mensajes en espanol. Todo en `@projecthub/shared`.
- Fase 2 (stores y sesion): ProjectStore y stores acompanantes como instancia unica
  resuelta por InjectionToken; sesion simulada con usuario activo; datos semilla.
- Fase 3 (ui-lib): componentes base de presentacion (SummaryWidget y acompanantes) con
  tema SCSS compartido; Gantt propio en SVG/CSS (sin librerias externas, decision del
  proyecto).
- Fase 4 (mfe-projects): portafolio, detalle de proyecto, etapas de trabajo, presupuesto
  y ProjectSummaryWidget federado. Fix NG0203 en tests de widgets con signals:
  vitest-base.config.mts + `"runnerConfig": true` en el target test de angular.json.
- Fase 5 (mfe-admin): usuarios, roles y matriz de responsabilidades.
- Fase 6 (mfe-reports): reportes y PortfolioKpiWidget (remote a remote, consume
  ProjectStore compartido).
- Fase 7 (shell): Dashboard con 3 widgets federados (mfe-projects, mfe-reports,
  mfe-governance) via loadRemoteModule + NgComponentOutlet con fallback por celda;
  UserSwitcher (selector de usuario activo, solo usuarios activos, badges de rol);
  RemoteFallback para degradacion elegante de remotes caidos; rutas con helper
  remoteConFallback(). GateStatusWidget creado en mfe-governance y expuesto como
  './Widget'. Commits: 86a4567 (mfe-governance), b5bfb26 (mfe-reports), 7ae2a6a (shell),
  ac51a34 (docs raiz).
- Integracion (fase 8, parcial): tests verdes en los 7 repos: shared-lib 98, ui-lib 18,
  mfe-projects 26, mfe-admin 13, mfe-reports 5, mfe-governance 3, shell 6 = 169 tests.
  Builds prod exit 0 en los 7.
- Fix real en tools/start-dev.mjs: usaba readFileSync sin importarlo (ReferenceError al
  filtrar repos con package.json). Corregido; pendiente de commit.
- Leccion ngDevMode (reincidencia): dev servers vivos desde antes de un build prod sirven
  el import map viejo con chunks de prod -> ReferenceError: ngDevMode is not defined.
  Tras alternar builds prod/dev, reiniciar los 5 dev servers o limpiar
  node_modules/.cache/native-federation.

## 2026-11-05 (sesion actual)

- Hallazgo de puertos (feedback del propietario): la evidencia mezclaba stacks sin
  etiquetar. Contrato vigente (DEC-001): dev = 4300-4304 (npm), docker = 4400-4404
  (compose). Verificado con docker ps: los contenedores projecthub-* llevaban 4 horas
  arriba con imagenes construidas ANTES de las fases 5-7 -> el navegador en 4400 mostraba
  contenido viejo. Causa documentada, no bug de la app.
- Politica de proteccion de comandos (pedido del propietario): creada
  `.ops/development/command-safety.md` (arbol development nuevo). Prohibido descartar
  salida que se espera observar (2>&1 | Out-Null); builds largos con Tee-Object a
  .dev-logs/; exit code no sustituye a la salida; evidencia etiquetada por stack;
  verificar antiguedad/hash del artefacto antes de juzgar un stack.
- Rebuild Docker re-ejecutado con salida visible: `docker compose build 2>&1 |
  Tee-Object -FilePath .dev-logs/docker-build.log` (log en .dev-logs/docker-build.log).
  Estado previo verificado: contenedores e imagenes con 4h de antiguedad (el rebuild
  interrumpido no habia dejado nada).
- Fix de .dockerignore: los patrones sin `**/` no excluyen node_modules anidados de cada
  repo del multirepo -> contexto de build de ~1.7GB y 200s+ solo transfiriendo. Con
  `**/node_modules` etc., el build completo de 5 imagenes baja a ~4 minutos.
- Bug real corregido en shell (commit 342593b): `remoteConFallback()` devolvia `Routes`
  (arreglo) y el punto de uso lo expandia con spread dentro del objeto de ruta
  `{ path: 'projects', ...[...] }` -> propiedades indice en vez de fusion: NG04014
  "Invalid configuration of route 'projects'" y main vacio en rutas de remotes. Los 6
  tests del shell pasaban porque probaban el arreglo interno, no el punto de uso. Fix:
  devolver `Route` (objeto). Leccion: el spread de arreglos dentro de objetos no fusiona.
- Verificacion de punta a punta tras el fix:
  - dev (4300-4304): remoteEntry 200 en los 5; /governance con F5 directo renderiza el
    remote; tests shell 6/6; build prod exit 0.
  - docker (4400-4404): imagenes reconstruidas (antiguedad < 1 min al verificar);
    remoteEntry 200 en los 5; navegacion a /, /projects, /reports, /admin, /governance;
    F5 en /governance; dashboard con los 3 widgets federados con datos; UserSwitcher
    cambia sesion y mfe-admin reacciona via store compartido (Nuevo usuario/Acciones
    aparecen con Diana Admin; Ivan Inactivo sin boton Desactivar); consola sin warnings
    de singletons duplicados ni errores.
- ngDevMode reincidio al ejecutar el build prod del shell con dev servers vivos: aplicada
  la leccion documentada (reiniciar los 5 dev servers tras alternar builds prod/dev).

## 2026-11-06 (sesion RC2->RC3, continuacion)

- Migracion Angular Material (DEC-005) completada: skip list de Native Federation corregido
  (los wildcards NO funcionan; predicados funcion `(pkg) => pkg.startsWith('@angular-devkit')`,
  `'@schematics/'`, `'source-map-support'`, `'oxc-parser'` y exacto `'@angular/cdk/schematics'`
  - el secondary toxico re-exporta @schematics/angular con builtins node). Builds prod de los
  5 apps verdes. Tests de los 4 remotes arreglados: NG0203 MAT_CARD_CONFIG por doble
  instancia de @angular/material en el grafo de test (via @projecthub/ui file: junction);
  fix con `dedupe: ['@angular/material', '@angular/cdk', ...]` en `vitest-base.config.mts`
  de los 4 remotes. Suites finales: shell 15/15, shared-lib 125/125, ui-lib 21/21,
  mfe-projects 26/26, mfe-reports 5/5, mfe-admin 13/13, mfe-governance 3/3.
- Backend FastAPI: 68 tests verdes verificados (pytest --tb=no en .venv).
- DEC-006 registrada (orden del propietario): persistencia del backend con PostgreSQL 17 en
  contenedor Docker (compose en backend/, puerto host 5433, volumen nombrado, healthcheck,
  DATABASE_URL, fallback en memoria). docs/funcionalidades.md: seccion 13 Backend nueva
  (13.1 API 68 tests verdes; 13.2 PostgreSQL/Docker planificado; 13.3 HttpClient en stores);
  10.3 en curso; orden de implementacion con fase 10 backend.

## 2026-11-06 (fase 13: persistencia y http-stores)

- 13.2 Persistencia PostgreSQL completada: app/almacen.py (RepositorioPostgres con psycopg3,
  JSONB camelCase, upsert ON CONFLICT, re-sync total; RepositorioMemoria como default),
  inyeccion en ServicioProyectos sin cambiar sus 42 metodos, _crear_repositorio() en main.py
  con DATABASE_URL y fallback a memoria, docker-compose.yml (postgres:17-alpine, host 5433),
  requirements + psycopg[binary]. Tests 76/76 con roundtrip real (BD efimera projecthub_test);
  smoke HTTP contra Postgres OK (GET/POST persisten).
- RC3 cerrada: rama RC3/dev + tag rc3 en los 9 repos (8 submodulos + meta).
- 13.3 http-stores completado: ApiEnlaceService (timeout 2500ms, X-Actor-Id, API_BASE_URL,
  disponibilidad con listeners), sincronizarStores() (5 colecciones -> stores, fallback a
  semilla), cargarDesdeBackend en ProjectStore/UsuarioStore, provideAppInitializer en shell y
  4 remotes con provideHttpClient. Fix NG0203: sincronizarStores debe correr en contexto de
  inyeccion (TestBed.runInInjectionContext en tests). shared-lib 130/130, builds de los 5 apps
  verdes. Pendiente: escrituras via API (hoy solo lectura inicial).

## 2026-11-06 (fase 13.4: escrituras del frontend persistidas)

- Backend: GET/PUT /api/sincronizacion. El PUT reemplaza el estado completo
  (5 colecciones) validando forma (listas, ids unicos) y modelos Pydantic;
  persiste por el repositorio (memoria o Postgres). 6 tests nuevos: 82/82.
- shared-lib: SincronizadorEscrituras con effect() sobre las senales de los
  stores, debounce 400ms (runOutsideAngular), single-flight y reprogramacion
  si hubo cambios durante el envio. 2 tests: 132/132.
- Cableado en shell y 4 remotes (factory que llama observar()); builds 5/5.
- Verificado E2E parcial: uvicorn 8111 -> GET /api/sincronizacion con las 5
  colecciones de semilla; PUT vacio reemplaza el estado (comportamiento
  esperado del re-sync total, cubierto por test roundtrip camelCase).
- Pendiente en la fase: refresco de stores desde respuesta del servidor y
  verificacion E2E con navegador contra dist.

## 2026-11-06 (fase 13.4, cierre: refresco de stores + exposes + E2E navegador)

- shared-lib: `aplicarRespuesta()` aplica el estado del backend a UsuarioStore y
  ProjectStore tras cada push exitoso. Supresion de eco por identidad de
  referencias (`esEcoDelServidor` + campo `aplicada`): un flag booleano no
  funciona porque los effects no corren sincronos con la escritura de la senal.
- Nuevo provider `proporcionarSincronizacionBackend()`: ENVIRONMENT_INITIALIZER
  (observar()) + provideAppInitializer (sincronizarStores + preparar()),
  capturando la referencia del servicio antes del await. Corrige el NG0203
  "SincronizadorEscrituras injection failed" del arranque en el navegador.
  shared-lib: 137/137 tests, build ok.
- Fix critico: los 4 remotes y el shell servian `remoteEntry.json` con
  `exposes: []`. Los `exposes` de `federation.config.mjs` se habian perdido
  ('./Module' en los 4; './Widget' en mfe-projects, mfe-reports y
  mfe-governance). Restaurados; el dashboard volvio a componer los 3 widgets.
- Verificacion E2E con navegador (dev 4300-4304, backend 8100/Postgres):
  dashboard con los 3 widgets, sesion Diana Admin (rol Admin visible),
  navegacion a /projects con los 6 proyectos de semilla, creacion de
  "Proyecto E2E sincronizacion" via UI -> PUT persistido en el backend
  (GET /api/sincronizacion lo devuelve, presupuesto 120000000),
  recarga F5: el proyecto sigue y el dashboard muestra 6 de 7 activos
  (recuperacion desde el servidor funciona). 404 residuales en consola son
  recursos del dev server, no de la app.
- Tests/apps: shell 15/15, mfe-projects 5 archivos, mfe-reports 5, mfe-admin 3,
  mfe-governance 2 (todos verdes); builds de produccion 5/5.
- Commits: shared-lib feat (refresco + provider), 5 apps fix (provider +
  exposes restaurados).
- Leccion nueva: cambiar `federation.config.mjs` (exposes) exige reiniciar los
  dev servers; el remoteEntry.json se genera al arranque, no en watch.

## 2026-11-06 (fase 14: autenticacion real + cierre documental)

- Cierre documental pendiente: commit del backend (load_dotenv + python-dotenv,
  ya estaba en el arbol sin commit). Bug corregido en el camino: load_dotenv()
  restauraba DATABASE_URL desde .env dentro de los tests de API y estos mutaban
  la BD dev de Postgres (409 en transiciones). Fix: tests/conftest.py fija
  DATABASE_URL="" (load_dotenv no sobreescribe variables existentes). 101/101.
- Fase 14 (10.3, autenticacion real) implementada:
  - Backend: app/auth.py (PBKDF2-HMAC-SHA256 stdlib, 240k iteraciones; JWT
    HS256 con PyJWT; credenciales en memoria sembradas de forma perezosa con
    AUTH_CONTRASENA_DEMO), POST /api/auth/login, GET /api/auth/me, Bearer con
    prioridad sobre X-Actor-Id (compatibilidad), CORS + Authorization.
    tests/test_auth.py: 19 tests nuevos (101/101). Smoke HTTP real: login,
    me, 401/403/422.
  - shared-lib: AutenticacionService (login, restaurarSesion via /me en el
    initializer, cerrarSesion), TokenAlmacen (localStorage), Bearer automatico
    en ApiEnlaceService, SesionStore.registrarUsuario, actor de escrituras
    (13.4) = usuario de la sesion. 148/148 tests.
  - shell: pantalla /login, sesionGuard redirige a /login con backend
    disponible (al dashboard en modo demo, degradacion elegante), area de
    sesion con usuario autenticado + Cerrar sesion (selector de usuarios solo
    en demo). 20/20 tests.
  - Builds prod de los 5 apps exit 0; tests de los 4 remotes y ui-lib verdes
    (26/5/13/3/21).
  - E2E con navegador (dev 4300-4304 + backend 8100/Postgres): /projects sin
    sesion redirige a /login?de=%2Fprojects; contrasena incorrecta muestra
    "Correo o contrasena incorrectos."; login Diana Admin reanuda el destino;
    F5 restaura sesion via /api/auth/me; creacion de "Proyecto E2E
    autenticacion" via UI persistida en el backend con Bearer (verificada por
    GET /api/proyectos); Cerrar sesion vuelve a /login y borra el token.
  - Limitacion documentada (14.5, DEC pendiente): credenciales en memoria del
    proceso; sin endpoint de cambio de contrasena. AUTH_SECRET del .env de
    dev (gitignored); en prod debe definirse o los tokens no sobreviven al
    reinicio.
- Commits: backend (load_dotenv, conftest, auth), shared-lib (autenticacion),
  shell (login + guard + user-switcher). Push pendiente al cierre.

## 2026-11-07

- Fase 14.5 (gestion de contrasenas persistida) implementada de punta a punta,
  cerrando la DEC pendiente como DEC-007 (credenciales en tabla propia).
  - Backend: `ServicioCredenciales` respaldado por repositorio (Postgres con
    DATABASE_URL, memoria como fallback); metodos autenticar/registrar/cambiar/
    renombrar/sincronizar_con_usuarios; politica LONGITUD_MINIMA_CONTRASENA=8.
    Endpoint `PUT /api/auth/contrasena` (401 CONTRASENA_ACTUAL_INVALIDA, 422
    VALIDACION). Al editar el correo de un usuario la credencial se renombra;
    al escribir el estado se limpian huerfanos. Tabla `credenciales(correo PK,
    hash)` creada por `crear_esquema()`; `main.py` construye el repositorio y
    lo inyecta tarde en el servicio (`asignar_credenciales`).
  - Frontend: `AutenticacionService.cambiarContrasena(actual, nueva)` en
    shared-lib (maneja las dos formas de error: {codigo,mensaje} raiz y
    {detail:{...}} de HTTPException); pantalla `/perfil` en el shell con
    validacion cliente (longitud, coincidencia) y mensajes de error/exito;
    boton "Cambiar contrasena" en el area de sesion real del UserSwitcher.
    Rebuild de shared-lib dist (las apps la consumen por file:../dist).
  - Verificacion (evidencia por stack, politica de ahorro del propietario:
    corridas puntuales, no suites repetidas):
    - Tests puntuales: backend tests/test_auth.py 23/23 (incluye 4 nuevos de
      cambio de contrasena) y tests/test_api.py 1/1; shared-lib 152/152.
    - E2E dev (curl contra 8100 + Postgres 5433 via docker compose): login
      demo -> cambio 200 -> login nueva 200 -> login vieja 401 -> restaurar.
      Persistencia probada matando y reiniciando uvicorn: la nueva clave
      siguio validando tras el reinicio.
    - E2E Docker (build shell en imagen 2026-11-07, stack 4400-4404): probes
      200 en / y remoteEntry de 4401-4404; con navegador en 4400: cambio por
      UI, logout, re-login con la nueva, error 401 visible con actual
      incorrecta, F5 en /perfil (sesion restaurada), restauracion a demo via
      UI y verificacion final del login demo contra 8100.
  - Nota de arquitectura verificada en Docker: el compose 4400-4404 no tiene
    servicio de API; los frontend usan `API_BASE_URL` por defecto
    (http://localhost:8100, shared-lib/api-enlace.ts). El stack Docker consume
    el backend del host (DEC-002); `/api` en el nginx del shell no existe y
    responde 405 a POST (SPA fallback). Registrar servicio API en el compose
    queda como trabajo pendiente.
  - Docs: DEC-007, plan.md fase 14 implementado, funcionalidades.md 14.5
    marcado, handoff.md actualizado.
- Certificacion (REL-001, .ops/operations/releases.md): corrida consolidada
    unica backend pytest 105/105 y shared-lib ng test 152/152; fix detectado
    por los tests y corregido: cambiarContrasena leia el token del signal
    espejo y no de TokenAlmacen (el guard fallaba si el token se escribio
    fuera del servicio); rebuild de shared-lib dist, imagen shell y smoke
    /perfil en 4400. Lint: sin script en los repos (el build estricto cubre
    tipos); sin suites repetidas por la politica de ahorro del propietario.
- Commits: backend (feat credenciales persistidas), shared-lib (feat cambio),
  shell (feat perfil), raiz (docs de fase 14.5). Push pendiente al cierre.

## 2026-11-07 (migracion Material por componentes, cierre 12.5)

- Complemento de la migracion Angular Material (DEC-005): las paginas que
  quedaban en HTML nativo migraron a componentes Material, repo por repo:
  ui-lib 9b8c11b (PromptDialogService @Injectable), mfe-projects 7c915f6,
  mfe-admin d3d90ba, mfe-reports d9fe54c, mfe-governance 800a575 (layout
  con nav + router-outlet y placeholder con mat-card), shell a057140.
- shell (a057140): user-switcher con mat-select (opcion Sin sesion disabled,
  seleccionar() publico) y mat-button; login y perfil con ph-form-field
  (DEC-005) + input matInput + mat-flat-button; dashboard con mat-select de
  proyecto. Fix de tests: dedupe de @angular/material y @angular/cdk en
  vitest-base.config.mts (NG0203 por doble Angular via @projecthub/ui).
  Header/nav se mantienen con anchors semanticos (sin beneficio Material).
- Verificacion: shell 20/20 tests, build prod OK (150.99 kB). Suites de
  remotes/ui-lib/shared-lib verdes en sus commits. Estado git limpio en los
  9 repos; sin push (politica del propietario).
