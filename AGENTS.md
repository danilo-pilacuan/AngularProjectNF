# AGENTS.md — ProjectHub

Workspace Angular con arquitectura de microfrontends (Native Federation). Este archivo define cómo debes trabajar en este repositorio. Léelo al inicio de cada sesión.

## 1. Contexto del proyecto

ProjectHub es un sistema documental y organizacional para gobernar proyectos de software: permite proponer proyectos y avanzarlos por un ciclo de vida completo — planteamiento, iniciativa, prueba de concepto (PoC), validación de PoC, planeación, contratos, ejecución, operación y cierre — con planificación, etapas de trabajo, diagramas Gantt, presupuestos, contratos, reportes y control de usuarios, roles y responsabilidades. Es un proyecto de prueba, pero se trabaja con estándares de producción.

Principio rector: **es un sistema documental**, no solo un tablero de avance. No se avanza de etapa del ciclo de vida sin los entregables obligatorios aprobados y sin las aprobaciones que exige la matriz de responsabilidades. El gate de etapa (checklist de entregables + aprobaciones) es una funcionalidad de primera clase, no un adorno.

### Terminología canónica

Usa estos términos de forma consistente en código, docs y UI; no introduzcas sinónimos nuevos.

- **Proyecto**: agregado central. Es la iniciativa que se gobierna. No existe una entidad "iniciativa" separada: "Iniciativa" es una etapa del ciclo de vida.
- **Etapa del ciclo de vida**: las 9 etapas de gobernanza (Planteamiento … Cierre). Determinan qué se puede hacer y qué se exige para avanzar.
- **Etapa de trabajo**: unidad de planificación dentro de un proyecto (fechas, responsable, presupuesto, avance). Es lo que se dibuja en el Gantt. Nunca la llames "tarea" ni "fase".
- **Entregable**: documento obligatorio de una etapa del ciclo de vida, con versión y aprobación.
- **Gate de etapa**: conjunto de entregables aprobados + aprobaciones requeridas que habilita una transición.
- **Estado del proyecto**: `Activo` | `Cancelado` | `Cerrado`. Distinto de la etapa: un proyecto está en una etapa y además tiene un estado.
- **Bitácora**: registro inmutable y con autor de transiciones, aprobaciones y cambios relevantes (no es un chat ni un campo de notas libre).

### Estructura

```
projecthub/
├── projects/
│   ├── shell/            host (4300) — routing de primer nivel, layout, sesión, dashboard
│   ├── mfe-projects/     remote 1 (4301) — portafolio, proyecto, etapas de trabajo, presupuesto, Gantt
│   ├── mfe-reports/      remote 2 (4302) — reportes y tableros de indicadores
│   ├── mfe-admin/        remote 3 (4303) — usuarios, roles, matriz de responsabilidades, catálogos
│   ├── mfe-governance/   remote 4 (4304) — documentos/entregables, gates, contratos, riesgos, decisiones
│   ├── shared-lib/       @projecthub/shared  (modelos, reglas de dominio, servicios, store)
│   └── ui-lib/           @projecthub/ui      (componentes de presentación)
```

Stack: Angular 22, `@angular-architects/native-federation`, TypeScript estricto, SCSS. 4 SPAs de dominio (remotes) + 1 host.

Relaciones de federación:
- `shell` carga los cuatro remotes mediante `federation.manifest.json` y es dueño del routing de primer nivel (`/projects`, `/reports`, `/admin`, `/governance`).
- `mfe-reports` consume `ProjectSummaryWidget` expuesto por `mfe-projects` (remote a remote).
- El dashboard del shell compone widgets de `mfe-projects`, `mfe-reports` y `mfe-governance`.
- `@angular/*`, `rxjs`, `@projecthub/shared` y `@projecthub/ui` son singletons compartidos y deben quedar en una sola versión en todos los artefactos.
- Los stores de dominio (`ProjectStore` y los que lo acompañen) deben existir como una única instancia entre shell y los cuatro MFEs, resuelta por `InjectionToken`.

## 2. Reglas de trabajo

### Antes de actuar
- Explora el repositorio antes de crear algo nuevo: busca si ya existe un componente, servicio o utilidad que sirva.
- Lee `docs/funcionalidades.md` antes de planificar: es la fuente de verdad del alcance y contiene el glosario, el modelo de datos y las decisiones abiertas. Si la tarea contradice ese documento, avísame antes de ejecutar.
- Si el repositorio ya establece una convención (prefijos, estructura, nombres, puertos, patrón de estado), síguela. No la reinterpretes ni la cambies por tu cuenta.
- No asumas compatibilidades de versiones. Verifica la versión instalada y consulta la documentación o el changelog cuando algo dependa de Angular 22 o de Native Federation.

### Mientras trabajas
- Reutiliza antes que duplicar. Si es UI, Gantt o reporte, va en `ui-lib`; si es lógica, modelo, regla de negocio o estado, va en `shared-lib`.
- La lógica de dominio vive en `shared-lib` una sola vez: cálculo de avance ponderado, validación de transiciones, checklist de gate, sumas y desviaciones de presupuesto, matriz de permisos. Los componentes y remotes **no** reimplementan esas reglas para "mostrarlas".
- Cambios mínimos y enfocados: no refactorices código ajeno a la tarea.
- Cuando cambies un modelo, tipo o enum, busca todos sus usos (`grep`) y propaga el cambio a store, UI, reportes, gates, tests y mocks.
- Toda regla de negocio nueva se acompaña de su test unitario en el mismo cambio. Si una regla no se puede testear, es señal de que está mal ubicada.

