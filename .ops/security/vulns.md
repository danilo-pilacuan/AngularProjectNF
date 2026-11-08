---
id: security-vulns
tipo: Guide
type: Guide
title: Registro de vulnerabilidades (VULN)
description: Hallazgos de la auditoria de seguridad de la API (2026-11-08); VULN-002/003/004 mitigadas, VULN-001 abierto (requiere decision del propietario).
estado: vigente
dueno: rol:propietario
fecha: 2026-11-08T19:30:00Z
updated: 2026-11-08T21:00:00Z
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
| VULN-002 | 12 endpoints de lectura de dominio responden 200 sin sesion (sin Bearer ni X-Actor-Id): `/api/usuarios`, `/api/proyectos`, `/api/etapas`, `/api/entregables`, `/api/bitacora`, `/api/sincronizacion` y sus variantes | Media | mitigado | Exigir `obtener_actor` en los 12 GET de dominio (solo `/api/salud` y `/api/auth/login` publicos); `ApiEnlaceService.registrarCaida` ya no trata 4xx como caida (modo demo conserva su fallback a semilla y el banner no anuncia caida inexistente). Evidencia: pytest 112/112 (`test_vuln002_mitigado_lecturas_de_dominio_exigen_sesion`), vitest shared-lib 171/171, sondas HTTP 422/200/200 contra 8100 |
| VULN-003 | `/api/auth/login` sin limitacion de intentos: 25 contrasenas erroneas consecutivas procesadas en 1.6 s sin bloqueo ni retardo (fuerza bruta) | Media | mitigado | Limitador en memoria propio (sin dependencias nuevas): ventana fija por correo+IP, 5 fallos en 60 s -> 429 LIMITE_INTENTOS (config `RATE_LIMIT_LOGIN_INTENTOS`/`RATE_LIMIT_LOGIN_VENTANA_SEG`, 0 desactiva); solo cuentan fallos, un exito no acumula. Nota: con varias instancias conviene limitador externo (Redis); pendiente de decision de despliegue. Evidencia: pytest 120/120 (`test_login_limita_intentos_fallidos_responde_429`, 6 tests unitarios del limitador) |
| VULN-004 | CORS con lista fija de origenes localhost sin variable de entorno; un despliegue en dominio real requiere tocar codigo | Baja | mitigado | `ALLOWED_ORIGINS` por env (separada por comas, normaliza barras finales; default con los 6 orígenes de desarrollo/demo intacto) en `app/main.py::_origenes_permitidos`. Evidencia: pytest 130/130 (`test_cors.py`, 5 tests). Despliegue en dominio real: definir ALLOWED_ORIGINS en compose/.env |
