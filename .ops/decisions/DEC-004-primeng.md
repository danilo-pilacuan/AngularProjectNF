---
id: DEC-004
title: Migracion de la capa de UI a PrimeNG como libreria de componentes principal
description: Reemplazar el HTML/SCSS propio de @projecthub/ui por primitivas de PrimeNG, manteniendo la API publica (selectores ph-*) y dejando el Gantt como excepcion en SVG/CSS.
estado: Aprobada
dueno: Usuario
fecha: 2026-11-06
updated: 2026-11-06
relaciona: DEC-001, DEC-003
status: accepted
---

# DEC-004: Migracion de la capa de UI a PrimeNG

## Pregunta

Sobre que libreria de componentes se construye la capa de presentacion de ProjectHub?

## Contexto

- Los componentes de `@projecthub/ui` (DataTable, FormField, StageBadge, PermissionBanner, SummaryWidget, GanttChart) estan construidos con HTML/SCSS propio. Funciona, pero cada control nuevo (tablas con orden/paginacion, selects, dialogs, toasts) implica reimplementar comportamiento y accesibilidad a mano.
- El proyecto es de prueba pero se trabaja con estandares de produccion; una libreria madura reduce el coste de cada pantalla nueva y uniformiza el look and feel.
- El workspace es Angular 22 con Native Federation y singletons estrictos (`@angular/*`, `rxjs`, `@projecthub/shared`, `@projecthub/ui`). Cualquier libreria de UI debe vivir dentro de `@projecthub/ui` para no romper esa frontera.
- Restriccion previa de AGENTS.md: el Gantt y las graficas son propios (SVG/CSS) por decision del proyecto. PrimeNG no ofrece un componente Gantt, por lo que la decision no la afecta; se conserva el Gantt en SVG/CSS.

## Opciones consideradas

1. **Continuar con HTML/SCSS propio.** Control total y cero dependencias, pero alto coste marginal por componente y sin accesibilidad avanzada de serie.
2. **Material (Angular Material).** Madura, pero el look Material no era el buscado y su sistema de theming no escala tan rapido para tablas complejas.
3. **PrimeNG (v22, presets de tema de `@primeuix/themes`).** Componentes listos para produccion (tabla, formularios, mensajes, tags, cards, dialogs), theming por preset con variables CSS, TypeScript estricto, sin dependencias de estilos globales agresivos. Requiere peer `@angular/cdk`.

## Resolucion

- **PrimeNG es la libreria de componentes principal.** Los componentes de `@projecthub/ui` se reconstruyen sobre sus primitivas en lugar de HTML/SCSS propio; los componentes de aplicacion (remotes y shell) consumen `@projecthub/ui`, no PrimeNG directamente (regla de frontera: UI propia vive en `@projecthub/ui`; si una pantalla necesita un control PrimeNG que `@projecthub/ui` no envuelve, se agrega primero como envoltorio en `@projecthub/ui`).
- **API publica estable:** los selectores `ph-*`, inputs/outputs y clases de utilidad se conservan para no reescribir remotes. El usuario final ve componentes PrimeNG, el codigo consume `ph-*`.
- **Theming:** preset `Aura` con `darkModeSelector: 'system'` via `providePrimeNG` en cada app (shell y 4 remotes). Se conservan las clases `ph-*` de utilidad para layout y espaciado.
- **Excepcion Gantt:** GanttChart permanece en SVG/CSS propio (PrimeNG no ofrece Gantt). Queda documentado en docs/funcionalidades.md seccion 12.
- **Versiones:** `primeng@22.x` con peer `@angular/cdk@^22`; presets de `@primeuix/themes` (la rama 22 de primeng ya no usa `@primeng/themes`). Versiones exactas fijadas al instalar en cada repo.
