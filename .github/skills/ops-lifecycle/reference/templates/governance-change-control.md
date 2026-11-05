---
id: TEMPLATE-GOV-CC
tipo: Template
type: Template
title: Plantilla de control de cambios (governance/change-control.md)
description: Modelo para governance/change-control.md.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-04T00:00:00Z
updated: 2026-11-04T00:00:00Z
relaciona: [templates-base]
---

---
id: GOV-CC-000
tipo: Guide
type: Guide
title: <Control de cambios de <proyecto>>
description: <Como se cambia el rulebook del proyecto, el alcance o las fases>
estado: vigente
dueno: rol:propietario
fecha: <YYYY-MM-DDThh:mm:ssZ>
updated: <YYYY-MM-DDThh:mm:ssZ>
relaciona: []
status: stable
verified: <YYYY-MM-DDThh:mm:ssZ>
sources: [{ id: rulebook, resource: <ruta-al-rulebook-del-proyecto>, title: <Rulebook del proyecto> }]
---

## Alcance del control

<Que decisiones pasan por este proceso: cambios de alcance, fases, presupuesto de esfuerzo, roles o del rulebook del proyecto. Lo que no pasa por aqui queda fuera.>

## Flujo de cambio

1. **Propone:** <rol:agente abre un DEC en decisions/ con pregunta, opciones y riesgos.>
2. **Aprueba:** <rol:propietario decide (abierta -> tomada/rechazada) y fecha la resolucion.>
3. **Aplica:** <rol:agente actualiza los documentos afectados (REQ, BL, plantillas) citando el DEC.>
4. **Verifica:** <como se comprueba que el cambio se aplico completo; cada cambio trae su QT o evidencia.>

## Registro de cambios

| fecha | DEC | cambio | documentos afectados | aprobado por |
|---|---|---|---|---|
| <YYYY-MM-DD> | DEC-001 | <resumen en una linea> | <ids> | <rol> |

Regla dura: un cambio de alcance o de fase sin DEC aprobado no se ejecuta; el backlog del
loop refleja siempre el alcance vigente.
