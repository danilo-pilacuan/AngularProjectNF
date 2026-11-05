---
id: GOV-RACI-001
tipo: Guide
type: Guide
title: Roles y RACI de ProjectHub
description: Quien propone, aprueba y valida en cada tipo de documento de .ops.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T19:55:00Z
relaciona: [governance-readme]
status: stable
sources: [{ id: rulebook, resource: AGENTS.md, title: AGENTS.md - ProjectHub }]
---

## Roles

| rol | quien | descripcion | Decisiones que toma |
|---|---|---|---|
| rol:propietario | human:propietario | dueno del proyecto y del presupuesto de esfuerzo | aprobar REQ, DEC, REL; cerrar fases |
| rol:agente | copilot-agent | implementa, documenta y propone | proponer cambios; ejecutar lo aprobado |

## RACI por documento

| Documento | Propone | Aprueba | Valida |
|---|---|---|---|
| REQ (product/requirements/) | rol:agente | rol:propietario | rol:propietario |
| BL (project/backlog/) | rol:agente | rol:propietario | rol:agente |
| IMPL (implementations/) | rol:agente | rol:propietario | rol:agente |
| QT (qa/) | rol:agente | rol:propietario | rol:agente |
| DEC (decisions/) | rol:agente | rol:propietario | rol:propietario |
| VULN (security/) | rol:agente | rol:propietario | rol:propietario |
| REL (operations/releases.md) | rol:agente | rol:propietario | rol:propietario |
| RUN (operations/runbooks.md) | rol:agente | rol:propietario | rol:propietario |
| MIG (data/migrations.md) | rol:agente | rol:propietario | rol:propietario |

Regla dura: los roles del frontmatter (`dueno`, `relaciona`) deben existir en esta tabla; un
rol sin dueno humano no aprueba nada.
