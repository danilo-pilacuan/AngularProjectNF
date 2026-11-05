---
id: GOV-CC-001
tipo: Guide
type: Guide
title: Control de cambios de ProjectHub
description: Como se cambia el rulebook del proyecto, el alcance o las fases.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T19:55:00Z
relaciona: [governance-readme]
status: stable
sources: [{ id: rulebook, resource: AGENTS.md, title: AGENTS.md - ProjectHub }]
---

## Alcance del control

Cambios de alcance funcional (`docs/funcionalidades.md`), de fases del plan, de puertos o
convenciones de entorno, y del rulebook (`AGENTS.md`). Lo que no pasa por aqui: correcciones
de defectos y tareas dentro del alcance vigente.

## Flujo de cambio

1. **Propone:** rol:agente abre un DEC en decisions/ con pregunta, opciones y riesgos.
2. **Aprueba:** rol:propietario decide (abierta -> tomada/rechazada) y fecha la resolucion.
3. **Aplica:** rol:agente actualiza los documentos afectados (REQ, BL, plantillas) citando el DEC.
4. **Verifica:** cada cambio trae su QT o evidencia de ejecucion.

## Registro de cambios

| fecha | DEC | cambio | documentos afectados | aprobado por |
|---|---|---|---|---|
| 2026-11-05 | [DEC-001](../decisions/DEC-001.md) | Puertos fisicos desplazados: dev 4300-4304, Docker 4400-4404; 4200-4204 queda como contrato logico | plan.md, handoff.md, BL-001, IMPL-001, docs/funcionalidades.md | rol:propietario (instruccion del 2026-11-05) |
| 2026-11-05 | [DEC-002](../decisions/DEC-002.md) | Docker con doble rol: demo/verificacion en compose (4400-4404) y alternativa a npm start | DEC-002, IMPL-001 | rol:propietario (instruccion del 2026-11-05) |
| 2026-11-05 | [DEC-003](../decisions/DEC-003.md) | Arquitectura multirepo: un repo Git por desarrollo (shell, 4 SPA, 2 libs, deploy, backend placeholder); se corrigen especificaciones | docs/funcionalidades.md 8.1, plan.md, backlog/index.md, BL-001, fase-0, IMPL-001, IMPL-002 | rol:propietario (instruccion del 2026-11-05) |

Regla dura: un cambio de alcance o de fase sin DEC aprobado no se ejecuta; el backlog del
loop refleja siempre el alcance vigente.
