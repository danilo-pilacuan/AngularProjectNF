---
id: dev-command-safety
tipo: Guide
type: Guide
title: Politica de proteccion de comandos
description: Reglas para ejecutar comandos con salida observable y evidencia etiquetada por stack; prohibe descartar salida que se necesita observar.
estado: vigente
dueno: rol:agente
fecha: 2026-11-05T20:30:00Z
updated: 2026-11-05T20:30:00Z
relaciona: [development-readme]
status: stable
---

Origen: el rebuild de Docker se lanzo con `2>&1 | Out-Null` mientras se esperaba su
resultado; el comando quedo ciego y sin evidencia. Esta politica lo prohibe.

## Reglas

1. **Prohibido descartar la salida que se espera observar.** Si el resultado de un comando
   es la evidencia (build, test, deploy, smoke), no puede llevar `Out-Null`, `> $null`,
   `2>&1 | Out-Null` ni ningun pipe que descarte stdout/stderr. Verificacion: releer el
   comando antes de lanzarlo; si la salida no queda visible ni en log, no se lanza.
2. **Comandos largos (build, test suite, docker build) van con log a archivo.** Patron
   obligatorio: `... 2>&1 | Tee-Object -FilePath .dev-logs\<tema>.log` y lectura posterior
   con `Get-Content -Tail` o `Select-String`. Verificacion: el log existe y su cola muestra
   el resultado final.
3. **Exit code no sustituye a la salida.** Un exit 0 no prueba nada si la salida se
   descarto; y algunos pipelines (docker compose en PowerShell) devuelven exit codes
   espurios. Verificacion: la evidencia es la salida (o el log) mas una sonda externa
   (HTTP 200, `docker ps`, archivo generado), nunca el exit code solo.
4. **Evidencia etiquetada por stack.** Toda evidencia de ejecucion indica que stack
   verifica: `dev` (4300-4304, npm) o `docker` (4400-4404, compose). Un smoke en un stack
   no verifica el otro. Verificacion: cada linea de PROGRESS.md con evidencia lleva la
   etiqueta.
5. **Procesos de fondo con salida legible.** Un servidor o build en background se lanza
   con salida a log observable; nunca se espera "a ciegas" un resultado que no se puede
   leer. Verificacion: antes de esperar, confirmar donde queda la salida y como leerla.
6. **Version del artefacto antes de juzgar.** Antes de concluir que un stack muestra
   contenido viejo o roto, verificar la antiguedad de la imagen/contenedor
   (`docker images`, `docker ps`) o el hash del build. Verificacion: la conclusion cita
   la antiguedad o el hash observado.

## Checklist

- [ ] Ningun comando de evidencia usa Out-Null ni descarta salida.
- [ ] Builds largos dejaron log en .dev-logs/ y su cola fue leida.
- [ ] La evidencia citada indica stack (dev 4300-4304 / docker 4400-4404).
- [ ] Los procesos de fondo tienen salida a log legible.
- [ ] Las conclusiones sobre stacks citan antiguedad/hash del artefacto.
