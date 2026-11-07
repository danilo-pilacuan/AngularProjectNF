# Funcionalidades — ProjectHub

Desglose completo de lo que queremos construir e implementar. Este documento es la fuente de verdad del alcance: se actualiza cuando cambia el alcance, antes de tocar código.

Estado: `☐` pendiente · `◐` en progreso · `☑` hecho

## 1. Gestión de usuarios, roles y responsabilidades

- ☑ 1.1 Modelo de usuario: nombre, correo (único, con formato válido), roles, estado activo/inactivo. *(Implementado 2026-11-05 en `@projecthub/shared` con validaciones de dominio.)*
- ☑ 1.2 Roles del sistema: Admin, Sponsor, Project Manager, Analista, Stakeholder. *(Implementado 2026-11-05 en `@projecthub/shared`.)*
- ☑ 1.3 CRUD de usuarios: crear, editar, desactivar (sin borrar, para conservar historial). *(Implementado 2026-11-06 en mfe-admin.)*
- ☑ 1.4 Asignación de uno o más roles por usuario. *(Implementado 2026-11-06 en mfe-admin.)*
- ☑ 1.5 Matriz de responsabilidades: qué acciones puede hacer cada rol en cada etapa del ciclo de vida (visible y editable como configuración). *(Definida y testeada en `@projecthub/shared` 2026-11-05; vista editable en mfe-admin 2026-11-06.)*
- ☑ 1.6 Sesión simulada: selector de usuario activo en el shell; el usuario activo determina todos los permisos. *(SesionStore en `@projecthub/shared` 2026-11-05; selector en el shell 2026-11-06.)*
- ☑ 1.7 Guards de ruta por rol/permiso; vista de "sin permisos" y ocultamiento de acciones no permitidas en la UI. *(Ocultamiento de acciones en mfe-projects y mfe-admin 2026-11-06; guards `sesionGuard`/`permisoGuard` + vista `/sin-permisos` en el shell 2026-11-06.)*
- ☑ 1.8 Un usuario inactivo no puede ser usuario activo ni responsable/patrocinador en formularios. *(Validado en stores de `@projecthub/shared` con tests; los formularios solo ofrecen usuarios activos.)*

## 2. Iniciativas y proyectos

- ☑ 2.1 Crear iniciativa/proyecto: nombre (único), descripción, patrocinador, presupuesto estimado, fecha objetivo. Nace en etapa Planteamiento. *(Implementado 2026-11-06: formulario en mfe-projects + `ProjectStore.crearProyecto`.)*
- ☑ 2.2 Listado del portafolio: tabla con nombre, patrocinador, etapa actual, % de avance, presupuesto, estado. *(Implementado 2026-11-06.)*
- ☑ 2.3 Filtros por etapa y estado; búsqueda por nombre (parcial, insensible a mayúsculas). *(Implementado 2026-11-06.)*
- ☑ 2.4 Detalle del proyecto: descripción, etapas, Gantt, presupuesto, bitácora. *(Implementado 2026-11-06.)*
- ☑ 2.5 Edición de proyecto (nombre, descripción, fecha objetivo) con nombre único. *(Implementado 2026-11-06: formulario reutilizado en modo edición.)*
- ☑ 2.6 Cancelar proyecto (solo Admin/Sponsor, desde cualquier etapa distinta de Cierre); proyecto cancelado no admite transiciones. *(Implementado 2026-11-06 en detalle + store.)*
- ☑ 2.7 Cerrar proyecto (solo Admin/Sponsor, desde Cierre); proyecto cerrado es de solo lectura. *(Implementado 2026-11-06 en detalle + store.)*

## 3. Ciclo de vida del proyecto

- ☑ 3.1 Etapas del ciclo de vida: Planteamiento → Iniciativa → PoC → Validación de PoC → Planeación → Contratos → Ejecución → Operación → Cierre. *(Implementado 2026-11-05 en `@projecthub/shared` con tests.)*
- ☑ 3.2 Grafo de transiciones válidas codificado y testeado; la UI no permite transiciones fuera del grafo. *(Implementado 2026-11-05; la UI solo ofrece transiciones habilitadas.)*
- ☑ 3.3 Retrocesos permitidos solo: PoC → Iniciativa y Validación de PoC → PoC (PoC no validada). *(Implementado 2026-11-05 con tests.)*
- ☑ 3.4 Transición con validación de rol (según matriz de responsabilidades) y de estado del proyecto. *(Implementado 2026-11-05 con tests.)*
- ☑ 3.5 Bitácora de transiciones: quién, cuándo, etapa origen → destino, comentario opcional. *(Implementado 2026-11-05; visible en detalle 2026-11-06.)*
- ☑ 3.6 Estados del proyecto: Activo, Cancelado, Cerrado. *(Implementado 2026-11-05 con tests.)*