### Fronteras entre apps
- Las apps (`shell`, `mfe-*`) **no** se importan entre sí por ruta de archivo. Toda comunicación pasa por federación o por `@projecthub/shared`.
- `@projecthub/shared` y `@projecthub/ui` se consumen solo por su entry point público (barrel). Prohibido importar archivos internos de una lib por ruta profunda.
- Cada remote expone su API pública en federación: rutas (arreglo de rutas, sin `RouterModule.forRoot`) y los widgets documentados en `docs/funcionalidades.md`. Nada más.
- El shell es el único que define rutas de primer nivel y el layout global. Los remotes no navegan a rutas de otros remotes por URL hardcodeada.
- El estado de dominio se lee y escribe solo por los stores inyectados. Prohibido `new ProjectStore()` o mantener copias locales del dominio en componentes.
- Cada remote debe poder levantarse y renderizar por sí solo (con datos semilla) y degradar con elegancia si un dato compartido no está disponible: estado vacío, no excepción.
- Si un remote no carga, el shell muestra un fallback en su zona de contenido y el resto de la aplicación sigue funcionando.
- Las URLs de los remotes vienen de `federation.manifest.json` o de configuración de entorno, nunca de literales en el código.

### Verificación (obligatoria)
Nunca declares una tarea terminada sin evidencia. Según el alcance, ejecuta:
1. Build de los proyectos afectados (y `npm run build` completo antes de cerrar una fase).
2. Tests unitarios de los proyectos afectados.
3. Lint.
4. Para cambios de federación o de shell: levantar host y remotes y comprobar `federation.manifest.json`, `remoteEntry.json` (200), navegación por el menú, recarga directa (F5) en una ruta profunda de un remote, composición del dashboard y consola sin warnings de Angular duplicado ni de singletons.
5. Para cambios de dominio: el test de la regla tocada, incluidos los casos límite (porcentaje fuera de 0–100, fechas invertidas, monto negativo, autor aprobando su propio documento).

Si no puedes ejecutar alguna verificación, dilo explícitamente. No la sustituyas por una afirmación.

### Ante errores
- Lee el error completo, diagnostica la causa raíz y corrige. Itera de forma autónoma.
- No pidas ayuda tras el primer fallo. Intenta resolverlo con las herramientas que tienes.
- Detente y consulta únicamente si: (a) llevas 3 intentos distintos sin avance, (b) la solución exige cambiar una decisión de arquitectura, (c) la acción es destructiva o irreversible, o (d) la instrucción es ambigua de forma que cambia el resultado.
- No silencies errores (`@ts-ignore`, `any`, tests deshabilitados, `--force`) para hacer que algo pase. Si es inevitable, documéntalo y avísame.

### Dependencias
- No agregues dependencias nuevas sin justificarlo. El Gantt y las gráficas son propios (SVG/CSS) por decisión del proyecto.
- Si crees que hace falta una librería, detente y propón la alternativa antes de instalarla.

### Conflictos de instrucciones
Si una instrucción mía contradice una decisión previa del proyecto o una regla de este archivo, avísame del conflicto antes de ejecutar y propón la alternativa. Si confirmo, procede.

### Definición de terminado (DoD)
Una tarea está terminada cuando: compila, pasa lint y tests; la regla de negocio tiene test; la vista cubre estados de carga, vacío, error y sin permisos; respeta la matriz de roles; los textos están en español y las fechas y montos se formatean con `Intl`; y `docs/funcionalidades.md` refleja lo hecho (marcando el ítem y ajustando el alcance si cambió).

## 3. Comunicación

- Respuestas breves: qué hiciste, cómo lo verificaste, qué falta.
- Reporta fallos, supuestos y límites con la misma claridad que los éxitos. No digas "listo" si algo no se verificó.
- Si no recuerdas o no encuentras una decisión previa, dilo; no la inventes.

## 4. Git

- Un commit por tarea o fase, con mensajes en formato convencional (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`).
- No hagas push, no reescribas historia ni borres ramas sin que lo pida.
- No modifiques este archivo sin que lo pida.

## 5. Comandos y puertos de referencia

Ajusta estos comandos a los scripts reales del `package.json` una vez creado el workspace; si difieren, prevalecen los del repositorio.

```bash
npm install
npm run build            # todos los proyectos, en orden de dependencia
npm start                # shell + 4 remotes en paralelo
npm test                 # tests unitarios
npm run lint
```

| App | Puerto |
| --- | --- |
| shell | 4300 |
| mfe-projects | 4301 |
| mfe-reports | 4302 |
| mfe-admin | 4303 |
| mfe-governance | 4304 |

## 6. Alcance y funcionalidades

- El desglose completo de funcionalidades a implementar vive en `docs/funcionalidades.md`. Consúltalo antes de planificar cualquier tarea y mantenlo actualizado cuando cambie el alcance.
- Ese documento incluye una sección de **Decisiones abiertas**. No las resuelvas por tu cuenta: si una tarea depende de una, pregúntame y registra la decisión allí cuando la tome.
- Este repositorio no usa SDD por ahora. Cuando el proyecto entre al agente con flujo SDD, ese agente generará constitución y specs a partir de `docs/funcionalidades.md`; no crees artefactos SDD (constitución, specs, planes, tasks) por tu cuenta.


## 7. Backend
- Se debe hacer un backend, de preferencia en fastapi