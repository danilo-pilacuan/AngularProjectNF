---
id: IMPL-002-dominio-modelos
tipo: Implementation
title: Modelos y reglas de dominio
description: Modelos tipados, grafo de ciclo de vida, matriz de permisos, calculos y errores en shared.
estado: implementado
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T23:10:00Z
relaciona: [BL-002]
status: in_progress
---

## Alcance

Lib `@projecthub/shared`: tipos de dominio (Proyecto, EtapaTrabajo, Usuario, Rol, Bitacora,
Entregable), grafo de transiciones del ciclo de vida con retrocesos acotados, matriz de
permisos, calculos (avance ponderado, presupuesto, desviacion) y errores tipados en espanol.

## Diseno

- Sin dependencias de Angular en la capa pura de dominio (testeable sin TestBed).
- Errores como clases que extienden Error con codigo y mensaje en espanol.

Pasos: (1) generar lib, (2) modelos, (3) grafo + tests, (4) matriz + tests, (5) calculos + tests,
(6) barrel publico.
Rollback: la lib vive en su repo `shared-lib` (DEC-003); revertir = eliminar carpeta.

## Evidencia (2026-11-05)

- Archivos en `shared-lib/projects/projecthub/shared/src/lib/domain/`: catalogos.ts (etapas,
  estados, roles, acciones + etiquetas espanol), errores.ts (ErrorDominio + 6 subclases),
  ciclo-vida.ts (grafo lineal + retrocesos acotados PoC->Iniciativa y ValidacionPoC->PoC),
  matriz-permisos.ts (9 etapas x 10 acciones), modelos.ts (Proyecto, EtapaTrabajo, Usuario,
  Entregable, BitacoraEntrada, PermisoMatriz), calculos.ts (avance ponderado por duracion,
  presupuesto/consumo total, desviacion, alerta de exceso, validaciones 0-100 / fechas /
  montos), index.ts (barrel).
- Scaffold Angular del generador eliminado (lib/shared.ts, lib/shared.spec.ts); public-api.ts
  exporta solo el dominio puro.
- Tests vitest: 31 tests en 3 archivos (ciclo-vida, matriz-permisos, calculos) con casos
  limite (avance fuera de 0-100, fechas invertidas, monto negativo, transiciones invalidas,
  permiso denegado). `npm test` exit 0: 31 passed.
- `npx ng build` de shared-lib exit 0; dist regenerado en dist/projecthub/shared.
- Pendiente de revision humana para estado verificado (regla dura 1).