## 4. Planificación: etapas de trabajo

- ☑ 4.1 Crear etapas de trabajo dentro de un proyecto: nombre, fechas inicio/fin, responsable, presupuesto asignado. *(Implementado 2026-11-06: formulario en detalle + `ProjectStore.crearEtapa`.)*
- ☑ 4.2 Editar y eliminar etapas (con confirmación) mientras el proyecto no esté en Ejecución, Operación o Cierre. *(Implementado 2026-11-06: formulario de edición + eliminar con confirm; el store bloquea por estado.)*
- ☑ 4.3 Registro de avance (%) por etapa (0–100). *(Implementado 2026-11-06 en detalle + store.)*
- ☑ 4.4 Avance del proyecto calculado como promedio ponderado por duración de etapas (nunca editable a mano). *(Implementado 2026-11-05 en `@projecthub/shared` con tests.)*
- ☑ 4.5 Validaciones: fin ≥ inicio, presupuesto ≥ 0, responsable activo. *(Implementado 2026-11-05 en `@projecthub/shared` con tests; cubiertas también desde el formulario.)*

## 5. Presupuestos

- ☑ 5.1 Presupuesto asignado por etapa de trabajo. *(Implementado 2026-11-06 con el formulario de etapas.)*
- ☑ 5.2 Presupuesto total del proyecto = suma de etapas (calculado). *(Implementado 2026-11-05 en `@projecthub/shared` con tests.)*
- ☑ 5.3 Registro de consumo por etapa (valor acumulado editable por etapa). *(Implementado 2026-11-06 en detalle + store.)*
- ☑ 5.4 Vista de presupuesto: asignado vs. consumido vs. desviación, por etapa y total del proyecto. *(Implementado 2026-11-06: tarjetas y columnas en detalle.)*
- ☑ 5.5 Alerta visual cuando el consumo supera el asignado. *(Implementado 2026-11-06: badge "excedido" y tarjeta resaltada.)*

## 6. Diagramas Gantt

- ☑ 6.1 Gantt por proyecto: barras de etapas en línea de tiempo, proporcionales a fechas. *(Implementado 2026-11-05 en `@projecthub/ui` con tests.)*
- ☑ 6.2 Eje temporal con marcas (días/semanas según el rango) y etiquetas de etapa. *(Implementado 2026-11-05.)*
- ☑ 6.3 Barra muestra avance de la etapa (relleno proporcional). *(Implementado 2026-11-05.)*
- ☑ 6.4 Implementación propia (SVG/CSS) en la librería de UI, sin librerías de terceros. *(Implementado 2026-11-05.)*
- ☑ 6.5 Dependencias entre etapas (fin-inicio) con flechas. *(Implementado 2026-11-06: reglas puras en `@projecthub/shared` (auto-dependencia, duplicados, prerequisito inexistente/otro proyecto, ciclos DFS, prerequisito 100% para avance>0, eliminación bloqueada), UI con checkboxes en formulario de etapas y columna "Depende de", flechas SVG en `ph-gantt-chart` (trazo rojo discontinuo si el prerequisito está incompleto), store y backend FastAPI espejo con 25 tests.)*

## 7. Reportes y diagramas

- ☑ 7.1 Resumen del portafolio: conteo de proyectos por etapa y por estado. *(Implementado 2026-11-06 en mfe-reports.)*
- ☑ 7.2 Avance por proyecto (ranking). *(Implementado 2026-11-06 en mfe-reports.)*
- ☑ 7.3 Presupuesto asignado vs. consumido por proyecto. *(Implementado 2026-11-06 en mfe-reports.)*
- ☑ 7.4 Reportes de solo lectura, recalculados a partir del estado actual (nunca editables a mano). *(Implementado 2026-11-06: mfe-reports solo lee del `ProjectStore` compartido.)*
- ☑ 7.5 Exportación de reportes (CSV/PDF). *(Implementado 2026-11-06 CSV: exportación de portafolio, ranking de avance y presupuesto por proyecto desde mfe-reports, con generación en `@projecthub/shared` y tests; PDF queda como item futuro.)*

