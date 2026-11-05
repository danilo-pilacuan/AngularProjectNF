---
id: qa-strategy
tipo: Guide
type: Guide
title: Estrategia de pruebas - ProjectHub
description: Alcance de pruebas, reglas de ejecucion y cuadro de mando por fase.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T19:55:00Z
relaciona: [qa-readme]
status: stable
sources: [{ id: rulebook, resource: docs/funcionalidades.md, title: Funcionalidades - ProjectHub (seccion 11) }]
---

## Alcance

- Tests unitarios de dominio en `@projecthub/shared`: grafo de transiciones, matriz de
  permisos, avance ponderado, presupuesto, guards, stores (11.1).
- Tests de renderizado de componentes de `@projecthub/ui` (11.2).
- TypeScript estricto; sin `any` implicito, `@ts-ignore` ni `--force` (11.3).
- Build, tests y lint en verde para todos los proyectos (11.4).
- Verificacion de federacion: shell + remotes, `remoteEntry.json` 200, navegacion y widget
  remote-a-remote (11.5).

## Reglas de ejecucion

- Toda regla de negocio nueva lleva su test unitario en el mismo cambio (AGENTS.md, "Mientras trabajas").
- Casos limite obligatorios: porcentaje fuera de 0-100, fechas invertidas, monto negativo,
  autor aprobando su propio documento (AGENTS.md, "Verificacion" punto 5).
- La evidencia se registra en `traceability.md`; el estado `aprobada` de un QT lo pone el humano.

## Cuadro de mando por fase

| Fase | QT planificados | QT aprobados | QT fallidos |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
