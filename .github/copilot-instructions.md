# Copilot: reglas del repositorio

## Proposito de estas instrucciones

Reglas universales de trabajo y quirks del entorno. Lo especifico del proyecto (stack, comandos,
puertos, convenciones) va en su `AGENTS.md` (u otro rulebook) y en su documentacion, no aqui.

## Documentacion de operaciones

Usa la skill `ops-lifecycle` para crear, verificar o actualizar los documentos de `.ops/`: define
plantillas, estados y trazabilidad. Si el repo no tiene `.ops/`, ejecuta su bootstrap antes de la
primera tarea de desarrollo: `.ops` es donde se registra lo encontrado por cada rol en cada sesion
agentica; sin `.ops` no queda documentado nada. Para contar intentos del presupuesto de esfuerzo,
usa `tools/loop-guard.mjs` (opcional; su ledger es estado de sesion, no documentacion).

## Idioma

- **Respuestas al usuario:** responde en el idioma del ultimo mensaje del usuario.
- **Artefactos tecnicos:** codigo, identificadores, comentarios, commits, logs y `.ops/` en ASCII
  sin diacriticos: el collate y las herramientas danan los no-ASCII (ordenan mal, rompen diffs,
  mojibake). La UI y el contenido a usuarios finales siguen la convencion del proyecto.
- Documentacion general en Markdown sigue la convencion del repo; por defecto aplica la misma regla
  sin diacriticos para mantener diffs y buscadores estables.

## Gotchas del entorno (aplican siempre)

- **Shell:** bash preferente (Git Bash en Windows; PowerShell de respaldo; shell del sistema en
  Linux/Mac). La sintaxis POSIX (`&&`, `||`, pipes, comillas simples) funciona igual en los tres.
- **CRLF/LF:** al crear scripts, respeta los finales de linea que ya usa el repo; no mezcles.
- **curl:** con Git Bash, el curl de siempre (JSON entre comillas simples o `--data @archivo.json`;
  en PowerShell, curl.exe).

## Politica de sesion

Sesiones cortas y enfocadas: un objetivo por sesion, verificado antes de cerrar. Si la tarea no
cabe, divide y deja el contexto en `PROGRESS.md` y `.ops/project/handoff.md` (ver skill
`ops-lifecycle`); no migres trabajo a medias sin dejar rastro escrito. **Al abrir sesion en un repo
con `.ops` (o `PROGRESS.md`), lee ambos antes de actuar.**

## Comunicacion

- Respuestas breves: lo que se hizo, la evidencia y el siguiente paso; explica decisiones no
  obvias en una linea. Nunca marques algo como verificado sin evidencia real de ejecucion.

## Reglas de trabajo

1. Lee antes de escribir: entiende la zona afectada antes de proponer cambios.
2. Cambios minimos y completos: sin refactorizaciones colaterales ni TODOs pendientes.
3. Valida siempre: compila, prueba o ejecuta el camino minimo que cubre tu cambio.
4. Si algo no funciona, prueba una alternativa antes de declararlo imposible.
5. Al repetir el mismo tipo de accion 3 veces, activa la seccion "Presupuesto de esfuerzo" abajo.

## Presupuesto de esfuerzo

Frena los bucles de reintento: repetir la misma accion que sigue fallando consume la sesion sin
avanzar. El interruptor es contable, no subjetivo: cuenta por tipo de accion y objetivo; dos
intentos solo difieren si cambia algo material (otro comando, otro archivo, otro enfoque).

- **A las 3 repeticiones (modo plan, obligatorio):** deja de ejecutar; consulta al usuario en texto
  plano, sin herramientas. Resume en <= 5 lineas (que intentaste, el ultimo error exacto, 2-3
  caminos con su coste) y pregunta por cual seguir.
- **A las 10 (tope de emergencia):** termina el turno con el informe del bloqueo y el plan
  propuesto; no replantees el objetivo ni sigas iterando en la misma tarea.
- **Si reaparece tras el plan:** apuntalo en `PROGRESS.md` (diagnostico + lo pedido al usuario) y
  cierra el turno; lo decide el usuario.
- **Excepcion unica:** reintentos de red/build largo en curso, max 2; si no termina, tope de emergencia.

## Commits

- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Un commit = un cambio coherente; sin artefactos generados ni secretos.
- Mensajes en ASCII sin diacriticos (regla de idioma de arriba).