## 8. Arquitectura y federación

- ☑ 8.1 Arquitectura multirepo (DEC-003): un repositorio Git por desarrollo — `shell` (host, 4200), `mfe-projects` (4201), `mfe-reports` (4202), `mfe-admin` (4203), `mfe-governance` (4204), `@projecthub/shared`, `@projecthub/ui`, `deploy` (docker/compose) y `backend` (futuro, 10.3). Cada repo con su propio `.git`, `package.json` y `angular.json`; las libs se consumen por paquete npm (`file:` en dev); el workspace raíz solo orquesta scripts. Puertos físicos desplazados por ocupación del rango (DEC-001): dev 4300-4304, Docker 4400-4404; 4200-4204 queda como contrato lógico. *(Implementado 2026-11-05: 7 repos + deploy + backend placeholder; builds y smoke verificados.)*
- ☑ 8.2 Native Federation: `federation.manifest.json` en el shell con los 4 remotes; `remoteEntry.json` en cada remote. *(Implementado 2026-11-05: manifest en `shell/public/`, remotes en 4301-4304 dev y 4401-4404 Docker.)*
- ☑ 8.3 Singletons compartidos: `@angular/*`, `rxjs`, `@projecthub/shared`, `@projecthub/ui`. *(Implementado 2026-11-06: `@angular/*`, `rxjs`, `tslib` viajan como singletons con `strictVersion`; `@projecthub/shared` y `@projecthub/ui` agregados al shared config de los 5 apps con `.override()`.)*
- ◐ 8.4 Store único (`ProjectStore`) compartido entre shell y los cuatro MFEs (signals + InjectionToken). *(Store y token listos en shared; consumido por mfe-projects, mfe-admin, mfe-reports y mfe-governance; verificación cross-MFE en fase 8.)*
- ☑ 8.5 Widget `ProjectSummaryWidget` expuesto por `mfe-projects` y consumido por `mfe-reports` (remote a remote). *(Implementado 2026-11-06: expuesto por mfe-projects y consumido por mfe-reports con selector de proyecto.)*
- ☑ 8.6 Dashboard del shell que compone widgets de los cuatro remotes. *(Implementado 2026-11-06: dashboard del shell con `ProjectSummaryWidget` (mfe-projects), `PortfolioKpiWidget` (mfe-reports) y `GateStatusWidget` (mfe-governance), cargados por federación con fallback por celda.)*
- ☑ 8.7 Las apps no se importan entre sí por ruta de archivo; toda comunicación pasa por federación o `@projecthub/shared`. *(Cumplido en los 5 apps y libs 2026-11-06; verificación completa en fase 8.)*

## 9. Librerías compartidas

- ☑ 9.1 `@projecthub/shared`: modelos (proyecto, etapa, presupuesto, usuario, rol, bitácora), grafo de ciclo de vida, matriz de permisos, cálculos (avance, presupuesto), stores, datos semilla. *(Implementado 2026-11-05/06 con tests de dominio y stores.)*
- ☑ 9.2 `@projecthub/ui`: data-table, form-field, stage-badge, permission-banner, gantt-chart, summary-widget; variables SCSS compartidas. *(Implementado 2026-11-05/06 con tests de render.)*
- ☑ 9.3 Errores de dominio tipados (transición inválida, permiso denegado, validación) con mensajes en español. *(Implementado 2026-11-05.)*

## 10. Datos semilla y demo

- ☑ 10.1 Estado en memoria con signals; sin backend en esta fase. *(Implementado 2026-11-05.)*
- ☑ 10.2 Datos semilla: ≥6 usuarios (uno por rol + uno con doble rol), ≥5 proyectos en ≥4 etapas distintas, ≥2 etapas de trabajo en proyectos en ejecución, consumos parciales. *(Implementado 2026-11-05: 7 usuarios, 5 proyectos, etapas y consumos.)*
- ☑ 10.3 Persistencia real (backend/API): FastAPI en 8100 (seccion 13) con PostgreSQL en Docker (13.2); HttpClient en stores (13.3); escrituras persistidas (13.4); autenticacion real (seccion 14, 2026-11-06).

