---
id: TEMPLATE-GOV-RACI
tipo: Template
type: Template
title: Plantilla de roles RACI (governance/roles-raci.md)
description: Modelo para governance/roles-raci.md.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-04T00:00:00Z
updated: 2026-11-04T00:00:00Z
relaciona: [templates-base]
---

---
id: GOV-RACI-000
tipo: Guide
type: Guide
title: <Roles y RACI de <proyecto>>
description: <Quien propone, aprueba y valida en cada tipo de documento>
estado: vigente
dueno: rol:propietario
fecha: <YYYY-MM-DDThh:mm:ssZ>
updated: <YYYY-MM-DDThh:mm:ssZ>
relaciona: []
status: stable
verified: <YYYY-MM-DDThh:mm:ssZ>
sources: [{ id: rulebook, resource: <ruta-al-rulebook-del-proyecto>, title: <Rulebook del proyecto> }]
---

## Roles

| rol | quien | descripcion | Decisiones que toma |
|---|---|---|---|
| rol:propietario | <humano responsable> | <dueño del proyecto y del presupuesto de esfuerzo> | aprobar REQ, DEC, REL; cerrar fases |
| rol:agente | <agentes de codigo> | <implementa, documenta y propone> | proponer cambios; ejecutar lo aprobado |
| rol:sec | <opcional> | <seguridad> | aprobar VULN y releases sensibles |
| rol:ops | <opcional> | <operacion> | aprobar RUN y MIG |

## RACI por documento

| Documento | Propone | Aprueba | Valida |
|---|---|---|---|
| REQ (product/requirements/) | rol:agente | rol:propietario | rol:propietario |
| BL (project/backlog/) | rol:agente | rol:propietario | rol:agente |
| IMPL (implementations/) | rol:agente | rol:propietario | rol:agente |
| QT (qa/) | rol:agente | rol:propietario | rol:agente |
| DEC (decisions/) | rol:agente | rol:propietario | rol:propietario |
| VULN (security/) | rol:agente | rol:sec | rol:propietario |
| REL (operations/releases.md) | rol:agente | rol:propietario | rol:propietario |
| RUN (operations/runbooks.md) | rol:agente | rol:ops | rol:propietario |
| MIG (data/migrations.md) | rol:agente | rol:ops | rol:propietario |

Regla dura: los roles del frontmatter (`dueno`, `relaciona`) deben existir en esta tabla; un
rol sin dueño humano no aprueba nada.
