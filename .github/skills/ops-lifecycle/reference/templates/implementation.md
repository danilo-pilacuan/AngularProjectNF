---
id: TEMPLATE-IMPL
tipo: Template
type: Template
title: Plantilla de plan de implementacion (IMPL)
description: Modelo para implementations/IMPL-NNN-<slug>.md.
estado: vigente
dueno: rol:propietario
fecha: 2026-10-25T00:00:00Z
updated: 2026-10-25T00:00:00Z
relaciona: [templates-base]
---

---
id: IMPL-000-<slug>
tipo: Implementation
type: Implementation
title: <Tarea concreta>
description: <Una linea>
estado: borrador           # borrador | aprobado | ejecutado
dueno: rol:propietario
fecha: <YYYY-MM-DDThh:mm:ssZ>
updated: 2026-10-25T00:00:00Z
relaciona: [BL-000]        # regla de trazabilidad: todo IMPL enlaza un BL
status: draft
---

Convencion de ids (elegir UNA por proyecto, no mezclar): ids globales `IMPL-NNN-<slug>`
consecutivos, o agregadores por fase `IMPL-fase-N.md` que listan tareas sin id propio. Si
coexisten ambos formatos en el mismo `.ops/implementations/`, es defecto (el validador lo
marca como aviso).

## Alcance

<Que incluye y que no.>

## Diseno

<Decisiones tecnicas y por que; enlaza DEC si existen.>

Pasos atomicos en orden, archivos tocados, pruebas (casos que pasan y de rechazo) y rollback: <rellenar por tarea.>
