---
id: DEC-005
title: Adoptar Angular Material como base de la capa de UI
description: Angular Material 22 (MIT, sin chequeo de licencia en runtime) reemplaza la capa HTML/SCSS propia como base de componentes de ProjectHub.
estado: Aprobada
dueno: Usuario
fecha: 2026-11-06
updated: 2026-11-06
relaciona: DEC-001, DEC-003, DEC-004
status: accepted
---

# DEC-005: Adoptar Angular Material como base de la capa de UI

## Pregunta

Sobre que libreria de componentes se construye la capa de presentacion de ProjectHub tras descartar PrimeNG (DEC-004)?

## Contexto

- DEC-004 descarto PrimeNG porque exige licencia PrimeUI con banner visible "Invalid PrimeUI License" en runtime sin clave.
- El usuario ordeno (2026-11-06) una actividad completa de migracion hacia Angular Material (https://material.angular.dev/), despues de confirmar que el limite es "no introducir componentes que requieran licencia".
- Angular Material es Apache-2.0 (MIT-compatible); no ejecuta chequeo de licencia en runtime ni muestra banners.
- `@angular/material@22.2.6` y `@angular/cdk@22.2.6` existen y soportan Angular 22.

## Opciones consideradas

1. **Mantener HTML/SCSS propio.** Viable pero descartada: el usuario ordeno explicitamente migrar a Material y el coste marginal por control nuevo sigue siendo alto.
2. **Readoptar PrimeNG con clave Community.** Rechazada: exige cuenta/licencia externa, fuera de los limites del proyecto.
3. **Adoptar Angular Material.** Aceptada: licencia Apache-2.0, sin banners, componentes maduros (table, form-field, dialog, select, chips, snackbar, toolbar), accesibilidad integrada, theming por tokens CSS.

## Resolucion

- **Angular Material 22 es la base de la capa de presentacion.** Se instala en `ui-lib` y en los 5 apps (shell, mfe-projects, mfe-reports, mfe-admin, mfe-governance) como dependencia directa.
- `@projecthub/ui` sigue siendo la unica puerta de entrada: sus componentes `ph-*` se re-construyen sobre Material (mat-table, mat-form-field, chips, icon, etc.) manteniendo el barrel publico (`public-api.ts`) y los selectores/inputs existentes para no romper a los remotes.
- El Gantt y las graficas siguen siendo propios (SVG/CSS), como ya estaba decidido (6.4).
- Los componentes Material se usan SOLO dentro de ui-lib. Los remotes no importan `@angular/material` por ruta profunda: consumen `@projecthub/ui` por su barrel.
- Theming: tema Material prebuilt + tokens `--ph-*` en variables SCSS compartidas (`_theme.scss`) para mantener la identidad visual de ProjectHub.

## Consecuencias

- Sin chequeos de licencia ni banners en runtime.
- Nuevas dependencias: `@angular/material`, `@angular/cdk` (+ `@angular/animations` incluido en core 22). Singletons compartidos: `@angular/material` y `@angular/cdk` deben ir a `sharedLibraries` en federation.config.mjs de cada app y a `federation.manifest.json` del shell para compartir una sola instancia.
- Los remotes y el shell NO cambian su API de consumo (barrel `@projecthub/ui` estable). El impacto se concentra en ui-lib.
- La vista editable de matriz de responsabilidades (1.5) en mfe-admin usa selects propios que pueden migrar a Material en una fase posterior, siempre via ui-lib.
