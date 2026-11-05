---
id: IMPL-fase-0
tipo: Implementation
type: Implementation
title: Fase 0 - Fundaciones (repos multirepo, federacion, modelos)
description: Repos multirepo Angular 22 con Native Federation operativa y modelos de dominio en shared.
estado: implementado
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T23:10:00Z
relaciona: [BL-001, BL-002, DEC-003]
status: in_progress
---

## Alcance

Items 8.1-8.3 y 9.1 de `docs/funcionalidades.md` bajo multirepo (DEC-003): repos shell +
4 remotes + 2 libs + deploy, Native Federation con singletons, y modelos/reglas de dominio
base en `@projecthub/shared`. No incluye stores con sesion (fase 2) ni componentes de UI
(fase 3).

## Diseno

- Multirepo: un repositorio Git por desarrollo (DEC-003); libs consumidas por paquete npm
  (`file:` en dev).
- Puertos: contrato logico 4200-4204 del rulebook; fisico 4300-4304 en dev y 4400-4404 en
  Docker por ocupacion del rango en el host (DEC-001). El mapeo vive en scripts npm y env.
- Singletons: `@angular/*`, `rxjs`, `@projecthub/shared`, `@projecthub/ui` en sharedMappings.

Pasos atomicos, archivos tocados, pruebas y rollback: ver IMPL-001 e IMPL-002.

## Criterio de salida

- Build de cada repo sin errores.
- `npm test` en verde para shared.
- Shell + remotes levantan; `remoteEntry.json` responde 200; navegacion basica funciona.
- Compose del repo `deploy` levanta el stack en 4400-4404.

## Verificacion de la fase (2026-11-05)

- [x] Build de los 7 repos exit 0 (shell, 4 remotes, shared-lib, ui-lib).
- [x] `npm test` en shared-lib: 31 tests passed (grafo, matriz, calculos con casos limite).
- [x] Dev 4300-4304: remoteEntry 200 en los 5, navegacion, F5 en ruta profunda, sin
      warnings de singletons duplicados (fix ngDevMode).
- [x] Docker 4400-4404: 5 imagenes construidas, stack arriba, remoteEntry 200 en los 5,
      manifest con URLs 440x, navegacion a las 4 rutas, F5 en /governance, consola limpia.
- [ ] Estado verificado: pendiente de revision humana (regla dura 1).
