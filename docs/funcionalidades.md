# Funcionalidades — ProjectHub

Desglose completo de lo que queremos construir e implementar. Este documento es la fuente de verdad del alcance: se actualiza cuando cambia el alcance, antes de tocar código.

Estado: `☐` pendiente · `◐` en progreso · `☑` hecho

## 1. Gestión de usuarios, roles y responsabilidades

- ☐ 1.1 Modelo de usuario: nombre, correo (único, con formato válido), roles, estado activo/inactivo.
- ☐ 1.2 Roles del sistema: Admin, Sponsor, Project Manager, Analista, Stakeholder.
- ☐ 1.3 CRUD de usuarios: crear, editar, desactivar (sin borrar, para conservar historial).
- ☐ 1.4 Asignación de uno o más roles por usuario.
- ☐ 1.5 Matriz de responsabilidades: qué acciones puede hacer cada rol en cada etapa del ciclo de vida (visible y editable como configuración).
- ☐ 1.6 Sesión simulada: selector de usuario activo en el shell; el usuario activo determina todos los permisos.
- ☐ 1.7 Guards de ruta por rol/permiso; vista de "sin permisos" y ocultamiento de acciones no permitidas en la UI.
- ☐ 1.8 Un usuario inactivo no puede ser usuario activo ni responsable/patrocinador en formularios.

## 2. Iniciativas y proyectos

- ☐ 2.1 Crear iniciativa/proyecto: nombre (único), descripción, patrocinador, presupuesto estimado, fecha objetivo. Nace en etapa Planteamiento.
- ☐ 2.2 Listado del portafolio: tabla con nombre, patrocinador, etapa actual, % de avance, presupuesto, estado.
- ☐ 2.3 Filtros por etapa y estado; búsqueda por nombre (parcial, insensible a mayúsculas).
- ☐ 2.4 Detalle del proyecto: descripción, etapas, Gantt, presupuesto, bitácora.
- ☐ 2.5 Edición de proyecto (nombre, descripción, fecha objetivo) con nombre único.
- ☐ 2.6 Cancelar proyecto (solo Admin/Sponsor, desde cualquier etapa distinta de Cierre); proyecto cancelado no admite transiciones.
- ☐ 2.7 Cerrar proyecto (solo Admin/Sponsor, desde Cierre); proyecto cerrado es de solo lectura.

## 3. Ciclo de vida del proyecto

- ☐ 3.1 Etapas del ciclo de vida: Planteamiento → Iniciativa → PoC → Validación de PoC → Planeación → Contratos → Ejecución → Operación → Cierre.
- ☐ 3.2 Grafo de transiciones válidas codificado y testeado; la UI no permite transiciones fuera del grafo.
- ☐ 3.3 Retrocesos permitidos solo: PoC → Iniciativa y Validación de PoC → PoC (PoC no validada).
- ☐ 3.4 Transición con validación de rol (según matriz de responsabilidades) y de estado del proyecto.
- ☐ 3.5 Bitácora de transiciones: quién, cuándo, etapa origen → destino, comentario opcional.
- ☐ 3.6 Estados del proyecto: Activo, Cancelado, Cerrado.

## 4. Planificación: etapas de trabajo

- ☐ 4.1 Crear etapas de trabajo dentro de un proyecto: nombre, fechas inicio/fin, responsable, presupuesto asignado.
- ☐ 4.2 Editar y eliminar etapas (con confirmación) mientras el proyecto no esté en Ejecución, Operación o Cierre.
- ☐ 4.3 Registro de avance (%) por etapa (0–100).
- ☐ 4.4 Avance del proyecto calculado como promedio ponderado por duración de etapas (nunca editable a mano).
- ☐ 4.5 Validaciones: fin ≥ inicio, presupuesto ≥ 0, responsable activo.

## 5. Presupuestos

- ☐ 5.1 Presupuesto asignado por etapa de trabajo.
- ☐ 5.2 Presupuesto total del proyecto = suma de etapas (calculado).
- ☐ 5.3 Registro de consumo por etapa (valor acumulado editable por etapa).
- ☐ 5.4 Vista de presupuesto: asignado vs. consumido vs. desviación, por etapa y total del proyecto.
- ☐ 5.5 Alerta visual cuando el consumo supera el asignado.

## 6. Diagramas Gantt

- ☐ 6.1 Gantt por proyecto: barras de etapas en línea de tiempo, proporcionales a fechas.
- ☐ 6.2 Eje temporal con marcas (días/semanas según el rango) y etiquetas de etapa.
- ☐ 6.3 Barra muestra avance de la etapa (relleno proporcional).
- ☐ 6.4 Implementación propia (SVG/CSS) en la librería de UI, sin librerías de terceros.
- ☐ 6.5 (Futuro) Dependencias entre etapas (fin-inicio) con flechas.

