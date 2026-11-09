---
id: qa-credenciales
tipo: Guide
type: Guide
title: Credenciales de exploracion para QA funcional (release 1)
description: Usuarios de demo por rol, contrasena demo, mapa de rutas y que puede hacer cada rol en ProjectHub.
estado: vigente
dueno: rol:qa
fecha: 2026-11-09T04:20:00Z
updated: 2026-11-09T04:20:00Z
relaciona: [qa-strategy, ops-releases, security-readme]
status: stable
sources: [{ id: rulebook, resource: AGENTS.md, title: AGENTS.md - ProjectHub (estandares de produccion) }]
---

# Credenciales de exploracion para QA funcional (release 1)

Stack de demo dockerizado (REL-002): frontend en `http://localhost:4400`,
API en `http://localhost:8100`. Alternativa de desarrollo: `npm start` en la
raiz y usar `http://localhost:4300`.

> Estas credenciales son de **entornos de demo/prueba** con datos semilla.
> Nunca reutilizar en produccion: el despliegue real exige cambiar
> `AUTH_SECRET` y deshabilitar la contrasena demo (ver README de seguridad).

## Acceso

- URL: `http://localhost:4400` -> boton **Iniciar sesion** (ruta `/login`).
- Contrasena demo para **todos** los usuarios de la tabla:
  **`projecthub-demo`** (config por env `AUTH_CONTRASENA_DEMO`, no cambiar en
  demo para no desalinear este documento).

| Rol | Usuario | Correo | Estado |
|---|---|---|---|
| Admin | Diana Admin | `diana@projecthub.local` | activo |
| Sponsor | Sergio Sponsor | `sergio@projecthub.local` | activo |
| ProjectManager | Paula Manager | `paula@projecthub.local` | activo |
| Analista | Andres Analista | `andres@projecthub.local` | activo |
| Stakeholder | Sofia Stakeholder | `sofia@projecthub.local` | activo |
| ProjectManager + Analista (doble rol) | Daniel Doble | `daniel@projecthub.local` | activo |
| Sponsor (inactivo) | Ivan Inactivo | `ivan@projecthub.local` | inactivo |

- `Ivan Inactivo` NO puede iniciar sesion (403/credenciales invalidas): sirve
  para probar el rechazo de cuentas desactivadas.
- `Daniel Doble` sirve para probar reglas de doble rol (p.ej. acciones de PM
  e informes de Analista con la misma sesion).
- No hay administrador de contrasenas: cada usuario puede cambiar la suya en
  `/perfil` (exige la contrasena actual; politica minima 8 caracteres). Si
  alguien la cambia en demo, restaurarla alli mismo o avisar para re-sembrar
  la BD.

## Mapa de navegacion (rutas de primer nivel del shell)

| Ruta | Vista | Guard | Quien entra |
|---|---|---|---|
| `/` | Dashboard con widgets federados (projects, reports, governance) | - | cualquiera; con sesion muestra datos reales |
| `/login` | Inicio de sesion | - | público |
| `/perfil` | Mi perfil / cambio de contrasena | sesionGuard | cualquier usuario activo |
| `/projects` | Portafolio, detalle de proyecto, etapas, presupuesto, Gantt | sesionGuard | cualquier rol autenticado |
| `/projects/detalle/:id`, `/projects/nuevo`, `/projects/editar/:id` | Detalle/ABM de proyectos | sesionGuard | ver: todos; crear/editar segun matriz |
| `/reports` | Tablero general, presupuesto, widget federado | sesionGuard | cualquier rol autenticado |
| `/admin` | Usuarios, roles y matriz de responsabilidades | sesionGuard + permisoGuard (rol Admin) | **solo Admin**; el resto ve `/sin-permisos` |
| `/governance` | Documentos/entregables y bitacora | sesionGuard | cualquier rol autenticado |
| `/sin-permisos` | Pantalla de acceso denegado | - | público (resultado del guard) |

Si un remote no responde, el shell muestra un fallback en su zona de
contenido y el resto sigue funcionando (degradacion elegante).

## Que puede hacer cada rol (matriz de responsabilidades, 1.5)

Fuente de verdad: `shared-lib/.../domain/matriz-permisos.ts` (el mismo
conjunto de reglas gobierna la UI y los casos de uso del backend). Resumen
del release:

| Accion | Admin | Sponsor | ProjectManager | Analista | Stakeholder |
|---|---|---|---|---|---|
| Ver proyecto/dashboard/reportes | si | si | si | si | si |
| Editar proyecto/etapas/presupuesto (etapas tempranas) | si | no* | si | no | no |
| Avanzar/retroceder etapa (PoC en adelante) | si | si | no | no | no |
| Aprobar entregables (cualquier etapa) | si | si | no | no | no |
| Registrar consumo (Ejecucion/Operacion) | si | no | si | no | no |
| Cancelar proyecto | si | si | no | no | no |
| Cerrar proyecto | si** | no | no | no | no |
| Gestionar usuarios y matriz (`/admin`) | si | no | no | no | no |

- *Sponsor edita solo en Contratos (etapa restrictiva); en etapas tempranas
  el editor es PM/Admin.
- **CerrarProyecto en Cierre: revisar la fila exacta en la matriz si el caso
  de prueba lo requiere; en el release la accion existe y esta gobernada.
- La matriz es por etapa: en `Planteamiento`/`Iniciativa` avanzar etapa es
  Admin/Sponsor/PM; desde `PoC` solo Admin/Sponsor.
- El backend aplica la misma matriz: cualquier intento por API con un rol
  insuficiente responde 409 `PERMISO_DENEGADO`.

## Casos de exploracion sugeridos (smoke QA funcional)

1. Login con cada usuario de la tabla (exitoso con activos; 403 con Ivan).
2. Contraseña incorrecta -> alerta "Correo o contrasena incorrectos."
3. Recarga (F5) en `/projects/detalle/p1` con sesion activa -> vista
   restaurada (sesion persiste).
4. Navegacion del menu: dashboard -> projects -> detalle -> governance ->
   reports -> admin (con Diana) -> logout -> dashboard publico.
5. `/admin` con un rol no Admin (p.ej. Paula) -> `/sin-permisos`.
6. Crear un proyecto de prueba (Paula), crearle etapa y entregable, aprobar
   el entregable con Diana (gate) y avanzar etapa con Diana/Sergio.
7. Logout desde el menu de sesion y verificacion de que las rutas privadas
   redirigen a login.

## Limitaciones conocidas del entorno demo

- Datos semilla compartidos: lo que un explorador cree/modifique lo ven los
  demas; no hay reset automatico (pedir re-sembra si se contamina).
- La API y la BD son de demo: no cargar datos sensibles.
- Cambios de contrasena en demo alteran las credenciales de esta tabla:
  restaurarlos o avisar.

## Registro de verificacion del release (REL-002, 2026-11-09)

- Login por API de los 7 usuarios: 6 activos -> 200 con token; Ivan
  inactivo -> 403.
- remoteEntry.json 200 en 4400-4404; federation.manifest.json con URLs
  directas 440x; GET / y /governance -> 200 (SPA con historial);
  GET /api/proyectos con Bearer -> 200.
- Rutas y guards revisados en shell/src/app/app.routes.ts; matriz extraida
  de shared-lib (matriz-permisos.ts) sin re-implementar reglas.
- Pendiente humano (gate del release): E2E de navegador en 4400 y corrida
  completa del backend al aprobarse; ver .ops/operations/releases.md
  (REL-002).
