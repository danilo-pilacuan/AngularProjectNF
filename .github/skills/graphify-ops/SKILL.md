---
name: graphify-ops
description: Query the graphify knowledge graph (code + semantic index of this repo) through its MCP server when the service is running. Use when asked to explore, explain or summarize code structure, find hotspots or god components, check PR impact, or any request mentioning graphify, knowledge graph, graph.json, query_graph or graphify-ops; also use it proactively before large refactors or when orienting in an unfamiliar codebase, to query the graph instead of re-reading files one by one. The kit works without it: if the graphify MCP server is not running, work as usual reading the code directly.
---

# graphify-ops

Indice de conocimiento del codigo sobre graphify: cuando el servicio MCP de graphify esta
corriendo, el grafo es la forma rapida de razonar sobre estructura, impacto y orientacion
(que es esto, que depende de que, que pasa si toco X) antes de leer archivos en masa; impulsa
el desarrollo en lugar de sustituir la lectura del codigo. La fuente de verdad es y sigue
siendo el codigo versionado en git: nunca tomes el grafo como registro ni edites el codigo a
traves del grafo. Si el servicio no esta corriendo, trabaja como siempre leyendo el codigo
directamente.

## Regla dura

Con el servicio corriendo, el grafo impulsa la exploracion: antes de un refactor grande, una
auditoria o orientarte en un modulo desconocido, consulta el grafo (busqueda semantica,
vecinos, comunidades, estadisticas) en lugar de re-leer archivos uno por uno. Regenerar el
grafo tras un cambio cuesta segundos con `update` (incremental, sin LLM para codigo):
actualiza antes de razonar sobre el grafo, no despues.

El grafo es un indice derivado de solo-lectura para el agente. Ninguna escritura contra el
grafo servido por MCP: la unica escritura legitima es la de los comandos de extraccion
(`extract`/`update`), que regeneran `graphify-out/graph.json` desde el codigo; el servidor
hace hot-reload del archivo al cambiar. Corrige el codigo (o la documentacion indexada) y
re-genera el grafo.

Si el servicio no esta corriendo, el grafo degrada a cache de consulta: trabaja como siempre
leyendo el codigo directamente; el kit funciona completo sin el y ninguna tarea se bloquea
por el grafo.

## Primera instalacion y arranque de sesion

En un repo con el kit recien instalado (o al abrir sesion), verifica el indice antes de razonar sobre
el codigo; esta secuencia es obligatoria en desarrollo agentico activo, no un paso opcional:

1. `node tools/build-graphify.mjs status` — primero diagnostica, no adivines.
2. Sin `graphify-out/graph.json`: si `status` reporta servicios caidos, `node tools/build-graphify.mjs up`
   antes de indexar; despues `node tools/build-graphify.mjs extract` (las tools MCP fallan o devuelven
   vacio sin grafo). En instalacion nueva el grafo NO se genera solo: sin este paso, graphify queda
   en adorno (caso AngularNF con rc.7).
3. Con `graph.json` existente: si el reporte de frescura muestra mas de ~1 h desde el ultimo
   commit (o la sesion anterior toco codigo indexado), `node tools/build-graphify.mjs update`
   (incremental, sin LLM). Criterio de `update`: tras CUALQUIER tarea que tocara codigo o docs
   indexados, no solo "cambios grandes" — el grafo obsoleto hace que las respuestas citen
   simbolos que ya no existen.

Esta verificacion es parte del arranque, no una alternativa de degradacion: con servicios caidos
`up` los levanta; solo si el repo no hospeda los servicios, degrada a leer directo. La version del
kit instalada vive en `.github/KIT_VERSION` (escrita por el instalador); si falta, la instalacion
fue manual: registra la version usada en `PROGRESS.md`.

## Como se conecta el kit

El kit NO provisiona el servicio: se conecta a una instancia ya levantada y estable.
- Ejemplo MCP del agente: `examples/vscode-mcp-graphify.json` (Streamable HTTP en
  `http://localhost:8080/mcp`, autenticacion por header `X-API-Key` desde la variable de
  entorno `GRAPHIFY_API_KEY`). Copialo a `.vscode/mcp.json` del repo y define esa variable.