## 7. Reportes y diagramas

- ☐ 7.1 Resumen del portafolio: conteo de proyectos por etapa y por estado.
- ☐ 7.2 Avance por proyecto (ranking).
- ☐ 7.3 Presupuesto asignado vs. consumido por proyecto.
- ☐ 7.4 Reportes de solo lectura, recalculados a partir del estado actual (nunca editables a mano).
- ☐ 7.5 (Futuro) Exportación de reportes (CSV/PDF).

## 8. Arquitectura y federación

- ☑ 8.1 Arquitectura multirepo (DEC-003): un repositorio Git por desarrollo — `shell` (host, 4200), `mfe-projects` (4201), `mfe-reports` (4202), `mfe-admin` (4203), `mfe-governance` (4204), `@projecthub/shared`, `@projecthub/ui`, `deploy` (docker/compose) y `backend` (futuro, 10.3). Cada repo con su propio `.git`, `package.json` y `angular.json`; las libs se consumen por paquete npm (`file:` en dev); el workspace raíz solo orquesta scripts. Puertos físicos desplazados por ocupación del rango (DEC-001): dev 4300-4304, Docker 4400-4404; 4200-4204 queda como contrato lógico. *(Implementado 2026-11-05: 7 repos + deploy + backend placeholder; builds y smoke verificados.)*
- ☑ 8.2 Native Federation: `federation.manifest.json` en el shell con los 4 remotes; `remoteEntry.json` en cada remote. *(Implementado 2026-11-05: manifest en `shell/public/`, remotes en 4301-4304 dev y 4401-4404 Docker.)*
- ☑ 8.3 Singletons compartidos: `@angular/*`, `rxjs`, `@projecthub/shared`, `@projecthub/ui`. *(Parcial 2026-11-05: `@angular/*`, `rxjs`, `tslib` ya viajan como singletons con `strictVersion` en los remoteEntry; `@projecthub/shared` y `@projecthub/ui` se agregarán al shared config cuando las apps empiecen a importarlas.)*
- ☐ 8.4 Store único (`ProjectStore`) compartido entre shell y los cuatro MFEs (signals + InjectionToken).
- ☐ 8.5 Widget `ProjectSummaryWidget` expuesto por `mfe-projects` y consumido por `mfe-reports` (remote a remote).
- ☐ 8.6 Dashboard del shell que compone widgets de los cuatro remotes.
- ☐ 8.7 Las apps no se importan entre sí por ruta de archivo; toda comunicación pasa por federación o `@projecthub/shared`.

## 9. Librerías compartidas

- ☐ 9.1 `@projecthub/shared`: modelos (proyecto, etapa, presupuesto, usuario, rol, bitácora), grafo de ciclo de vida, matriz de permisos, cálculos (avance, presupuesto), stores, datos semilla.
- ☐ 9.2 `@projecthub/ui`: data-table, form-field, stage-badge, permission-banner, gantt-chart, summary-widget; variables SCSS compartidas.
- ☐ 9.3 Errores de dominio tipados (transición inválida, permiso denegado, validación) con mensajes en español.

## 10. Datos semilla y demo

- ☐ 10.1 Estado en memoria con signals; sin backend en esta fase.
- ☐ 10.2 Datos semilla: ≥6 usuarios (uno por rol + uno con doble rol), ≥5 proyectos en ≥4 etapas distintas, ≥2 etapas de trabajo en proyectos en ejecución, consumos parciales.
- ☐ 10.3 (Futuro) Persistencia real (backend/API) y autenticación real.

## 11. Calidad y verificación

- ☐ 11.1 Tests unitarios de dominio: grafo de transiciones, matriz de permisos, cálculo de avance ponderado, cálculo de presupuesto, guards, stores.
- ☐ 11.2 Tests de renderizado de componentes de UI (data-table, gantt, badges).
- ☐ 11.3 TypeScript estricto; sin `any` implícito, `@ts-ignore` ni `--force`.
- ☐ 11.4 Build, tests y lint en verde para todos los proyectos.
- ☐ 11.5 Verificación de federación: shell + 4 remotes levantados, `remoteEntry.json` responden 200, navegación y widget remote-a-remote funcionando. *(Verificación base hecha 2026-11-05 en dev 4300-4304 y Docker 4400-4404: remoteEntry 200, navegación, F5 en ruta profunda, consola limpia; falta el widget remote-a-remote.)*

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

## Fuera de alcance por ahora

- Backend, API, base de datos, autenticación real (10.3).
- Persistencia entre recargas.
- Notificaciones, correos, integraciones externas.
- Multi-idioma (la UI es en español).
- Multi-tenant.
