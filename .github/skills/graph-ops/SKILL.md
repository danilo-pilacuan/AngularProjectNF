---
name: graph-ops
description: Consult the .ops traceability graph in Memgraph when the repo has the graph index running. Use when asked about impact analysis (what is affected if X changes), orphan documents, document criticality, or any request mentioning the .ops graph, Memgraph, Cypher, ops-graph or graph-ops; also use it proactively before planning, moving, renaming or deprecating .ops documents, to query the graph instead of re-reading files one by one. The kit works without it: if Memgraph is not running, work as usual reading .ops files directly.
---

# graph-ops

Mapa de trabajo sobre el grafo de trazabilidad de `.ops` en Memgraph: cuando Memgraph esta
corriendo, el grafo es la forma rapida de razonar sobre impacto, huerfanos y criticidad antes de
tocar documentos; impulsa el desarrollo en lugar de sustituir la lectura de los archivos. La
fuente de verdad es y sigue siendo el Markdown versionado en git: nunca edites `.ops` a traves
del grafo y nunca tomes el grafo como registro. Si Memgraph no esta corriendo, trabaja como
siempre leyendo los archivos de `.ops` directamente.

## Regla dura

Con Memgraph corriendo, el grafo impulsa el desarrollo: antes de planificar, mover, renombrar o
dar de baja documentos de `.ops`, consulta el grafo (impacto multi-salto, huerfanos, inventario,
criticidad con MAGE) en lugar de releer los archivos uno por uno. Sincronizar tras un cambio
cuesta segundos: re-sincroniza antes de razonar sobre el grafo, no despues.

El grafo es un indice derivado de solo-lectura para el agente. Ninguna escritura via Cypher
(`CREATE`, `MERGE`, `SET`, `DELETE`, `REMOVE`, `DROP`) contra el grafo de `.ops`: ni para corregir
datos ni para "actualizar" documentos. La unica escritura legitima es la del importer
`ops-graph.mjs` durante la sincronizacion (su `DETACH DELETE` + recarga desde los `.md`). Corrige
el Markdown y re-sincroniza.

Si Memgraph no esta corriendo, el grafo degrada a cache de consulta: trabaja como siempre leyendo
los archivos de `.ops` directamente; el kit funciona completo sin el y ninguna tarea se bloquea
por el grafo.

## Primera instalacion y arranque de sesion

En un repo con el kit recien instalado (o al abrir sesion), alinea el indice antes de razonar sobre
`.ops`: si Memgraph esta corriendo y el grafo esta vacio (ningun nodo `:Doc`), corre el importer
`node .github/tools/ops-graph.mjs .ops` para cargarlo; tras crear, mover o renombrar documentos,
re-sincroniza (cuesta segundos). Esta verificacion es parte del arranque en desarrollo agentico
activo, no un paso opcional. La version del kit instalada vive en `.github/KIT_VERSION` (escrita
por el instalador); si falta, la instalacion fue manual: registra la version usada en `PROGRESS.md`.

## Modelo del grafo

- Nodo `(:Doc {id, tipo, estado, title, file})`: un documento de `.ops` con `id` en frontmatter.
- Aristas `[:RELACIONA]` (declaradas en `relaciona` del frontmatter) y `[:ENLAZA]` (enlaces
  relativos entre documentos en el cuerpo).
- El importer reconstruye el grafo completo en cada ejecucion (idempotente): `DETACH DELETE` +
  recarga desde los `.md`.

## Sincronizacion

Tras crear, mover o renombrar documentos de `.ops`, re-sincroniza el indice (requiere Memgraph
corriendo; el importer resuelve el destino como `--bolt` si viene, si no `MEMGRAPH_BOLT_PORT`
del `.env` del repo, si no `bolt://localhost:7687` — misma precedencia que el resto del kit):

```
node .github/tools/ops-graph.mjs .ops
```

La salida imprime el destino resuelto y su origen (`MEMGRAPH_BOLT_PORT del .env` o `default`).
Si el repo no tiene Memgraph, omite este paso: el Markdown sigue siendo la fuente.

## Queries utiles

Ejecutalas con el MCP server de Memgraph (`run_cypher_query`, read-only) o con mgconsole:

- Impacto de un documento (todo lo que depende de el, hasta 3 saltos):
  `MATCH (d:Doc {id: 'REQ-001'})<-[r*1..3]-(down) RETURN DISTINCT down.id, down.file`
- Documentos huerfanos (sin aristas):
  `MATCH (d:Doc) OPTIONAL MATCH (d)-[r]-() WITH d, count(r) AS grado WHERE grado = 0 RETURN d.id, d.file`
- Inventario por tipo y estado:
  `MATCH (d:Doc) RETURN d.tipo, d.estado, count(*) AS total ORDER BY d.tipo, d.estado`
- Cadena de trazabilidad de un caso de prueba:
  `MATCH (qt:Doc {id: 'QT-001'})-[:RELACIONA|ENLAZA*1..3]->(origen) RETURN DISTINCT origen.id`
- Criticidad (PageRank via MAGE, tras cargar el modulo del algoritmo):
  `CALL pagerank.get() YIELD node, rank RETURN node.id AS id, rank ORDER BY rank DESC LIMIT 10`

## Memgraph y MAGE (opciones avanzadas)

- Memgraph Community (BSL 1.1) y MAGE (Apache 2.0) son productos externos que el kit referencia
  pero no distribuye: levantalos con Docker siguiendo su documentacion oficial.
- MAGE anade algoritmos (PageRank, betweenness, community detection) utiles para ranking de
  criticidad en auditorias; son opcionales y no forman parte del nucleo del kit.
- Las funciones de grafos dinamicos son Enterprise: no disponibles en la opcion gratuita.