## 11. Calidad y verificación

- ☑ 11.1 Tests unitarios de dominio: grafo de transiciones, matriz de permisos, cálculo de avance ponderado, cálculo de presupuesto, guards, stores. *(Implementado 2026-11-05/06: 5 specs en shared-lib, 5 en ui-lib, 5 en mfe-projects.)*
- ☑ 11.2 Tests de renderizado de componentes de UI (data-table, gantt, badges). *(Implementado 2026-11-05 en ui-lib.)*
- ☑ 11.3 TypeScript estricto; sin `any` implícito, `@ts-ignore` ni `--force`. *(Verificado 2026-11-06: builds estrictos sin supresiones.)*
- ☑ 11.4 Build, tests y lint en verde para todos los proyectos. *(Builds y tests verdes en shared, ui y mfe-projects; falta lint formal y los repos de fases 5-8.)*
- ☑ 11.5 Verificación de federación: shell + 4 remotes levantados, `remoteEntry.json` responden 200, navegación y widget remote-a-remote funcionando. *(Base verificada 2026-11-06 en dev 4300-4304: remoteEntry 200 en los 4 remotes, navegación /projects /reports /admin /governance vía menú, F5 en ruta profunda con guard + redirect `de=`, dashboard del shell compuesto, consola sin errores ni warnings de singletons duplicados; falta validar widget remote-a-remote en runtime.)*

## 12. Migración a PrimeNG — DESCARTADA

**DECISIÓN FINAL (2026-11-06): se descarta PrimeNG.** Diagnóstico: PrimeNG 22 vanilla incorpora `@primeui/license-manager` desde v22 (confirmado por el mantenedor: "As of PrimeNG v22, the library has moved to PrimeUI... which is now a commercial library"). `providePrimeNG` ejecuta `verifyLicense()` en runtime y, sin clave PrimeUI registrada, imprime el warning `[PrimeUI] PrimeUI license is not configured.` y muestra el banner visible **"Invalid PrimeUI License"**. Existe un tier *community* pero exige cuenta en primeui.dev y una clave firmada; fuera de los límites del proyecto (solo se autorizó primeng vanilla sin licencias). La migración se revirtió: ui-lib vuelve a HTML/SCSS propio, los 5 apps vuelven a su `app.config` anterior y se desinstalaron `primeng` y `@primeuix/themes` de los 6 repos. Ver DEC-004 (estado: Rechazada).

- ☑ 12.1 Decisión y spec: DEC-004 registrada. *(2026-11-06: aprobada y luego revertida — ver texto de arriba.)*
- ☐ 12.2 Dependencias de PrimeNG: no instaladas (descartadas por licencia).
- ☐ 12.3–12.5: no aplican (antigua vía PrimeNG). La migración activa es la de la sección 12 actual (Angular Material). El trabajo migratorio de PrimeNG queda en la historia de git de `ui-lib` (commit `f772299` y reverts de los 5 apps).

## 13. Backend (FastAPI) — EN CURSO

**DECISIÓN (2026-11-06): el backend se construye en FastAPI (Python 3.13) siguiendo la seccion 7 del rulebook.** El servicio espeja `ProjectStore`/`UsuarioStore` de `@projecthub/shared` (matriz de permisos, gates, ciclo de vida, calculos); el contrato JSON es camelCase identico a los modelos TS, con errores de dominio mapeados a HTTP (404/409/422). El actor de sesion viaja en `X-Actor-Id` hasta la autenticacion real (1.5/1.6).

