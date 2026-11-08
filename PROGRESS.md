# PROGRESS.md - ProjectHub

Log de avance dia a dia. Fuente de verdad del avance; `.ops` lo organiza y enlaza.

## 2026-11-08 (iteracion 22: nombres de usuario resueltos en la UI)

- Defecto de produccion detectado en revision de codigo: portafolio, detalle y CSV mostraban
  IDs crudos de usuario (u-admin, u-sponsor, u-pm) en columna Patrocinador, pill
  "Patrocinador:" y columna Responsable de etapas.
- mfe-projects: portafolio y proyecto-detalle resuelven nombres via UsuarioStore con fallback
  "Sin asignar" para IDs no catalogados; el ID tecnico queda como tooltip (title) en la
  columna del portafolio y en el pill del detalle. CSV del portafolio hereda el nombre.
- ui-lib: `ph-pill` gana input opcional `title` (markup identico si no se pasa).
- Verificacion: ui-lib 40/40 tests (5 de pill nuevos), mfe-projects 29/29, lint limpio en
  ambos, builds de produccion OK. Validacion visual con navegador integrado (Playwright)
  sobre shell 4300: login Diana -> /projects muestra "Sergio Sponsor" en Patrocinador ->
  /projects/detalle/p1 muestra "Patrocinador: Sergio Sponsor" (title=u-sponsor) y
  "Paula Manager" en Responsable. Ademas: deep-link /projects/detalle/p1 sin sesion redirige
  a /login?de=... y vuelve al destino tras entrar (guard verificado de paso).
- Commits: mfe-projects 11020cb (fix) + e989b70 (refactor imports), ui-lib 583281e (feat).
  docs/funcionalidades.md 2.2 y 2.4 actualizados.

## 2026-11-08 (iteracion 21: E2E de filtros de listas)

- Cierre de la iteracion que quedo en curso por reinicio del equipo: dev servers 4300-4304 y
  backend 8100 verificados en pie, rerun de files/e2e-filtros.mjs (sesion anterior) -> 12/12
  comprobaciones OK: login Diana, portafolio 16 filas, filtro etapa=Planteamiento deja solo
  proyectos en Planteamiento, busqueda sin coincidencias muestra estado vacio, restauracion
  de filtros devuelve el listado completo, documentos cambia gate y tabla al cambiar de
  proyecto (16 opciones), bitacora filtra por proyecto (2 selects, filas solo del elegido),
  usuarios 7 filas + formulario Nuevo usuario con 6 mat-checkbox de roles, consola sin
  errores de Angular ni singletons duplicados y 0 recursos >= 400 (NG0956 incluido).
- Sin cambios de codigo: la iteracion valida filtros ya implementados. docs/funcionalidades.md
  2.3 actualizado con la validacion runtime. Scripts E2E viven en files/ de sesion (decision
  de usuario, no commiteados).

## 2026-11-08 (iteracion 19: E2E de flujos de escritura por UI)

