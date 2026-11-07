---
id: project-session-support
tipo: Guide
type: Guide
title: Soporte de sesion - restricciones del propietario
description: Restricciones y politicas operativas dadas por el propietario para todas las sesiones; el agente las consulta al abrir sesion.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-07T04:45:00Z
updated: 2026-11-07T04:45:00Z
relaciona: [project-handoff, dev-command-safety]
status: stable
---

Documento de soporte del agente: condensa instrucciones del propietario que rigen como se
trabaja en cada sesion (no que se construye). El agente lo lee al abrir sesion.

## Restricciones operativas (orden del propietario, 2026-11-07)

1. **Pruebas unitarias: peso razonable, no ceremonia.** Los tests existen y toda regla de
   negocio nueva lleva su test (regla del rulebook), pero la ejecucion masiva de suites es
   costosa en tiempo de desarrollo: preferir corridas de subconjunto (tests de los archivos
   del cambio) sobre suites completas; reservar la corrida completa (todos los repos) para
   cierre de fase o RC. Nunca repetir la misma suite completa dos veces en una misma sesion
   sin un cambio de codigo en medio.
2. **Prohibido dejar comandos colgando.** Ningun comando sin fin determinista: `ng serve`,
   `pytest --watch`, watchers y servidores de larga vida solo si el flujo los exige y con
   tiempo maximo de 10 minutos; preferir `uvicorn` en background con log a archivo
   (patron de `_servelogs/`), builds con `initial_wait` acotado y lectura por log. Un
   terminal bloqueado es un problema conocido; se evita, no se depura.
3. **Evidencia ligera pero real.** La evidencia sigue siendo obligatoria (salida observable
   o log mas sonda externa, per command-safety.md), pero se elige el camino de verificacion
   mas barato que la prueba: sonda HTTP unica en vez de suite, log de build en vez de
   re-ejecucion, smoke de un stack en vez de los dos salvo cierre de fase.

## Como aplicarlo en sesion

- Antes de lanzar `npm test` completo: preguntar si el cambio toco dominio compartido (si no,
  testear solo los specs tocados).
- Builds: solo los repos tocados, en orden de dependencia; suite completa solo al cerrar fase.
- Servidores para E2E: levantar con salida a `_servelogs/` o background con log, verificar
  con sonda curl, y detenerlos (Stop-Process por PID) al terminar la verificacion.
- No dejar watchers activos al cerrar la sesion.

## Aprendizajes fase 14.5 (2026-11-07)
- Servicios: el token SIEMPRE se lee de TokenAlmacen (fuente de verdad), nunca
  del signal espejo; el signal solo se refresca por metodos del servicio.
- Specs Angular: correr con `npx ng test --watch=false` (CI=true). Vitest crudo
  falla con "describe is not defined" (sin TestBed): 20 falsos fallos.
- Docker: @projecthub/shared es singleton federado que entrega el HOST; un fix
  de shared-lib exige reconstruir SOLO la imagen shell (remotes consumen la
  copia del host en runtime). Compose devuelve exit 1 por progreso en stderr:
  verificar con docker images/docker ps.
- Lint: ningun repo tiene script lint (el build estricto cubre tipos).
- Login API: campo del body es `contrasena` (no `password`); nginx shell no
  proxia /api (POST cae en SPA fallback -> 405). Brecha API-en-compose queda
  como trabajo pendiente en handoff.md.
