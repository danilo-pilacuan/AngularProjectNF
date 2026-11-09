---
id: DEC-004
title: Migracion de la capa de UI a PrimeNG - DESCARTADA por licencia
description: Se evaluo PrimeNG 22 como base de la capa de UI; se descarta porque exige licencia PrimeUI y el proyecto no puede introducir componentes con requisitos de licencia.
estado: Rechazada
dueno: Usuario
fecha: 2026-11-06
updated: 2026-11-06
relaciona: DEC-001, DEC-003
status: rejected
---

# DEC-004: Migracion de la capa de UI a PrimeNG (descartada)

## Pregunta

Sobre que libreria de componentes se construye la capa de presentacion de ProjectHub?

## Contexto

- Los componentes de `@projecthub/ui` (DataTable, FormField, StageBadge, PermissionBanner, SummaryWidget, GanttChart) estan construidos con HTML/SCSS propio. Funciona; el coste marginal por control nuevo es asumible en el alcance actual.
- El usuario pidio evaluar PrimeNG como base de UI y registrar la decision en el spec de gobierno.
- Durante la verificacion en dev aparecio un banner visible "Invalid PrimeUI License" y el warning de consola `[PrimeUI] PrimeUI license is not configured.`

## Diagnostico (verificado en codigo y fuentes oficiales)

- PrimeNG 22 vanilla incorpora `@primeui/license-manager` (npm, v1.1.0). `providePrimeNG` genera un `ENVIRONMENT_INITIALIZER` que ejecuta `verifyLicense("primeui", ...)`.
- Sin clave, `verifyLicense` responde `status:"unconfigured"`, `valid:false`; PrimeNG entonces llama a `showInvalidLicenseBanner()` (primeng/license.mjs): fija un div con shadow DOM cerrado, esquina inferior derecha, texto "Invalid PrimeUI License".
- El mantenedor de PrimeNG lo confirma publicamente: "As of PrimeNG v22, the library has moved to PrimeUI ... which is now a commercial library" (github.com/orgs/primefaces/discussions/4890). Existe un tier Community, pero exige cuenta en primeui.dev y una clave firmada criptograficamente (Ed25519).
- El banner no es un bug ni una clave mal puesta: es el comportamiento documentado para apps sin clave.

## Opciones consideradas

1. **Mantener PrimeNG y registrar una clave.** Rechazada: exige crear cuenta/licencia externa; fuera de los limites ("no introducir componentes que requieran licencia; si primeng vanilla lo exige, se descarta").
2. **Suprimir el banner por CSS/DOM.** Rechazada: ocultar el aviso de una licencia invalida es eludir una restriccion tecnica; ademas el aviso vive en shadow DOM cerrado y el chequeo sigue activo.
3. **Descartar PrimeNG y revertir a UI propia.** Aceptada.

## Resolucion

- **La capa de UI sigue en HTML/SCSS propio dentro de `@projecthub/ui`.** Los remotes y el shell solo consumen `@projecthub/ui` (sin cambios en fronteras).
- Revertida la migracion: ui-lib vuelve a los componentes `ph-*` con HTML/SCSS propio; los 5 apps vuelven a su `app.config.ts` previo; desinstalados `primeng` y `@primeuix/themes` de los 6 repos; los `federation.config.mjs` y `vitest-base.config.mts` vuelven a su estado previo (via reverts de git).
- **Via de readopcion** (solo si el dueno registra una clave PrimeUI): instalar `primeng@22.x` + `@primeuix/themes`, llamar `registerLicense({ primeui: <clave> })` en el arranque de cada app, repetir 12.2-12.5 de docs/funcionalidades.md. El trabajo migratorio se conserva en la historia de git (ui-lib `f772299` y los reverts de los 5 apps).
- El Gantt y las graficas siguen siendo propios (SVG/CSS), como ya estaba decidido.

## Consecuencias

- El banner desaparece (no hay chequeo de licencia en el bundle).
- Cero dependencias con requisitos de licencia; los limites del proyecto quedan intactos.
- Coste marginal por control nuevo de UI vuelve a ser manual; se mitiga con la API `ph-*` ya estable.
- Si mas adelante se registra una clave, la readopcion es un cambio contenido: ui-lib + 5 app.config + federation.manifest (singletons).