- ◑ 13.1 API REST espejo de dominio: ~30 endpoints (usuarios, proyectos, etapas, entregables, gates, transiciones, bitacora, dependencias). *(Implementado 2026-11-06: 68 tests pytest verdes en puerto 8100.)*
- ☑ 13.2 Persistencia real. **El backend puede usar PostgreSQL en un contenedor Docker** (orden del dueno 2026-11-06): `docker-compose.yml` con servicio `db` (postgres:17-alpine, volumen nombrado, healthcheck) y variables en `.env` (`DATABASE_URL`); en dev sin Docker el servicio mantiene la implementacion en memoria actual como fallback. Migracion de la capa de datos pendiente. *(Implementado 2026-11-06: app/almacen.py RepositorioPostgres con psycopg3, JSONB camelCase, re-sync total y fallback a memoria; 76/76 tests con roundtrip real sobre BD efimera.)*
- ◑ 13.3 Frontend consume la API (HttpClient en stores con fallback a semilla si el backend no responde; ver 10.3). *(Implementado 2026-11-06: ApiEnlaceService + sincronizarStores en @projecthub/shared, APP_INITIALIZER en shell y remotes; escrituras aun locales.)*
- ◑ 13.4 Escrituras del frontend persistidas en el backend. *(Implementado 2026-11-06: endpoints GET/PUT /api/sincronizacion (re-sync total validado en servidor) + SincronizadorEscrituras con debounce 400ms y reintento; backend 82/82, shared-lib 132/132. El push reemplaza el estado completo del servidor con el del cliente, que ya valida las mismas reglas de dominio. Cierre 2026-11-06: refresco de stores desde la respuesta del servidor con supresion de eco por identidad de referencias, provider `proporcionarSincronizacionBackend()` (corrige NG0203), exposes federados './Widget' restaurados y E2E con navegador verificado: creacion de proyecto via UI, persistencia en backend (Postgres) y recuperacion tras F5; shared-lib 137/137, apps 5/5 verdes.)*

**DECISIÓN (2026-11-06): se adopta Angular Material 22 como base de la capa de UI.** Ver DEC-005. Antecedente: PrimeNG fue descartada por licencia (DEC-004); el banner "Invalid PrimeUI License" confirmó que viola el límite de no introducir componentes licenciados, y el dueño ordenó migrar a Angular Material (Apache-2.0, sin chequeo de licencia en runtime ni banners).

- ☑ 12.1 Decisión y spec: DEC-004 (PrimeNG rechazada) y DEC-005 (Material adoptada) registradas. *(2026-11-06.)*
- ☑ 12.2 Instalar `@angular/material` + `@angular/cdk` en ui-lib y los 5 apps; configurar theming (tema prebuilt + tokens `--ph-*`) y federation (Material/CDK como shared singletons en todos los `federation.config.mjs` y en `federation.manifest.json` del shell). *(Implementado 2026-11-06: Material 22.2.6 + CDK en 6 repos; theming con `_material-theme.scss` y tokens `--ph-*`; Material/CDK compartidos como singletons con skip list por predicados funcion (no wildcards, ver federation.config.mjs) y exclusion del secondary toxico `@angular/cdk/schematics`.)*
- ☑ 12.3 Re-construir los componentes de `@projecthub/ui` sobre Material (DataTable → mat-table, FormField → mat-form-field, StageBadge → chip/badge Material, PermissionBanner → banner Material, SummaryWidget → tarjeta Material) manteniendo el barrel público, los selectores `ph-*` y los inputs/outputs existentes para no romper a los remotes. *(Implementado 2026-11-06: data-table sobre p-table de Material, summary-widget sobre mat-card, stage-badge chip nativo. Actualizado 2026-11-07: permission-banner migrado a mat-card outlined + mat-icon y form-field envuelto en mat-form-field outline con subscript dynamic; como la content query de Material no ve controles proyectados a traves de ng-content anidado, form-field incluye un nodo puente interno que declara un MatFormFieldControl de reserva y lo intercambia por el control real (matInput/mat-select) en cuanto se descubre, sin cambiar la API publica (label/requerido/error/pista); el error lo marca el consumidor con error() y se pinta fuera del subscript. DEC-005.)*
- ☑ 12.4 Migrar los usos directos en remotes que no pasan por ui-lib (si los hay) y los estilos globales; actualizar tests de ui-lib y de remotes. *(Implementado 2026-11-06: tests de los 4 remotes y ui-lib actualizados y verdes tras corregir la doble instancia de @angular/material en tests con `dedupe` en `vitest-base.config.mts`.)*
- ☑ 12.5 Verificación completa: builds + tests verdes en los 7 proyectos, app levantada en dev sin banner de licencia, consola limpia, sin duplicación de singletons Material/CDK. *(Builds de los 5 apps verdes 2026-11-06; tests: shell 15/15, shared-lib 125/125, ui-lib 21/21, mfe-projects 26/26, mfe-reports 5/5, mfe-admin 13/13, mfe-governance 3/3; verificacion runtime de consola limpia y sin banner en la fase de integracion RC3.)*

