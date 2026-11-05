---
id: ops-readme
tipo: Guide
type: Guide
title: .ops - gobierno del ciclo de vida
description: Metadatos de gestion y gobernanza del proyecto; el conocimiento de la plataforma vive en el codigo del producto.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-05T19:55:00Z
updated: 2026-11-05T19:55:00Z
relaciona: []
status: stable
---

Contrato OKF 0.2 (plantillas, vocabulario de estados, actores y confianza) en [templates/base.md](templates/base.md).
Fuente de verdad del avance: `PROGRESS.md` en la raiz del repositorio; `.ops` lo organiza y enlaza, nunca lo duplica ni lo sustituye.
Rulebook del proyecto: `AGENTS.md` en la raiz; alcance funcional: `docs/funcionalidades.md`.

## Areas y arboles

| Arbol | Contenido | README |
|---|---|---|
| product/ | REQ y vision de producto | [product/README.md](product/README.md) |
| project/ | plan de fases, backlog, handoff y avance | [project/README.md](project/README.md) |
| governance/ | RACI, control de cambios y riesgos | [governance/README.md](governance/README.md) |
| qa/ | estrategia, trazabilidad REQ-BL-IMPL-QT y defectos | [qa/README.md](qa/README.md) |
| implementations/ | especificaciones y verificacion por fase | [implementations/README.md](implementations/README.md) |
| templates/ | plantilla base y plantillas por tipo de documento | [templates/README.md](templates/README.md) |

Arboles bajo demanda (se crean al primer documento de su area): architecture/, decisions/,
ux-and-interfaces/, security/, operations/, data/, development/.

## Reglas del arbol

Las reglas duras del formato (estados, ids, confianza, enlaces) viven solo en el `SKILL.md` de la
skill `ops-lifecycle`; este arbol las aplica y no las repite. Los cambios al rulebook del proyecto
requieren aprobacion humana (governance/change-control.md del repo).
