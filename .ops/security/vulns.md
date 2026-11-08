---
id: security-vulns
tipo: Guide
type: Guide
title: Registro de vulnerabilidades (VULN)
description: Hallazgos de la auditoria de seguridad de la API (2026-11-08); estados por decidir por el propietario.
estado: vigente
dueno: rol:propietario
fecha: 2026-11-08T19:30:00Z
updated: 2026-11-08T19:30:00Z
relaciona: [security-readme]
status: stable
sources: [{ id: rulebook, resource: AGENTS.md, title: AGENTS.md - ProjectHub (estandares de produccion) }]
---

Auditoria de origen: iteracion 38 (2026-11-08), ejecutada contra la API dockerizada
(localhost:8100, compose demo) y el codigo de `backend/app`. Evidencia completa en
`PROGRESS.md` (iteracion 38) y `backend/tests/test_api.py` (tests VULN-002).

| Id | Hallazgo | Severidad | Estado | Mitigacion |
|---|---|---|---|---|
| VULN-001 | `PUT /api/sincronizacion` permite a cualquier actor autenticado reemplazar el estado completo sin validar la matriz de permisos: escalada de roles (Analista -> Admin) y destruccion de bitacora verificadas por HTTP | Alta | abierto | Validar el diff del estado contra la matriz (cambios de usuarios/roles solo Admin; transiciones y aprobaciones por `exigir_permiso`) o degradar el re-sync total a escrituras por caso de uso |
| VULN-002 | 12 endpoints de lectura de dominio responden 200 sin sesion (sin Bearer ni X-Actor-Id): `/api/usuarios`, `/api/proyectos`, `/api/etapas`, `/api/entregables`, `/api/bitacora`, `/api/sincronizacion` y sus variantes | Media | abierto | Exigir `obtener_actor` en los GET de dominio y auditar los consumidores del frontend (el bootstrap usa sesion real desde fase 14; solo `/api/salud` y `/api/auth/login` quedan publicos) |
| VULN-003 | `/api/auth/login` sin limitacion de intentos: 25 contrasenas erroneas consecutivas procesadas en 1.6 s sin bloqueo ni retardo (fuerza bruta) | Media | abierto | Rate limit por correo+IP (p. ej. slowapi) o backoff exponencial por cuenta; registrar intentos en la bitacora |
| VULN-004 | CORS con lista fija de origenes localhost sin variable de entorno; un despliegue en dominio real requiere tocar codigo | Baja | abierto | `ALLOWED_ORIGINS` por env (backend/.env + compose) manteniendo los valores actuales como default |
