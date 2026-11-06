---
id: DEC-006
title: Persistencia del backend con PostgreSQL en contenedor Docker
description: La base de datos del backend FastAPI sera PostgreSQL ejecutandose en Docker, con la implementacion en memoria como fallback de desarrollo y pruebas.
estado: tomada
dueno: rol:propietario
fecha: 2026-11-06
updated: 2026-11-06
relaciona: DEC-003, REQ-003
status: accepted
---

# DEC-006: Persistencia del backend con PostgreSQL en contenedor Docker

## Pregunta

Donde persiste el estado del backend FastAPI (usuarios, proyectos, etapas de
trabajo, entregables, bitacora) cuando se abandone la implementacion en memoria?

## Contexto

- Orden del dueno (2026-11-06): "anade a la planificacion del backend que puede
  usar una base de datos postgresql en un contenedor docker".
- Rulebook AGENTS.md seccion 7: el backend es FastAPI; la persistencia fisica
  estaba planificada como fase posterior (docstring de `app/servicio.py`).
- Docker esta disponible en el host (Docker 29.8.2); ya hay contenedores
  projecthub en ejecucion (projecthub-shell-1 en 4400).
- El puerto host del contenedor debe evitar los rangos ocupados: 3000 (app
  ajena), 4300-4304 (dev), 4400-4404 (docker projecthub), 8000 (app ajena),
  8100 (API FastAPI). Se usara 5432->5432 o 5433 si 5432 esta ocupado.

## Opciones consideradas

1. **Archivo JSON sobre disco.** Descartada: resuelve la sobrevivencia del
   proceso pero no concurrencia, integridad ni consultas.
2. **SQLite embebida.** Descartada como destino final: util para tests, pero el
   dueno autorizo explicitamente PostgreSQL; tests unitarios pueden seguir en
   memoria o SQLite si el driver lo permite.
3. **PostgreSQL en contenedor Docker.** Aceptada: orden del dueno, sin instalacion
   en el host, volumen nombrado para los datos, healthcheck para orquestacion.

## Resolucion

- El backend FastAPI persistira en **PostgreSQL 17 (imagen postgres:17-alpine)**
  dentro de un contenedor Docker orquestado con `docker-compose.yml` en
  `backend/` (o `deploy/` si ya existe composicion compartida).
- Servicio `db`: puerto host 5433 (5432 reservado a instancias locales ajenas),
  volumen nombrado `projecthub_pgdata`, healthcheck `pg_isready`, credenciales
  por variables de entorno en `.env` (sin secretos en el repositorio; `.env` en
  `.gitignore` con `.env.example` versionado).
- La aplicacion lee `DATABASE_URL` (por ejemplo
  `postgresql+psycopg://projecthub:...@localhost:5433/projecthub`); sin la
  variable o con la URL vacia usa la implementacion en memoria actual, que
  permanece como fallback de desarrollo y como capa de tests unitarios.
- La frontera ya existe: `ServicioProyectos` opera sobre listas en memoria; la
  migracion introducira un repositorio (`app/almacen.py`) con dos
  implementaciones (`RepositorioMemoria`, `RepositorioPostgres`) seleccionadas
  por configuracion, sin cambiar las reglas de dominio.
- Datos semilla: la semilla actual carga en el arranque si la base esta vacia
  (idempotente), igual que hoy en memoria.

## Consecuencias

- Nueva dependencia Python: `psycopg[binary]` (o SQLAlchemy si el modelo lo
  exige); se justificara en el cambio que la introduzca.
- Requiere Docker en el host para persistencia real; en CI y en maquinas sin
  Docker los tests corren contra memoria.
- Los datos sobreviven reinicios del contenedor (volumen nombrado) pero no
  respaldos: el backup queda fuera de alcance por ahora.