- Primera bateria E2E que cubre escritura (no solo lectura): e2e-flujos.mjs, 14 checks,
  Playwright headless sobre shell 4300 + backend 8100. Flujo verificado de extremo a extremo:
  login Diana (Admin) -> crear proyecto "PH-E2E Flujo" por formulario (validaciones activas,
  redireccion a /projects/detalle/:id) -> crear etapa "Fase E2E" (2 inputs date + mat-select
  responsable) -> persistencia de la etapa tras F5 (push a /api/sincronizacion + rehidratacion)
  -> cargar entregable "Acta E2E 19" en /governance (queda pendiente) -> autoaprobacion
  rechazada con mensaje de dominio ("El autor de un entregable no puede aprobar su propio
  documento" en ph-permission-banner danger) -> cerrar sesion -> login sergio (Sponsor) ->
  Aprobar visible por matriz 1.5 -> pill Aprobado + aprobador resuelto -> tarjeta Gate de etapa
  visible -> proteccion /projects/nuevo sin sesion (redirige a /login) -> consola sin errores
  NG0 ni singletons duplicados, 0 recursos >= 400.
- Hallazgos: (a) la ruta de Documentos es /governance (path '' del remote); /governance/
  documentos no existe y el shell hace fallback silencioso al dashboard, leccion para
  diagnosticar: verificar URL antes de asumir bug de producto; (b) quirks de Playwright sobre
  Material: opciones deshabilitadas de mat-select llevan aria-disabled="true" (no
  mat-mdc-option-disabled), patron fiable click-select -> wait -> click-opcion-por-texto ->
  wait; (c) sin bug de producto: los 6 fallos iniciales eran URLs erroneas del script.
- Regresion: e2e-bitacora 11/11 OK durante el diagnostico. Estado: bateria de escritura 14/14.
  Scripts viven en files/ de sesion (no commiteados por decision de usuario).
- Nota de proceso: sin navegador integrado ni Playwright MCP disponibles en la sesion, los
  e2e-*.mjs (playwright-core headless) son la unica via de verificacion de navegador; se usan
  como bateria al cerrar iteracion y sondeos minimos solo para diagnostico.

## 2026-11-08 (iteracion 16: chips restantes sobre ph-pill)

- Unificacion completa del patron pill/chip: los chips de conteo del gate (documentos.html:
  Aprobados/Pendientes de aprobacion/Faltan por cargar) y la metadata de proyecto-detalle
  (mfe-projects: Patrocinador, Objetivo) migran a ph-pill. Para no duplicar criterios de
  tamano se normalizo ph-pill al formato chip (padding 0.15rem 0.6rem, font-size 0.75rem,
  sin uppercase) con el tono neutral como variante metadata; los tonos ok/info/warn/danger/
  primario conservan su semantica. ph-stage-badge sigue intacto (decision 12.3, chip nativo).
- Eliminados los ultimos estilos hand-rolled: .chip de documentos.scss (3 variantes) y .chip
  de proyecto-detalle.scss. Verificacion: ui-lib 37/37 + build + lint; mfe-governance 20/20 +
  build + lint; mfe-projects 26/26 + build + lint, todo exit 0. Commits: ui-lib dad3e6c,
  mfe-governance c4ebebd, mfe-projects fd88177.

## 2026-11-08 (iteracion 15: ph-pill en ui-lib y dedupe de pills en mfe-governance)

- Auditoria Material de las paginas nuevas de mfe-governance (documentos, bitacora): usan
  Material correcto (mat-card, mat-select, mat-form-field, mat-flat-button, ph-data-table,
  ph-permission-banner, ph-stage-badge); el unico elemento hand-rolled eran los spans .pill
  con estilos duplicados identicos en documentos.scss y bitacora.scss (tokens legacy locales).
- Nuevo componente generico ph-pill en ui-lib (Pill, selector ph-pill): input tono
  (ok|info|warn|danger|neutral|primario, default neutral) y contenido requerido; usa los
  tokens canonicos --ph-color-* de _theme.scss con fallbacks. Barrel ui.ts exporta Pill.
  3 tests nuevos (contenido+neutral por defecto, tono ok, clase base en 5 tonos): ui-lib
  37/37 (antes 34), build y lint exit 0; commit 01a1448. Correccion del spec: el segundo
  render no puede llamar configureTestingModule de nuevo (TestBed ya instanciado); los tonos
  restantes se prueban creando otra instancia del componente sobre el mismo modulo.
- Migracion en mfe-governance: gate Abierto/Cerrado y estado de entregable (documentos.html)
  y tipo de registro (bitacora.html) usan ahora ph-pill con tono derivado de la fila;
  imports Pill en documentos.ts y bitacora.ts; eliminados los bloques .pill de ambos SCSS
  (-37 lineas de CSS duplicado). Tests 20/20, build y lint exit 0; commit 93720f2.
- Los chips .chip del resumen del gate se conservan esta iteracion (conteo, no etiqueta):
  candidato a dedupe en la siguiente pasada si se generaliza el patron.

## 2026-11-08 (iteracion 13: validacion del widget remote-a-remote en runtime)

- Cierre del caveat de 11.5: E2E federado 8/8 (session files e2e-widgets.mjs) — mfe-reports
  consume ProjectSummaryWidget de mfe-projects por federacion, cambio de proyecto actualiza
  el widget (avance Intl 0% -> 42,4% y montos $), F5 en /reports/proyecto-widget lo recarga,
  consola limpia y 0 recursos >= 400.
- Incidente y diagnostico: al abrir el ciclo, /reports /projects /admin y /governance pintaban
  todos el fallback del shell ("Modulo no disponible") sin un solo error de consola, pageerror
  ni request >= 400; los chunks de Module respondian 200. Sondas Playwright confirmaron que
  los exposes './Widget' seguian vivos (dashboard OK) y que el remote evaluaba limpio. Causa
  raiz: dev servers con build desactualizado por cache HMR (antecedente del informe E2E
  2026-11-07). La cura fue detener los procesos de 4300 y 4302 y relanzar `npx ng serve`;
  tras el reinicio los 3 remotes renderizan sus modulos reales y el E2E pasa 8/8.
- Nota de operacion (anteproyecto de mejora): el catch silencioso de remoteConFallback()
  (shell app.routes.ts) traga la causa del fallback; cuando el modulo si carga pero el build
  esta desactualizado no queda rastro del motivo. MEJORA EJECUTADA en la iteracion 14:
  remoteConFallback delega en cargaRemote(remote, cargar?) — inyectable para tests — que
  registra en consola (console.warn) el remote y el error real antes de recurrir al fallback;
  spec nuevo app.routes.spec.ts (2 casos: exito -> remoteRoutes; fallo -> fallback '**' con
  data.remote y warn con el error). shell 22/22 tests, build y lint exit 0; commit a003638.
- Lecciones de la sonda: una sonda por ruta extraia /reports desde <main|body> y reportaba
  el widget como texto (OK) pese al fallback; la sonda fiable compara el selector del
  componente real (ph-summary-widget). Mantener ese patron en los E2E.
- Doc: docs/funcionalidades.md 11.5 actualizado con la validacion runtime y la leccion HMR.

## 2026-11-08 (iteracion 12: matriz de responsabilidades sobre mat-table)

- Ultima tabla nativa restante de la auditoria Material (12.3): matriz.html de mfe-admin
  pasa de tabla HTML a `<table mat-table>` con 11 columnas explicitas (etapa + las 10
  acciones de ACCIONES). Las celdas de accion siguen la maquetacion cruzada original:
  cada matColumnDef accede fila.celdas[i] por indice (i = posicion en ACCIONES), conserva
  la clase td.celda con [class.vacia] y el title con titulo(). El spec vigente sigue
  pasando sin cambios (td.celda.vacia se conserva).
- matriz.ts gana readonly columnas = ['etapa', ...ACCIONES] y MatTableModule en imports;
  matriz.scss ajusta selectores a th.mat-mdc-header-cell / td.mat-mdc-cell, conservando
  fondo de etapa, color primario de celda y bordes.
- Verificacion: mfe-admin 13/13 tests (vitest), build exit 0, lint exit 0.
- Commit: mfe-admin c2d7f58 (refactor). Sin push.

## 2026-11-08 (iteracion 11: tabla de presupuesto sobre ph-data-table)

- Auditoria Material transversal (12.3/1.7): los botones de todos los remotes ya usan
  mat-button/mat-flat-button; quedaban 2 tablas nativas (presupuesto en mfe-reports y
  matriz en mfe-admin).
- `ph-data-table` (ui-lib) gana input `pie` opcional: renderiza una mat-footer-row que
  reutiliza las plantillas #cell de las columnas; oculta el pie si no se pasa. 2 tests
  nuevos (34/34 en ui-lib). Commit ui-lib 8148391.
- Presupuesto (mfe-reports) migrado de tabla nativa a ph-data-table con pie de totales;
  se conservan los resaltados negativa/positiva por plantilla. Commit mfe-reports 671dca1.
- Verificacion: ui-lib 34/34 + build + lint exit 0; mfe-reports 5/5 + build + lint exit 0.
- Pendiente iteracion 12: matriz de mfe-admin (tabla cruzada con th por fila; requiere
  evaluar si mat-table aporta o si conserva su maquetacion).

## 2026-11-08 (iteracion 10: fechaHora en IntlFormat)

- `IntlFormat` de ui-lib gana `fechaHora()` (fecha + hora:minuto) y `fechaHoraSegundos()`
  (fecha + hora:minuto:segundo), delegando en un helper privado compartido con `fecha()`.
  Locale es-CO, guion '-' para null/invalid. 3 tests nuevos (32/32 en ui-lib).
  Leccion: es-CO formatea en 12 h ('02:05 p. m.' para 14:05), no 24 h.
- Consumidores: mfe-governance Bitacora (`this.intl.fechaHora(b.fecha)`) y mfe-projects
  proyecto-detalle (`fechaBitacora()` delega en `this.intl.fechaHora(valor)`, comentario
  de parseo ISO conservado).
- Verificacion: mfe-governance 20/20 (asercion de orden actualizada al formato 12 h),
  build y lint exit 0; mfe-projects 26/26, build y lint exit 0.
- Commits: ui-lib 982ca32, mfe-governance 41cb28b, mfe-projects 08dd5a4.

## 2026-11-08 (iteracion 9: dedupe de NavGovernance)

- NavGovernance de mfe-governance (ts/html/scss/spec, 2 tests propios) eliminado en favor
  de `ph-section-nav` de @projecthub/ui, que ya cubre su comportamiento (exact en la raiz
  /governance y prefijo para /governance/bitacora). Las paginas Documentos y Bitacora
  definen navLinks y renderizan el componente compartido.
- Verificacion: mfe-governance 20/20 tests (antes 22, -2 al retirar el spec del
  componente), build y lint exit 0. Commit mfe-governance 1e37c1d.

## 2026-11-08 (iteracion 8: componente generico ph-section-nav)

- Nuevo componente genérico `ph-section-nav` en ui-lib (`lib/section-nav`): nav de
  secciones en pills con RouterLink/RouterLinkActive, inputs `links` (required),
  `ariaLabel` y `exact`; `[routerLinkActiveOptions]` con exact solo para el primer
  enlace (raiz) y prefijo para el resto. Estilos con tokens `--ph-color-*` y fallbacks.
  2 tests nuevos en ui-lib (30/30); leccion: no leer `input.required()` en tiempo de
  construccion del componente (NG0950) y asertar `href` (RouterLink no refleja el
  property binding como atributo).
- Consumidores: mfe-reports (tablero-general, presupuesto) y mfe-admin (usuarios,
  matriz; matriz pierde su boton RouterLink puntual). Specs de tablero-general y
  presupuesto necesitaron `provideRouter([])` nuevo; usuarios y matriz ya lo tenian.
- Correccion durante verificacion: un `PromptDialogService` quedo accidentalmente en el
  array `imports` del componente Usuarios (NG2012, es un servicio); retirado.
- Verificacion: ui-lib 30/30 + build + lint exit 0; mfe-reports 5/5 + build + lint;
  mfe-admin 13/13 + build + lint.
- Commits: ui-lib 2705727 (feat), mfe-reports 2515df3 (feat), mfe-admin c7c1e4b (feat).
- Pendiente para iteraciones siguientes: deduplicar NavGovernance de mfe-governance
  sobre ph-section-nav (patron original que generaliza), y E2E federado del nav.

## 2026-11-08 (iteracion 7: catalogo compartido de tipos de bitacora)

- Deduplicacion del catalogo de tipos de registro de bitacora, que vivia duplicado en
  mfe-governance (constantes locales de la pagina Bitacora) y como ternarios inline en
  proyecto-detalle.ts de mfe-projects (regla de negocio fuera de shared-lib).
- shared-lib `domain/catalogos.ts`: `TIPOS_BITACORA` (const `as const`),
  `TipoBitacora` (type derivado) y `ETIQUETA_TIPO_BITACORA` (Record readonly con
  etiquetas Transicion/Aprobacion/Cambio), junto a los catalogos existentes.
  `BitacoraEntrada.tipo` pasa a estar tipada con `TipoBitacora`.
- Nuevo `catalogos.spec.ts` (4 tests: conteo de tipos, etiqueta por tipo, tipado de
  BitacoraEntrada con entrada real y coherencia de conteos de catalogos existentes).
- Rewire de consumidores: bitacora.ts de mfe-governance ya no define tipos ni etiquetas
  locales; proyecto-detalle.ts de mfe-projects delega en `ETIQUETA_TIPO_BITACORA`.
- Verificacion: shared-lib 157/157 tests (runner oficial `npm test -- --watch=false`;
  nota: `npx vitest run` directo falla en specs de stores por TestBed
  initTestEnvironment, preexistente y ajeno a este cambio), build+lint exit 0;
  mfe-governance 22/22 + build + lint; mfe-projects 26/26 + build + lint.
- Commits: shared-lib aac61cc (feat), mfe-governance 0404ae5 (refactor), mfe-projects
  245d5e8 (refactor). Durante el rewiring el build de mfe-governance fallo una vez por
  una referencia residual a la constante eliminada (TS2552), corregida reutilizando la
  propiedad ya expuesta en el componente.

## 2026-11-08 (lint backend con ruff)

- Lint formal del backend (fase 0-8, deuda 11.4 extendida): `pyproject.toml` nuevo con
  ruff 0.17.4 (line-length 120, reglas E/F/I/B/UP, isort first-party `app`, formato con
  comillas dobles). B008 se permite para `fastapi.Depends/Query/Header` via
  extend-immutable-calls: Depends() en defaults de parametros es el patron idiomatico de
  FastAPI.
- Primer check: 121 errores (50 B008, 35 E501, 10 F401, 9 E402, 5 UP031, 5 I001, 3 UP017,
  y otros). Correcciones: E402 en servicio.py (logger intercalado entre imports, movido
  abajo), UP031 % -> f-strings a mano en dependencias.py y servicio.py preservando el
  texto exacto de los mensajes (los tests los validan), resto con `ruff check --fix`
  (imports sin uso, orden isort, datetime.timezone.utc -> UTC, logging % -> f-string,
  f-string sin placeholders).
- `ruff format .`: 10 archivos reformateados (semilla.py y calculos.py los de mayor
  diff: datos de semilla envueltos). Revisado el diff: sin cambios semanticos.
- Verificacion final: `ruff check .` exit 0 y pytest 109/109 (7.65s) tras el formato.
- requirements.txt: `ruff>=0.17` anadido (el repo no separa dev-dependencies; el
  Dockerfile del api lo instala sin impacto). Commit backend 5ba04b5.
- Con esto, lint formal queda cerrado en los 8 repos (7 frontend + backend). Pendiente
  derivado: evaluar gate de lint en el DoD (seccion 5 del handoff).

## 2026-11-08 (lint formal en los 7 repos frontend)

- Deuda 11.4 cerrada: eslint 9 + typescript-eslint 8 + angular-eslint 22 (flat config) en
  shell, mfe-projects, mfe-reports, mfe-admin, mfe-governance, shared-lib y ui-lib.
  Script `lint` por repo; verificacion lint+tests+build verde y commit en los 7
  (shell 8ef80c9, mfe-projects ec15cff, mfe-reports 0e81473, mfe-admin 8e0df10,
  mfe-governance daf2e3f, shared-lib b1a671b, ui-lib 15b77bf).
- Convencion de prefijos de selector, documentada en cada eslint.config.mjs: `ph` = API
  publica compartida (widgets federados y componentes de ui-lib), `app` = resto. Los MFEs
  usan ['app','ph']; ui-lib ['ph','app']; shared-lib sin angular-eslint (dominio) con
  no-explicit-any en error.
- Fixes que destapo el linter: imports/variables sin uso (sesionStore en shell,
  UsuarioStore en mfe-admin, ApiEnlaceService y `enlace` en specs de shared-lib,
  ComponentFixture en 3 specs de ui-lib) y hosts de spec renombrados a `app-*`
  (prohibido el prefijo reservado `spec-`/`test-`).
- ui-lib: `ph-data-table-column` es una @Directive con selector de elemento (API
  declarativa de la columna de la data table); se valido con configs duales de
  directive-selector. La forma plana (dos objetos tras 'error') no pasa el esquema de
  ESLint (array-form maxItems 1 por opcion): la forma correcta es anidar el arreglo
  (option 2 = arreglo de 1-2 configs), y angular-eslint elige la config por tipo real
  del selector (atributo camelCase, elemento kebab-case).
- Totales de tests sin cambio: 237 frontend + 109 backend.
- Pendiente derivado: lint del backend (ruff) y evaluar gate de lint en el DoD.

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

- Verificacion federada E2E (post a057140, sesion 2026-11-07): el dev server
  del shell servia un build desactualizado (chunk con UserSwitcher en select
  nativo); reinicio y relanzamiento de ng serve --port 4300 lo resolvio.
  Playwright headless en modo demo: 12/12 OK (mat-select/mat-form-field en
  user-switcher, 7 opciones en overlay CDK, cambio de usuario refleja en UI,
  /projects /reports /admin /governance sin fallback, F5 en ruta profunda
  /governance/decisiones OK, consola sin errores Angular ni singletons
  duplicados). Deuda no bloqueante: 24 peticiones 404 en runtime porque
  Sincronizacion consume /api/etapas, /api/entregables y /api/bitacora planas
  que el backend no expone (los remotes degradan con elegancia). Informe en
  session files (e2e-informe-2026-11-07.md).

## 2026-11-08 (rutas planas del backend + fix de push en modo demo)

- Backend (96fa534): 3 GET planos `GET /api/etapas`, `GET /api/entregables` y
  `GET /api/bitacora` (sin filtro de proyecto) en rutas.py + metodos de
  coleccion etapas()/entregables()/bitacora() en servicio.py. Tests: 4 nuevos
  en test_api.py (colecciones planas + consistencia contra /api/sincronizacion);
  suite backend 109/109.
- shared-lib (3f48335): fix de 404 en `PUT /api/sincronizacion` desde el
  navegador. Causa raiz: en modo demo sin usuario activo, actorId() devolvia
  'sistema' como fallback y el backend rechazaba con 404
  (ENTIDAD_NO_ENCONTRADA: el usuario 'sistema' no existe; reproducido con
  curl: X-Actor-Id: sistema -> 404 {"codigo":"ENTIDAD_NO_ENCONTRADA"}).
  Fix: actorId() devuelve null sin sesion y empujar() no envia nada (los
  cambios de demo son efimeros). Test nuevo: no empuja sin sesion activa;
  suite shared-lib 153/153.
- Distribucion del fix: `npx ng build` de shared-lib + reinicio de los 5 dev
  servers con `.angular/cache` limpia (el prebundle de Vite servia el dist
  viejo; tocar app.config.ts no basto). Leccion: tras cambiar una lib
  consumida por `file:../dist`, rebuild + reinicio de servers con cache
  limpia.
- E2E federado (Playwright, dev 4300-4304 + backend 8100): 12/12 OK con
  **0 recursos 404** (antes: 6 x PUT 404 + 24 rutas planas 404). Endurecido
  e2e-federado.mjs: los 404 ahora fallan el run; listener de responses >=400
  con STATUS/METHOD/URL.
- Commits: backend 96fa534 (feat), shared-lib 3f48335 (fix). Sin push
  (politica del propietario).

## 2026-11-08 (API y db Postgres dentro del compose demo)

- Objetivo (deuda del handoff, seccion 7): los frontends de la demo llaman a
  `http://localhost:8100` por defecto (API_BASE_URL) y ese puerto no tenia
  servicio en el compose. Se agrego la API y su db al stack demo.
- deploy (1deb0b8): `api.Dockerfile` nuevo (python:3.14-slim, pip install de
  requirements.txt, CMD uvicorn app.main:app --port 8100) y servicio `api`
  + servicio `db` (postgres:17-alpine con healthcheck pg_isready) en
  `docker-compose.yml`, con volumen `projecthub_pgdata_demo` y dependencia
  `condition: service_healthy`. DATABASE_URL y AUTH_SECRET sobreescribibles
  por entorno (`${VAR:-default}`). Puerto host de la db demo: 5434 (el 5433
  lo ocupa la db de desarrollo del compose del backend).
- Ajuste: el AUTH_SECRET inicial de 30 bytes disparaba
  InsecureKeyLengthWarning (RFC 7518 exige >= 32 para HMAC-SHA256); default
  alargado a 38 bytes en Dockerfile y compose; warning desaparecido de los
  logs.
- Choque de puertos en 8100 detectado y resuelto: el uvicorn de desarrollo
  del host (PID 13092, IPv6) convivia con el proxy de Docker (IPv4). Detenido
  el proceso dev; 8100 queda con dueno unico (API dockerizada).
- Verificacion de la API dockerizada (todo contra localhost:8100):
  GET /api/salud -> {"estado":"ok"}; POST /api/auth/login (diana@
  projecthub.local / projecthub-demo) -> token JWT + usuario Diana Admin;
  GET /api/sincronizacion con Bearer -> usuarios=7 proyectos=6 etapas=5
  entregables=10 bitacora=5; docker exec psql contra projecthub-db-demo ->
  tabla usuarios con 7 filas (persistencia Postgres real, no memoria).
- Rebuild de los 5 frontends demo: las imagenes previas (11-07 05:03) no
  incluian la migracion Material (a057140, 11-07 16:38). `docker compose
  build` + `up -d` de shell y 4 remotes; arboles git limpios antes de
  construir.
- Smoke demo completo: remoteEntry.json 200 en 4400-4404,
  federation.manifest.json con URLs 440x, E2E federado Playwright (variante
  SHELL=4400): **12/12 OK, 0 recursos 404** (user-switcher mat-select,
  cambio de usuario, 4 rutas sin fallback, F5 profundo, consola limpia).
- Commits: deploy 1deb0b8 (feat). Backend y shared-lib sin cambios. Sin push.

## 2026-11-08 (widget remote-a-remote: fix definitivo con REMOTE_MODULE_LOADER)

- Bug reproducido y diagnosticado a fondo: mfe-reports consume
  ProjectSummaryWidget de mfe-projects (8.5, remote a remote) y el widget
  quedaba colgado en "Cargando widget..." sin error ni timeout, tanto en dev
  4300 como en demo Docker 4400.
- Causa raiz: cada app que importa `loadRemoteModule` enlinea una copia del
  runtime NF en su chunk. En el chunk expuesto Module.js de mfe-reports esa
  copia NUNCA ejecuta initFederation, asi que `federationPromise` (estado a
  nivel de modulo) queda en pendiente para siempre y el await cuelga sin
  excepcion.
- Intento descartado: compartir el runtime NF como shared singleton en las 5
  federation.config.mjs. En prod lo excluye NG_SKIP_LIST; en dev el import
  map solo existe DESPUES de que initFederation corra en runtime (es-module-
  shims, shimMode), asi que el bare specifier es irresoluble al boot y rompia
  el arranque del shell. Revertido; el dev-host-instances-plugin solo aplica
  a SSR, no hay camino oficial.
- Solucion (Plan B): InjectionToken `REMOTE_MODULE_LOADER` en @projecthub/
  shared (shared-lib 7e840ec, patron SESION_STORE). Cada app lo provee en su
  app.config con SU copia de `loadRemoteModule` (inicializada por su
  bootstrap); los consumidores (shell dashboard.ts, mfe-reports
  proyecto-widget.ts) lo resuelven con `remoteModuleLoader()` y ya no
  importan el runtime: los chunks expuestos quedan sin runtime NF
  (verificado en los 10 chunks Module/Widget de los 4 remotes).
- Los consumidores validan que el export cargado sea funcion y lanzan error
  explicito si el remote no expone lo esperado.
- Evidencia: builds prod de los 5 apps OK; tests 219/219 (shared-lib 153,
  shell 20, mfe-projects 26, mfe-reports 5, mfe-admin 13, mfe-governance 2);
  backend pytest 109/109; E2E Playwright dev 4300 8/8 OK (login real diana
  /projecthub-demo, dashboard con 4 widgets, /reports/proyecto-widget
  renderiza el widget remoto con avance Intl, cambio de proyecto actualiza
  el resumen, F5 recarga, 0 recursos >= 400, consola limpia); standalone
  mfe-reports 4302 degrada con elegancia (tablero funciona, widget requiere
  sesion real).
- E2E actualizado a login real (fase 14): el user-switcher demo no persiste
  la sesion entre recargas (SesionStore en memoria); el token JWT del login
  si persiste en localStorage (projecthub.token).
- Commits: shared-lib 7e840ec (feat), shell 58661b5 (fix), mfe-reports
  8b5481a (fix), mfe-projects 85b9fee / mfe-admin 50dc27e / mfe-governance
  71d2ec5 (chore, provider del token en app.config). Sin push.
- Deuda registrada: lint formal (ESLint 9) sin configurar en ningun repo
  frontend (11.4 del handoff).

## 2026-11-08 (validacion del fix en demo Docker 4400)

El pendiente del handoff "rebuild demo Docker con el fix" quedo cubierto sin rebuild adicional:
docker compose build reutilizo cache de BuildKit y las imagenes 440x ya contienen el token
REMOTE_MODULE_LOADER (grep dentro de las imagenes shell y mfe-reports: presente en
_projecthub_shared y chunks de shell/reports). `docker compose up -d` recreo los contenedores.

E2E demo (SHELL=http://localhost:4400, login real diana@projecthub.local): 8/8 OK.
- dashboard del shell compone 4 widgets federados.
- /reports/proyecto-widget: widget remote a remote monta (count=1), avance Intl
  ("PORTAL DE PAGOS 42,4% $ 81.500 de $ 150.000"), cambio de proyecto lo actualiza
  ("DATA WAREHOUSE CORPORATIVO 4,8%...").
- F5 en ruta profunda recarga el widget; 0 recursos >= 400; consola limpia.

Siguiente deuda: lint formal (11.4): ningun repo frontend tiene eslint ni script lint.

## 2026-11-08 (pagina de documentos y gates en mfe-governance)

- Primera pagina real de mfe-governance (reemplaza el PlaceholderComponent): Documentos
  y entregables en src/app/pages/documentos (ts/html/scss/spec). Filtro de proyecto,
  tarjeta de estado del gate, tabla de entregables con aprobacion segun matriz y
  formulario de carga (version 1, queda pendiente).
- Dominio: `EstadoGate` gana el campo derivado `aprobados` (nombres obligatorios ya
  aprobados) en shared-lib/gates.ts, con test. El resumen del gate usa conteos y la
  pill Abierto/Cerrado es span local (stage-badge es de etapa/estado de proyecto).
- Estados de vista: banner Sesion requerida sin sesion (estructura @else if), banner
  de proyecto no activo (solo lectura) y error del dominio via permission-banner;
  el boton Cargar entregable solo aparece con proyecto Activo.
- Casos limite cubiertos en spec (11 tests, antes 2): render semilla, sin sesion,
  sin permisos (u-analista), crear, nombre vacio, aprobar con u-admin, autor-propio
  (crea como u-admin y intenta autoaprobacion), p6 cancelado, lista vacia p5.
- Verificacion: mfe-governance 11/11 (vitest), build y lint exit 0, shared-lib
  153/153. Commits: shared-lib fe863d0 (feat), mfe-governance b7c5acc (feat
  governance). Sin push.

## 2026-11-08 (iteracion 2: mat-checkbox en dependencias de etapa)
- proyecto-detalle de mfe-projects: checkbox nativo de dependencias reemplazado por mat-checkbox (patron de mfe-admin/usuarios). Ajuste de CSS del bloque dependencias. mfe-projects 26/26 tests, build y lint verdes. Commit be5afd3. Cierra el ultimo hallazgo de la auditoria Material (12.4).

## 2026-11-08 (iteracion 3: verificacion E2E del store unico, 8.4)
- Nuevo script E2E federado (en session-state, no versionado): login real (diana@projecthub.local), sesion compartida visible en mfe-admin, lecturas de dominio en mfe-projects/mfe-reports/mfe-governance, creacion de proyecto "PH-E2E Store Unico" en mfe-projects y comprobacion de que aparece en /reports/presupuesto via store unico, consola limpia. Resultado: 7/7 OK, 0 recursos >= 400. Segunda corrida (idempotencia, proyecto ya cancelado): 7/7 OK.
- Limpieza: proyecto de prueba p-mw78zvoq-1 cancelado via POST /api/proyectos/{id}/cancelar (no existe DELETE de proyectos; el dominio baja proyectos por cancelacion). Se verifico GET /api/proyectos/p-mw78zvoq-1 -> estado Cancelado y la corrida E2E sigue 7/7.
- docs/funcionalidades.md 8.4 marcado ☑ con nota de evidencia. Con esto el alcance 1-14 no queda con items ◐ abiertos.

## 2026-11-08 (iteracion 4: pagina de bitacora cross-proyecto en mfe-governance)
- Nueva pagina Bitacora en mfe-governance (ruta /governance/bitacora, link en nav): solo
  lectura, lista la bitacora de todos los proyectos del portafolio con filtros mat-select
  por proyecto y por tipo (transicion/aprobacion/cambio), evento de transicion legible con
  ETIQUETA_ETAPA ("Origen -> Destino"), autor resuelto por nombre via UsuarioStore y orden
  mas recientes primero (localeCompare descendente sobre fecha ISO).
- Reusa ph-data-table/ph-data-table-column, ph-permission-banner y intl.fecha de
  @projecthub/ui; pill con clase por tipo. Banner Sesion requerida sin sesion y banner
  Sin registros con proyecto sin bitacora (p5).
- Spec nuevo con 7 tests (render semilla, transicion legible, filtro por proyecto, filtro
  por tipo, estado vacio, sin sesion, autores resueltos). Correccion durante la iteracion:
  test 1 comparaba fechas formateadas ordenadas lexicograficamente (incorrecto: orden
  lexico no es cronologico); se reemplazo por asercion de primera fila = registro mas
  reciente (b5, 15 de oct de 2026).
- Verificacion: mfe-governance 18/18 (vitest), build exit 0, lint exit 0. Commit
  mfe-governance (feat governance). Sin push.

## 2026-11-08 (iteracion 5: mejoras de bitacora)
- mfe-projects (proyecto-detalle): la seccion Bitacora ahora muestra la fecha formateada
  con intl.fecha (antes ISO crudo), el autor resuelto por nombre via UsuarioStore (antes
  el id) y el tipo de registro como etiqueta ("Transicion.", "Aprobacion.", "Cambio.")
  antes del evento. Bug corregido durante la iteracion: recortar el ISO a 'YYYY-MM-DD'
  lo parseaba como medianoche UTC y retrocedia un dia en zonas UTC-negativas (20 de ago
  se veia como 19 de ago); el fix formatea el ISO completo, igual que la pagina Bitacora
  de mfe-governance.
- mfe-governance (pagina Bitacora): boton "Exportar CSV" junto a los filtros (patron CSV
  de mfe-reports/presupuesto: serializarCsv RFC 4180, descargarArchivo con BOM y
  nombreConFecha 'bitacora-YYYY-MM-DD-HHmm.csv'), deshabilitado sin sesion o sin filas.
  Reutiliza los helpers ya publicados por @projecthub/shared (7.5); sin tocar shared-lib.
- Tests: 2 nuevos en bitacora.spec.ts (export genera Blob + URL.createObjectURL + click
  del ancla + revokeObjectURL; export con filtro sin resultados), aserciones reforzadas
  en proyecto-detalle.spec.ts (Diana Admin, 20 de ago de 2026, sin 'u-admin' ni ISO crudo).
- Verificacion: mfe-governance 20/20, mfe-projects 26/26 (vitest), builds y lint exit 0
  en ambos. Commits: mfe-projects 14d1eec, mfe-governance 01ef742 (feat, sin push).

## 2026-11-08 (iteracion 6: e2e federado de bitacora + nav del remote)
- Hallazgo estructural: en modo federado el app.html del remote mfe-governance nunca se
  renderiza; el shell monta las rutas expuestas ("./Module") directamente en su router,
  de modo que el nav standalone (Documentos/Bitacora) solo existia en el remote aislado.
  Corollario de Native Federation, no un bug: el nav real de secciones debe vivir en las
  paginas del remote.
- mfe-governance: componente app-nav-governance (src/app/shared) con RouterLink +
  RouterLinkActive y un signal activo derivado de router.events (NavigationEnd); colocado
  al inicio de las paginas Documentos y Bitacora. Test propio con provideRouter de rutas
  de prueba (el primero fallaba porque /governance/bitacora no existia en el router vacio).
- E2E federado (session-state files/e2e-bitacora.mjs, Playwright headless contra el shell
  4300): 11/11 comprobaciones OK. Incluye descarga real del CSV (evento download, nombre
  bitacora-2026-11-07-2316.csv) y proteccion de ruta profunda sin sesion: el shell
  redirige a /login?de=/governance/bitacora antes de que el remote renderice su banner.
  Leccion de sondas: imprimir 200+ chars del body y comparar en minusculas.
- Verificacion: mfe-governance 22/22 (vitest), build exit 0, lint exit 0. Commit
  mfe-governance 0103a1a (feat). Sin push.

### Iteracion 17 (2026-11-08) - prompt-dialog a mat-form-field (Material correcto)

- Objetivo: ultimo componente de entrada con controles nativos (prompt-dialog de ui-lib, DEC-005) a Material.
- Verificacion previa: specs de consumidores no dependen de selectores del DOM del dialogo (mfe-admin mockea PromptDialogService; e2e usan input[type=...] generico). Solo componentes.spec.ts de ui-lib toca el dialogo.
- Cambios: prompt-dialog.ts usa mat-form-field appearance=outline + matInput (input/textarea) + mat-hint + etiqueta con span.ph-dialog-req; imports +MatFormFieldModule +MatInputModule; eliminados estilos hand-rolled .ph-dialog-input/.ph-dialog-etiqueta/.ph-dialog-ayuda; .ph-dialog-campo ahora display block width 100%.
- Test nuevo en componentes.spec.ts: estructura Material del dialogo (2 mat-form-field, input[matinput], textarea[matinput], mat-hint, .ph-dialog-req).
- Verificado: ui-lib 38/38 (antes 37), build exit 0, lint exit 0. Commit ui-lib 78baba2.
- Consumidores (mfe-projects, mfe-admin) verificados por analisis: no cambian (sin dependencia del DOM interno del dialogo).

## Verificacion E2E federada post-iteracion 17 (2026-11-08, 02:57)

- Bateria completa de navegador 38/38: e2e-federado 12/12, e2e-widgets 8/8, e2e-store-unico 7/7, e2e-bitacora 11/11.
- Verifica en runtime federado las iteraciones 15-17: ph-pill en documentos/bitacora/detalle, chips del gate con conteo, metadata del portafolio y prompt-dialog 100% Material (mat-form-field + matInput + mat-hint).
- Episodio documentado: los dev servers que llevaban desde antes de la iteracion 15 servian builds desactualizados (HMR) y los exposes './Module' de mfe-projects y mfe-governance caian al fallback silencioso del shell (SyntaxError blob, sin error visible). Sintoma: "Modulo no disponible" en /projects y /governance/bitacora con remoteEntry 200. Cura: detener los ng serve y relanzarlos (misma leccion de la iteracion 13). Tras relanzar: consola limpia y 38/38.
- Leccion operativa reforzada: cuando varias iteraciones de codigo no pasan por navegador, verificar E2E antes de dar por cerrado el ciclo; un dev server viejo enmascara los cambios.

## Iteracion 18 (2026-11-07) - Exportacion PDF de reportes (7.5) sin dependencias

- shared-lib: domain/pdf.ts con generarHtmlPdf (HTML imprimible: tablas con thead/tbody/tfoot,
  alineacion derecha de numeros, escape HTML, marca de tiempo) + imprimirPdf (iframe oculto
  aria-hidden + window.print, limpieza a 30 s). Barrel actualizado. 4 tests -> 161/161 OK, build OK.
- mfe-reports: exportarPdf() en tablero-general (3 tablas: detalle por proyecto, por etapa, por
  estado) y presupuesto (tabla + pie de totales); botones "Exportar PDF" junto a los de CSV.
  Build OK, 5/5 tests, lint OK.
- E2E nuevo e2e-pdf.mjs: 14/14 checks (botones, dialogo invocado en ambas paginas, titulos
  "Tablero general de indicadores" / "Reporte de presupuesto", secciones, fila de totales,
  marca de tiempo, escape HTML, consola limpia). Regresion completa 52/52 checks E2E verdes
  (14 pdf + 12 federado + 8 widgets + 7 store + 11 bitacora).
- Leccion tecnica: reconstruir el dist de shared-lib con los ng serve corriendo puede envenenar
  el watcher del shell (TS2307/TS2571 a mitad de escritura; no se recupera solo) -> reiniciar
  ese ng serve. Interceptar window.print en Playwright: nunca tocar Document.prototype.title
  (recursion); override de window.print por frame guardando window.__pdfCapturado y leerlo
  via polling de iframes[aria-hidden=true].
- Commits: shared-lib 7f16aca, mfe-reports 4549935, docs raiz (ver hash). 7.5 queda ☑ completo
  en docs/funcionalidades.md: todo el alcance numerado esta implementado.

## Iteracion 20 (2026-11-08) - E2E de gate de etapa del ciclo de vida por UI + NG0956

- Bateria nueva files/e2e-transiciones.mjs (19 checks, Playwright headless contra el shell): login Diana ->
  crear proyecto -> "Ir a Iniciativa" rechazado con mensaje de dominio (gate cerrado) -> acta obligatoria
  cargada en Documentos -> autoaprobacion rechazada (validarAprobacion) -> login Sergio (Sponsor) aprueba ->
  transicion aceptada -> badge Iniciativa -> bitacora "Planteamiento -> Iniciativa" -> gate recalculado
  ("Falta entregable: Documento de iniciativa") -> sin boton de retroceso no permitido -> F5 persiste ->
  consola limpia. RESULTADO 19/19.
- Fixes NG0956 (track by identity en colecciones de un elemento): proyecto-detalle.html transiciones/
  faltantes/pendientesAprobacion y user-switcher.ts (shell) ambos modos track $index. El warning solo se
  disparaba al clic de transicion (recompute de senales), no en navegacion simple (sonda-ng0956.mjs).
- Lecciones: (a) Test-NetConnection a 127.0.0.1 da falsos negativos cuando Vite escucha en IPv6; usar
  Invoke-WebRequest http://localhost:puerto. (b) Cuando dos bloques de plantilla son textualmente identicos,
  el edit tool falla con "Multiple matches found": desambiguar con contexto unico por bloque. (c) Los servidores
  dev de la iteracion 19 siguen sirviendo HMR tras los edits; el rerun del E2E contra los mismos procesos
  valida los cambios sin relanzar.
- Commits: mfe-projects 033d300, shell 05eb519 (fix, sin push). mcp-config.json global restaurado a su
  contenido original tras edicion por error de alcance; la deshabilitacion de mobile-mcp/maestro la hara
  el usuario manualmente.
