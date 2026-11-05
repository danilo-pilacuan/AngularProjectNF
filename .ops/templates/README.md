---
id: templates-readme
tipo: Guide
type: Guide
title: Plantillas de .ops
description: Una plantilla por tipo de documento; el contrato vive en base.md.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T19:55:00Z
relaciona: [templates-base]
status: stable
verified: 2026-11-05T19:55:00Z
sources: [{ id: rulebook, resource: AGENTS.md, title: AGENTS.md - ProjectHub }]
---

- **Proposito:** modelos de frontmatter y cuerpo por tipo de documento.
- **Escribe:** rol:agente / **Aprueba:** rol:propietario.
- **Cuando:** al crear cualquier documento de .ops.

| Plantilla | Para |
|---|---|
| [base.md](base.md) | contrato OKF 0.2 y vocabulario de estados |
| [decision.md](decision.md) | DEC en decisions/ |
| [requirement.md](requirement.md) | REQ en product/requirements/ |
| [backlog-item.md](backlog-item.md) | BL en project/backlog/ |
| [implementation.md](implementation.md) | especificaciones de implementations/ |
| [test-case.md](test-case.md) | QT de qa/ |
| [defect.md](defect.md) | BUG de qa/ |
| [risk.md](risk.md) | RSK con plan propio |
| [guide.md](guide.md) | guias sin numeracion en development/ |

El resto de plantillas (readme-model, vuln, run, migration, release, governance-*) se copian
desde la skill `ops-lifecycle` cuando el arbol correspondiente se cree bajo demanda.