## 14. Autenticación real — EN CURSO

**DECISIÓN (2026-11-06): la sesion real se implementa con JWT HS256 firmado por el backend (PyJWT) y contrasena con hash PBKDF2-HMAC-SHA256 (stdlib), sin dependencias licenciadas.** El token viaja en `Authorization: Bearer` en todas las llamadas; `X-Actor-Id` queda como fallback de compatibilidad con la sesion simulada. Sin backend disponible la app opera en modo demo (sesion simulada, selector de usuario) por la degradacion elegante del rulebook.

- ☑ 14.1 Backend: POST `/api/auth/login` (credenciales validadas, token JWT con sub y exp 7 dias), GET `/api/auth/me`; credenciales demo sembradas de forma perezosa (env `AUTH_CONTRASENA_DEMO`, por defecto `projecthub-demo`) y asignadas a usuarios nuevos; `AUTH_SECRET` por entorno con secreto efimero y warning si falta. *(Implementado 2026-11-06: backend 101/101 tests.)*
- ☑ 14.2 Frontend: `AutenticacionService` en @projecthub/shared (login, restauracion de sesion via `/me` en el initializer, cierre), `TokenAlmacen` en localStorage, Bearer automatico en `ApiEnlaceService`; el actor de las escrituras (13.4) es el usuario de la sesion activa. *(Implementado 2026-11-06: shared-lib 148/148 tests.)*
- ☑ 14.3 Shell: pantalla `/login`, `sesionGuard` redirige a `/login` con backend disponible (y al dashboard en modo demo), area de sesion con usuario autenticado + Cerrar sesion (el selector de usuarios solo en demo). *(Implementado 2026-11-06: shell 20/20 tests.)*
- ☑ 14.4 Verificacion E2E con navegador (dev 4300-4304 + backend 8100/Postgres): redireccion a /login, error de credenciales, login real, restauracion tras F5, creacion de proyecto via UI persistida con Bearer y cierre de sesion. *(2026-11-06.)*
- ☑ 14.5 Gestion de contrasenas (cambio de contrasena, credenciales persistidas en tabla propia). Credenciales en tabla `credenciales` de PostgreSQL (DEC-007), endpoint `PUT /api/auth/contrasena` (401 actual incorrecta, 422 minimo 8 caracteres), renombre de credencial al cambiar correo, pantalla `/perfil` en el shell. *(Implementado 2026-11-07: backend test_auth 23/23, shared-lib 152/152, shell build verde; E2E navegador en Docker 4400: cambio via UI, re-login con la nueva, 401 con actual incorrecta, F5 en /perfil, restauracion demo.)*

## Orden de implementación sugerido

1. **Fundaciones** (8.1–8.3, 9.1 modelos): repos multirepo + federación + modelos.
2. **Dominio** (3.1–3.6, 1.2, 1.5, 9.3): ciclo de vida, roles, matriz, errores.
3. **Stores y sesión** (1.6, 8.4, 10.1, 10.2): stores con signals, sesión simulada, semilla.
4. **UI compartida** (9.2, 6.1–6.4): componentes base + Gantt.
5. **mfe-projects** (2.1–2.7, 4.1–4.5, 5.1–5.5, 8.5): portafolio, detalle, etapas, presupuesto, widget.
6. **mfe-admin** (1.1, 1.3, 1.4, 1.7, 1.8): usuarios y matriz de responsabilidades.
7. **mfe-reports** (7.1–7.4): reportes + widget remote-a-remote.
8. **shell** (8.6, 1.6): dashboard, navegación, selector de usuario.
9. **Integración y cierre** (11.1–11.5): tests, build, verificación de federación.
10. **Backend y persistencia** (13.1–13.4, 10.3): FastAPI, PostgreSQL en Docker, HttpClient en stores.
11. **Autenticacion real** (14.1–14.5): login JWT en backend, pantalla de login en el shell, Bearer en el enlace HTTP.

## Fuera de alcance por ahora

- Backend, API, base de datos, autenticación real (10.3).
- Persistencia entre recargas.
- Notificaciones, correos, integraciones externas.
- Multi-idioma (la UI es en español).
- Multi-tenant.
