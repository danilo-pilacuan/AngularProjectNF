---
id: project-plan
tipo: Guide
type: Guide
title: Plan de fases - ProjectHub
description: Fases de implementacion con alcance y estado; el detalle de tareas vive en implementations/.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T19:55:00Z
relaciona: [project-readme, implementations-readme]
status: stable
sources: [{ id: rulebook, resource: docs/funcionalidades.md, title: Funcionalidades - ProjectHub }]
---

Fases derivadas del "Orden de implementacion sugerido" de `docs/funcionalidades.md`.

| Fase | Alcance | Estado |
|---|---|---|
| 0 | Fundaciones: repos multirepo Angular 22 + Native Federation + modelos (8.1-8.3, 9.1) | implementado |
| 1 | Dominio: ciclo de vida, roles, matriz, errores (3.1-3.6, 1.2, 1.5, 9.3) | implementado |
| 2 | Stores y sesion: signals, sesion simulada, semilla (1.6, 8.4, 10.1, 10.2) | implementado |
| 3 | UI compartida: componentes base + Gantt (9.2, 6.1-6.4) | implementado |
| 4 | mfe-projects: portafolio, detalle, etapas, presupuesto, widget (2.x, 4.x, 5.x, 8.5) | implementado |
| 5 | mfe-admin: usuarios y matriz (1.1, 1.3, 1.4, 1.7, 1.8) | implementado |
| 6 | mfe-reports: reportes + widget remote-a-remote (7.1-7.4) | implementado |
| 7 | shell: dashboard, navegacion, selector de usuario (8.6, 1.6) | implementado |
| 8 | Integracion y cierre: tests, build, verificacion de federacion (11.1-11.5) | implementado |

Nota de verificacion: los estados `implementado` quedan pendientes de revision humana
para subir a `verificado`; la evidencia (tests, builds, smokes por stack) esta en
PROGRESS.md. La fase 8 cerro con verificacion E2E en ambos stacks: 169 tests verdes,
7 builds prod exit 0, navegacion y F5 en ruta profunda en dev (4300-4304) y docker
(4400-4404), dashboard con 3 widgets federados, sesion compartida via store y consola
limpia (sin singletons duplicados).

Nota de entorno: el rango 4200-4204 esta ocupado en el host; los puertos de desarrollo se
desplazan (ver `.ops/project/handoff.md`, seccion 4). Los puertos de referencia del rulebook
se mantienen como contrato logico; el mapeo fisico vive en configuracion, nunca en codigo.

Nota de arquitectura: por instruccion del propietario (DEC-003) el codigo se organiza en
multirepo: un repositorio Git por desarrollo (`shell`, `mfe-projects`, `mfe-reports`,
`mfe-admin`, `mfe-governance`, `shared-lib`, `ui-lib`, `deploy`, `backend` placeholder). Las
libs se consumen por paquete npm; el workspace raiz solo orquesta scripts.
