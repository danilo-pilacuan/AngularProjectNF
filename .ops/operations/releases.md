---
id: ops-releases
tipo: Release
type: Release
title: Registro de releases
description: Registro de REL-NNN por entorno con su verificacion post-despliegue.
estado: vigente
dueno: rol:ops
fecha: 2026-11-07T00:00:00Z
updated: 2026-11-07T00:00:00Z
relaciona: [operations-readme]
status: stable
---

| id | release | contenido | estado |
|---|---|---|---|
| REL-001 | RC4/dev demo 2026-11-07 | Fases 0-8, 13, 14 y 14.5: federacion, dominio, stores http, backend FastAPI/Postgres, autenticacion JWT, credenciales persistidas + /perfil | ejecutado (pendiente revision humana) |
| REL-002 | RC4/dev demo 2026-11-09 | VULN-005..011 mitigadas (re-sync con paridad de validaciones del canal normal); preparacion del release 1 de QA funcional: verificacion de login (7 usuarios de semilla) y navegacion entre rutas, y documento de credenciales por rol (.ops/qa/credenciales-qa.md) | ejecutado (pendiente revision humana) |

Verificacion post-despliegue de cada release: ver seccion REL-001 abajo
(el detalle por stack vive aqui, no en PROGRESS.md).

## REL-002: release 1 de QA funcional (2026-11-09, it68)

Alcance: mismo stack demo REL-001 (Docker 4400-4404 + API 8100) con las
mitigaciones VULN-005..011 del re-sync (it61..it67, backend 5b8b147) y
documento de credenciales por rol para el equipo de QA
(.ops/qa/credenciales-qa.md).

Verificacion (politica de ahorro del propietario: sondas focalizadas, sin
suites largas; la suite completa del backend corre al aprobarse el release):

- Login por API: los 7 usuarios de semilla; 6 activos -> 200 con token JWT
  (diana, sergio, paula, andres, sofia, daniel), ivan inactivo -> 403
  (comportamiento esperado, sin sesion).
- Navegacion/federacion: remoteEntry.json 200 en 4400-4404;
  federation.manifest.json del shell con URLs directas 440x; SPA con
  historial (GET / y GET /governance -> 200); GET /api/proyectos con Bearer
  -> 200.
- Rutas del shell (shell/src/app/app.routes.ts): '' dashboard, /login,
  /perfil (sesionGuard), /projects, /reports, /governance (sesionGuard),
  /admin (sesionGuard + permisoGuard roles [Admin]), /sin-permisos,
  ** -> ''.
- Accesos del explorador de QA: el documento lista rutas visibles por rol;
  el guard /admin redirige a /sin-permisos a todo no-Admin (comportamiento
  verificado en unit tests del guard, iteraciones previas).

Pendiente de revision humana (gate del release): E2E de navegador sobre
4400 (login por UI, F5 en ruta profunda, consola sin warnings) y corrida
completa del backend al aprobarse el release; registro del resultado en
esta seccion.

## REL-001: verificacion post-despliegue (2026-11-07)

Alcance desplegado: fases 0-8 (frontend), 13 (backend + persistencia),
14 (autenticacion JWT) y 14.5 (credenciales persistidas, cambio de
contrasena, pantalla /perfil). Commits: backend fd53e99, shared-lib 1c790a4,
shell 0d2ca39, raiz bf0e94d.

### Stack dev (4300-4304 + API 8100 + Postgres 5433)

- Salud: `GET http://127.0.0.1:8100/` -> 200; projecthub-db healthy.
- Pruebas puntuales (politica de ahorro del propietario, sin suites
  repetidas): backend tests/test_auth.py 23/23 (incluye 4 de 14.5) y
  tests/test_api.py 1/1; shared-lib vitest 152/152.
- E2E curl: login demo -> cambio -> login nueva 200 -> login vieja 401 ->
  restaurar. Persistencia probada reiniciando uvicorn (la credencial vive en
  Postgres, no en el proceso).
- E2E navegador: login, escritura persistida con Bearer, F5 con restauracion
  de sesion (fase 14, sesion previa).

### Stack Docker demo (4400-4404; API consumida en localhost:8100)

- Imagenes: shell reconstruida 2026-11-07 05:07 (incluye 14.5 y el fix del
  token leido de TokenAlmacen), remotes 2026-11-07 05:03, projecthub-db
  (backend) 2026-11-05.
- Probes: `GET /` en 4400 -> 200; `GET /remoteEntry.json` en 4401-4404 -> 200;
  `GET /api/proyectos` en 8100 -> 200.
- E2E navegador en 4400 (usuario demo diana@projecthub.local): cambio de
  contrasena por UI -> mensaje de exito; logout; re-login con la nueva
  contrasena -> dashboard; actual incorrecta -> alerta "La contrasena actual
  no es correcta."; recarga directa de /perfil (F5) con sesion restaurada;
  restauracion a la demo por UI; login demo verificado contra la API.
- Consola del navegador sin warnings de Angular duplicado ni singletons.

### Rollback

- Docker: `docker compose -f deploy/projecthub/docker-compose.yml down` y
  redeploy de la imagen anterior etiquetada por fecha.
- Datos: volumen nombrado `projecthub_pgdata` (DEC-006); backup fuera de
  alcance por ahora (RSK pendiente de abrir).
