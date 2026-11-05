---
id: IMPL-001-workspace-federation
tipo: Implementation
type: Implementation
title: Repos multirepo y federacion base
description: Crear repos shell, 4 remotes, 2 libs y deploy con Native Federation y puertos desplazados.
estado: implementado
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T23:10:00Z
relaciona: [BL-001, DEC-003]
status: in_progress
---

## Alcance

Repos independientes (carpeta + `.git` + `package.json` + `angular.json` propios) para shell,
4 remotes, 2 libs y `deploy`; federation.manifest.json, remoteEntry de cada remote, rutas de
primer nivel del shell con fallback, y scripts npm de build/start/test/lint por repo.

## Diseno

- `ng generate` con esquematicos de native-federation para shell y remotes, un repo por app.
- Libs `@projecthub/shared` y `@projecthub/ui` como paquetes npm (`file:` en dev), barrel publico.
- Rutas remotas expuestas como arreglo de rutas (sin RouterModule.forRoot), per rulebook.
- Fallback de carga de remote en la zona de contenido del shell.
- Repo `deploy`: Dockerfile por app + compose con puertos 4400-4404 (DEC-001, DEC-002).

Pasos: (1) generar repos, (2) configurar federation, (3) scripts npm con puertos 4300-4304,
(4) build por repo, (5) smoke de serve + remoteEntry 200, (6) compose en 4400-4404.
Rollback: cada repo es una carpeta con git propio; revertir = eliminar carpeta.

## Evidencia (2026-11-05)

- 7 repos con git propio (shell, 4 remotes, shared-lib, ui-lib) + raiz orquestadora
  (tools/run-all.mjs, start-dev.mjs, bootstrap-repos.mjs).
- Build prod exit 0 en los 7 repos; dist del shell con index.html + federation.manifest.json
  + remoteEntry.json (leccion: el dev server NF contamina dist con artefactos -dev;
  para Docker, build fresco).
- Smoke dev 4300-4304: remoteEntry.json 200 en los 5, navegacion por el menu, F5 en ruta
  profunda OK, fix ngDevMode (define en main.ts antes de initFederation).
- Docker: deploy/projecthub con shell.Dockerfile, remote.Dockerfile (ARG_REPO), nginx
  (SPA fallback + CORS para el fetch cross-origin de remoteEntry), compose 4400-4404,
  manifest Docker con URLs 440x. 5 imagenes construidas y stack levantado.
- Verificacion Docker: remoteEntry.json 200 en 4400-4404, manifest con URLs 440x,
  navegacion a las 4 rutas federadas, F5 en /governance OK, consola sin errores ni
  warnings de singletons duplicados.
- Pendiente de revision humana para estado verificado (regla dura 1).