- Recetas para levantar el servicio (Dockerfile + docker compose con graphify, Memgraph y
  mcp-memgraph) viven FUERA del kit: versionadas en `deploy/graphify/` del repo que hospeda los
  servicios, operadas con `node tools/build-graphify.mjs` (up|down|extract|update|status).
- La imagen puede venir del Docker Hub oficial (por defecto, evita construir en local) o
  construirse localmente con `--build` si se necesitan parches propios (por ejemplo el extra
  `openai` para la capa semantica).

## Modelo del grafo

- graphify indexa un repositorio en un grafo: capa de codigo (AST, determinista) y capa
  semantica opcional (extraida con un LLM OpenAI-compatible configurable via
  `OPENAI_BASE_URL`/`OPENAI_MODEL`/`OPENAI_API_KEY` en el `.env` del repo que hospeda el
  servicio). Salida: `graphify-out/graph.json`.
- Ciclo: `extract` (build completo; semantico con LLM si hay credenciales; si no, code-only),
  `update` (incremental; codigo sin LLM), `watch` (regeneracion automatica, opcional).
- Multi-proyecto: las tools MCP aceptan `project_path` y resuelven
  `<project_path>/graphify-out/graph.json`; sin `project_path` usan el grafo por defecto
  del servidor.

## Tools MCP utiles (servidor streamable-http, endpoint /mcp)

- `query_graph`: busqueda semantica libre ("donde se valida el token de sesion").
- `get_node` / `get_neighbors`: detalle de un simbolo y sus dependientes/dependencias.
- `get_community` / `god_nodes`: comunidades del grafo y componentes sobrecargados (hotspots).
- `graph_stats`: inventario y dimension del grafo.
- `shortest_path`: cadena de dependencia entre dos simbolos.
- `list_prs` / `get_pr_impact` / `triage_prs`: impacto de PRs sobre el grafo.

## Sincronizacion

Tras cualquier tarea que tocara codigo o docs indexados, re-genera el grafo antes de razonar sobre
el (requiere el servicio levantado; ver `deploy/graphify/README.md`). No esperes a un "cambio
grande": el criterio es por tarea tocada, no por tamano del diff.

```
node tools/build-graphify.mjs update    # incremental (codigo, sin LLM)
node tools/build-graphify.mjs extract   # build completo con capa semantica (LLM)
```

El servidor recarga `graph.json` al cambiar (mtime + tamano): no hace falta reiniciarlo tras
un `update`. Si el repo no tiene el servicio, omite este paso: el codigo sigue siendo la fuente.

## Fallas tipicas

- 401 al iniciar la sesion del MCP en el editor: el editor no carga el `.env` del repo; si
  `GRAPHIFY_API_KEY` solo vive alli, el `mcp.json` la expande vacia y el editor pregunta por
  autenticar en cada ventana de agente. Con el kit instalado esto se resuelve solo (el
  instalador persiste la key a nivel usuario, fuera del `mcp.json`); a mano, exporta la
  variable al entorno del editor.
- Builds grandes: la capa semantica procesa docs en chunks y puede dejar resultados
  parciales ("still truncated ... partial result kept" en el log de `extract`); son normales
  y la cache conserva lo completo. Re-ejecutar `extract` reintenta solo los chunks
  incompletos; dos pasadas suelen dejar la capa semantica estable.

## Limites

- El grafo refleja el ultimo `extract`/`update`: si acabas de editar, actualiza antes de
  confiar en el (y verifica contra el codigo real antes de afirmar algo).
- La capa semantica depende de un LLM externo: puede contener imprecisiones; el AST y las
  aristas de codigo son deterministicos y mas fiables.
- El servidor MCP solo lee `graph.json` (y recarga el archivo): la extraccion escribe
  unicamente en `graphify-out/`.
