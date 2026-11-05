---
name: ops-lifecycle
description: Govern any software project through a full ops lifecycle. Use when planning phases or epics, writing requirements, business logic, phase or task specifications, test strategy, bug reports, ADRs, risk registers, migrations, runbooks, security findings, releases, guides, when preparing session handoff and progress notes, when development starts in a repo without .ops (run the bootstrap first), or for any request mentioning .ops, OKF, REQ, BL, IMPL, QT, BUG, DEC, RSK, RUN, MIG, REL, VULN, PROGRESS.md or handoff.
---

# ops-lifecycle

Gobierno del ciclo de vida de software en `.ops` (formato OKF 0.2). Usa la plantilla que toque,
nunca inventes estructura. Al trabajar en un repo con `.ops`, aplica las reglas de la seccion
"Reglas duras" sin releerlas de los documentos.

## Referencias

- `reference/templates/base.md` - contrato OKF 0.2: vocabularios de estado, mapeo status, actores y confianza (leer una vez por sesion si vas a editar documentos).
- `reference/templates/` - plantillas por tipo de documento.
- `reference/tree/` - esqueletos de documentacion: README por arbol, handoff y modelo de README.

## Reglas duras de .ops

Estas reglas viven SOLO aqui; los documentos de `.ops` las aplican, no las repiten. Cuando una
plantilla o documento cite una de estas reglas, cita su texto corto (p. ej. "el agente nunca
escribe `verified`"), nunca su numero: la numeracion puede reordenarse y la cita quedaria rota.

1. Estado: solo el vocabulario de `templates/base.md` para el tipo de documento. El agente nunca asigna `verificado`/`verified` a si mismo: lo pone un humano (rol:propietario o rol:funcional) tras revisar evidencia real (salida de comando, resultado de prueba); si la evidencia no existe, el estado no sube.
2. Un documento = un archivo con `id` unico en frontmatter; los registros extensos (DEC, RSK, BUG, QT, VULN, RUN, MIG, REL) se abren como archivos y se listan en el README de su arbol.
3. Toda cita de requisitos referencia el rulebook del proyecto (AGENTS.md, README u otro documento de reglas; si no hay, la fuente real de donde deriva) por seccion; `.ops` no parafrasea requisitos como reglas nuevas.
4. Frontmatter: se copia de la plantilla y solo se editan `id`, `title`, `description`, `relaciona` y el vocabulario de `estado`. `status` se deriva de `estado` segun el mapeo de `templates/base.md`; nunca se reescribe a mano.
5. Antes de mover o renombrar documentos, consultar `governance/change-control.md` del repo.
6. Enlaces: entre documentos de `.ops`, usar rutas relativas dentro del arbol (o `../` hacia otro arbol). Nunca enlaces absolutos tipo `C:\...` ni rutas con nombre de usuario.

## Presupuesto de esfuerzo

Bucle = repetir el mismo tipo de accion sobre el mismo objetivo sin cambio material: mismo comando,
reescritura del mismo documento, releer los mismos archivos o corregir el mismo error. Lleva la
cuenta por objetivo (contar los intentos, no confiar en la sensacion de atasco). A las 3
repeticiones, para y consulta al usuario en texto plano: que intentaste, el error exacto de la
ultima vez y 2-3 caminos posibles con su coste; sin herramientas hasta responder. A las 10,
termina el turno con el informe y el plan; el objetivo no se replantea. Unica excepcion: reintentos
de red o builds largos en curso, maximo 2.

## Trazabilidad y numeracion

- Cadena: REQ -> BL -> IMPL -> QT; cada QT se mapea a los IMPL/BL/REQ que verifica. Las decisiones se registran como DEC; los riesgos como RSK.
- Numeracion: REQ-NNN, BL-NNN, QT-NNN, DEC-NNN, RSK-NNN, BUG-NNN, VULN-NNN, RUN-NNN, MIG-NNN y REL-NNN son secuenciales globales del repo, no se reinician por fase.
- IMPL usa dos formatos segun el documento:
  - **IMPL-NNN-`<slug>`** - un documento por tarea concreta e implementable (archivo `IMPL-NNN-<slug>.md`); el numero es global del repo.
  - **fase-N** - un documento agregador por fase (alcance, criterio de salida, indice de sus IMPL, estado de verificacion de la fase); no compite con los IMPL: los indexa.
  - Si el repo ya usa solo `fase-N` con tareas dentro, respeta su convencion y plantea migrar en una DEC antes de mezclar formatos.
- El log de avance es `PROGRESS.md` en la raiz del repo: detalle dia a dia. Los documentos de `.ops` registran estados y decisiones, no narrativa; nunca lo duplican ni lo sustituyen.

## Handoff de sesion

Toda sesion de desarrollo deja rastro en `.ops`: los hallazgos por rol se registran en los
documentos del arbol correspondiente (BUG, DEC, RSK, VULN, RUN...), el avance en `PROGRESS.md` y el
contexto para la siguiente sesion en el handoff. Al cerrar una tarea significativa, actualiza
`PROGRESS.md` y la seccion "Historial de sesiones" de
`.ops/project/handoff.md`. Estructura del handoff (8 secciones, ver
`reference/tree/project/handoff.md`): header blockquote (fecha, rama, hashes) / estado del producto /
como usarlo / entorno local / como levantar y verificar / mapa de documentos / trabajo en curso /
historial de sesiones. Resumen, no duplica el detalle. Si una tarea se corta por bucle de reintentos
(el corte llega por presupuesto, no por exito), dejalo escrito en PROGRESS.md y en la seccion
"Trabajo en curso" del handoff: donde se quedo, intentos gastados y que se pidio al usuario.

## Cierre de defectos y decisiones

- BUG: estado de `templates/defect.md`; el fix exige evidencia de ejecucion real; el estado `verificado` lo pone un humano.
- DEC: una pregunta por documento, estado abierta -> tomada/rechazada; la resolucion la toma el propietario, el agente documenta y nunca la cierra por si mismo.

## Mini-examples

- REQ nuevo: copia `reference/templates/requirement.md`, `id: REQ-011` (siguiente global), cita la seccion del rulebook, `estado: borrador`.
- Fase que arranca: crea/actualiza `fase-3.md` con alcance y criterio de salida; desglosa tareas como `IMPL-021-api-auth.md` e `IMPL-022-token-refresh.md`; indexa ambas en la fase.
- Cierre de fase: checklist del DoD en la especificacion de fase; avanza estados con evidencia; actualiza `PROGRESS.md`.

## Bootstrap de un repo nuevo

Set minimo (crear solo esto al arrancar; los arboles restantes se crean bajo demanda cuando
surge el primer documento de su area):

1. `mkdir -p .ops/product .ops/project/backlog .ops/governance .ops/qa .ops/implementations`
2. Copia `reference/templates/base.md` a `.ops/templates/base.md`, y de `reference/tree/` el
   README del arbol a cada `.ops/<arbol>/README.md` (incluye `templates/README.md` desde `readme-model.md`).
3. Copia `reference/tree/project/handoff.md` a `.ops/project/` y rellena las secciones 2-8 con el estado real del repo.
4. Si el README de un arbol lista plantillas, copialas desde `reference/templates/`.
5. Crea `PROGRESS.md` en la raiz si no existe (no es parte de `.ops`).

Arboles bajo demanda (crear al primer documento de su area, copiando su README desde
`reference/tree/`): `architecture/`, `decisions/`, `ux-and-interfaces/`, `security/`,
`operations/`, `data/`, `development/`.
