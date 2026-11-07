---
id: DEC-007
title: Credenciales en tabla propia fuera del protocolo de sincronizacion
description: La credencial (correo + hash de contrasena) persiste en la tabla credenciales de PostgreSQL, sincronizada con el catalogo de usuarios por el backend; no viaja en el protocolo de sincronizacion (13.3) ni se expone por la API de dominio.
estado: tomada
dueno: rol:propietario
fecha: 2026-11-07
updated: 2026-11-07
relaciona: DEC-006, REQ-003
status: accepted
---

# DEC-007: Credenciales en tabla propia fuera del protocolo de sincronizacion

## Pregunta

Donde y como persiste la credencial (correo + hash) introducida por la fase
14.5 (cambio de contrasena), que no existia cuando se diseno el protocolo de
sincronizacion de la fase 13.3?

## Contexto

- Fase 14.5: el propietario ordeno gestion de contrasenas con credenciales
  persistidas en tabla propia y endpoint de cambio.
- El protocolo 13.3 sincroniza colecciones de dominio (usuarios, proyectos,
  etapas, entregables, bitacora) entre backend y stores por X-Actor-Id/Bearer;
  la credencial nunca debe salir por esa via (contiene hash).
- La resena de credenciales debe seguir al usuario: cambiar el correo en
  administracion debe mover su credencial.

## Opciones consideradas

1. **Columna de hash en la tabla de usuarios.** Descartada: mezcla secreto con
   coleccion expuesta por la API de dominio; obligaria a filtrar el campo en
   cada respuesta.
2. **Credencial como coleccion sincronizada.** Descartada: el protocolo 13.3
   replica colecciones a los stores; la credencial no es dominio visible.
3. **Tabla propia `credenciales(correo text PK, hash text NOT NULL)` en
   PostgreSQL, sincronizada por el backend.** Aceptada.

## Resolucion

- Tabla `credenciales(correo text PK, hash text NOT NULL)` en el mismo esquema
  del backend (PostgreSQL 17, DEC-006), creada por `crear_esquema()`; con
  `DATABASE_URL` vacio opera la implementacion en memoria (fallback de tests).
- Repositorio `RepositorioCredencialesPostgres` con contrato `{listar, guardar,
  eliminar, eliminar_excepto}` (app/almacen.py); el resto del sistema habla con
  `ServicioCredenciales`, nunca con el repositorio directo.
- La credencial queda fuera del protocolo de sincronizacion 13.3 y no se
  expone por la API de dominio; la unica via de cambio es
  `PUT /api/auth/contrasena` con la sesion activa.
- El backend mantiene la resena sincronizada al escribir el estado: `sincronizar_con_usuarios`
  elimina huerfanos y `renombrar` mueve la credencial cuando administracion
  cambia el correo de un usuario.
- Hash sin cambios de fase 14: PBKDF2-HMAC-SHA256 240k iteraciones; demo
  sembrada de forma perezosa con `AUTH_CONTRASENA_DEMO` (por defecto
  `projecthub-demo`).

## Consecuencias

- Cambiar el correo en administracion mueve la credencial; eliminar el usuario
  limpia su credencial (sin huerfanos verificable con tests).
- La tabla es secreto-operacional: no se serializa en respuestas de dominio ni
  en el estado de sincronizacion.
- La restauracion de la demo es operacional (API de cambio), no hay reset de
  credenciales en la UI por ahora.
