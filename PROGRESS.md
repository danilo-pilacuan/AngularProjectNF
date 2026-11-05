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
