## 2026-11-09 (iteracion 64: VULN-008 paridad de validacion de usuarios en el re-sync)

Objetivo: cerrar el ultimo gap de paridad del canal de re-sync detectado al
analizar VULN-005/007: el push aceptaba usuarios que crear_usuario/editar_
usuario rechazan.

- Gap (VULN-008): `escribir_estado_completo` solo pasaba los usuarios por
  model_validate (Pydantic, campos str simples sin validators) + guard de
  Admin; nada exigia nombre no vacio, >= 1 rol (1.4) ni formato/unicidad de
  correo. El correo es clave de identidad en ServicioCredenciales
  (sincronizar_con_usuarios limpia credenciales huerfanas por correo), asi
  que un correo roto o duplicado rompe login y limpieza.
- Fix (backend 790e5fa): escribir_estado_completo normaliza nombre/correo de
  cada usuario entrante (strip + lower, igual que el canal normal) y
  _validar_invariantes_dominio ahora espeja _validar_nombre (nombre no
  vacio), _validar_roles (>= 1 rol) y _validar_correo (formato -> 422
  VALIDACION; duplicado en coleccion -> 409 DUPLICADO). Variante legitima
  (espacios/mayusculas) entra almacenada normalizada.
- Test de regresion: test_escribir_estado_usuarios_invalidos_responde_422_o_
  409 (nombre vacio, roles [], correo sin arroba, duplicado case-insensitive
  con el correo del PM en mayusculas, estado vigente intacto tras los 4
  rechazos y push legitimo con espacios/mayusculas almacenado normalizado).
- Evidencia: pytest 148 passed + 4 skipped (44/44 test_api), ruff limpio;
  rebuild demo (build exit 0 + up -d, grep vistos_correo = 3 dentro del
  contenedor) y sondas HTTP 8100: push con correo duplicado case-insensitive
  -> 409, correo sin arroba -> 422, estado demo intacto tras ambos (7
  usuarios, 6 proyectos, 11 bitacora; correo de u-analista vigente
  andres@projecthub.local).
- Commits: backend 790e5fa; docs vulns.md + puntero backend cf6e075.

## 2026-11-09 (iteracion 63: fin de la herencia mock + VULN-007 nombres duplicados en el re-sync)

Objetivo: prioridad del usuario - verificar y eliminar el select de usuario
activo y todo residuo hardcodeado de la era mock; continuar con la deuda
pendiente de it14/it62.

- Verificacion del navbar del shell (7cc4133): SesionUsuario solo muestra
  usuario real, roles y acciones de perfil/cierre; NO hay select. El unico
  mat-select del shell es el selector de PROYECTO del dashboard (legitimo,
  8.6). Spec del shell ya aserta la ausencia del selector de usuario.
- Barrido integral de residuos mock: 3 textos de estados sin sesion remitian
  al selector eliminado ("Selecciona/Seleccione un usuario en el selector de
  sesion/shell"): usuarios.html de mfe-admin, documentos.html y bitacora.html
  de mfe-governance -> ahora piden iniciar sesion; sin-permisos.ts del shell
  (docstring + 2 mensajes) ya no ofrece "cambiar de usuario sin recargar" ->
  autenticarse con otras credenciales (10.2). Docstring de SesionUsuario
  corregido ("que si dejo" -> "que dejo"). Ningun mock queda en codigo de
  produccion: el resto de coincidencias son HttpTestingController/vi.spyOn
  de tests y la semilla de referencia 1.6/11.6 decidida en it60.
- Chips del gate (pendiente it14): YA cerrado en it16 (commit 482ed4b,
  "eliminados los ultimos estilos .chip hand-rolled"); solo queda .chips
  contenedor flex de proyecto-detalle, sin deuda.
- VULN-007 (backend 4c4e81e): el re-sync aceptaba coleccion de proyectos con
  nombre duplicado; crear/editar lo rechazan con 409. _validar_invariantes_
  dominio exige nombres unicos (lower, espejo de _existe_nombre) y el push
  colaba duplicados que la API normal nunca permite. Test de regresion:
  duplicado exacto, case-insensitive, estado intacto tras rechazo y push con
  nombre unico aceptado.
- Etapas del ciclo de vida en entregables: verificado sin deuda - el modelo
  Entregable ya tiene etapa: EtapaCicloVida; documentos.ts/html de
  mfe-governance cubren selector de etapa, columna en tabla, gate por etapa
  y permiso por matriz (1.5).
- Evidencia: shell 29/29 + admin 13/13 + governance 20/20 (vitest), lint
  exit 0 en los 3; backend pytest 147/147 + 4 skipped, ruff limpio; sondas
  HTTP contra la API demo 8100 (rebuild + up): entrada nueva con proyecto
  inexistente -> 422 VALIDACION, push que elimina p6 conservando b5 -> 200,
  roundtrip -> 200, restauracion exacta del estado demo desde snapshot.
- Commits: shell f2c4dbe, mfe-admin f9cbf8c, mfe-governance c5840b0,
  backend 4c4e81e; docs VULN-007 a5457da; puntero backend b16e716.

## 2026-11-09 (iteracion 62: integridad referencial solo en entradas nuevas de bitacora)

Objetivo: cerrar VULN-006 - el re-sync quedaba bloqueado en bucle cuando el
push eliminaba proyectos con historial vigente.

- Causa raiz confirmada con repro manual: _fusionar_bitacora conserva las
  entradas vigentes (append-only VULN-001) pero _validar_invariantes_dominio
  validaba referencias de TODA la bitacora entrante; tras un push que
  reemplaza proyectos, las entradas del servidor quedan huerfanas y el
  siguiente GET->PUT responde 422 "referencia al proyecto X, que no existe",
  sin camino de vuelta (la bitacora no se puede borrar). Repro: bitacora
  5->9 al crear proyecto p7 + push de semilla; PUT posterior 422 por b-...-2
  -> p-...-1.
- Fix de disenio (backend bce5470): la validacion referencial de bitacora se
  mueve de _validar_invariantes_dominio a _fusionar_bitacora y solo se exige
  en entradas NUEVAS contra el estado entrante (proyectoId entre proyectos
  que quedan; autorId entre usuarios entrantes). Las vigentes son historial
  inmutable (3.5) y pueden referenciar proyectos eliminados en pushes
  posteriores: revalidarlas bloquearia el re-sync para siempre.
- Tests: los 2 casos de bitacora de test_escribir_estado_referencias_rotas
  ahora usan ids nuevos (b-ref-rotas-1/2) y prueban la validacion referencial
  real; nuevo test_escribir_estado_bitacora_historial_sobrevive_eliminacion_200
  (push que elimina p6 conservando b5 -> 200; roundtrip posterior -> 200).
- Diagnostico colateral: los 5 fallos cruzados de test_api (roundtrip,
  autoaprobacion, escalada, append_propio, re_sync) venian del envenenamiento
  por huérfanas tras el push de _push_estado_limpio del test de flujo;
  verificado por bisect (ningun test individual rompe el roundtrip) y trazas
  de sincronizacion. conftest.py: revertido el hook experimental de
  restauracion de semilla (era un no-op: GETs sin actor -> 422); vuelve a
  fijar solo DATABASE_URL="".
- Registro: fila VULN-006 en .ops/security/vulns.md.
- Evidencia: pytest 146 passed + 4 skipped (43/43 test_api), ruff limpio.
- Puntero: root -> backend bce5470.## 2026-11-09 (iteracion 61: invariantes de dominio en el re-sync de estado)

Objetivo: cerrar VULN-005 - el PUT /api/sincronizacion confiaba ciegamente en
el cliente para los invariantes que si aplica el canal normal de casos de uso.

- Hallazgo: escribir_estado_completo validaba forma (listas, ids unicos) y
  diff de usuarios, pero no dominio: avance fuera de 0-100, presupuesto
  negativo o NaN/Inf, fechas invertidas y autoaprobacion de entregables
  (autor = aprobador, o aprobacion sin fecha) entraban por re-sync.
- Fix (backend 8a9de54): _validar_invariantes_dominio llamada tras el
  model_validate; etapas via _validar_datos_etapa/validar_etapa, proyectos
  con presupuesto finito >= 0 (guard bool/NaN/Inf), entregables con espejo
  de validar_aprobacion. Huecos NaN cerrados en crear_proyecto y
  registrar_consumo. Nota de dominio: consumo > asignado NO se rechaza
  (presupuesto_excedido se calcula y se alerta, 5.4).
- Tests: 4 nuevos en test_api.py (avance 150/-1, presupuesto negativo etapa
  y proyecto, fechas invertidas, autoaprobacion/sin fecha/legitima con
  restauracion por snapshot - no asumir semilla porque tests previos aprueban
  ent-7). pytest 144/144 + 4 skipped, ruff limpio.
- Incidente: dos sondas standalone con python -c colgaron; al limpiar env en
  PowerShell 5.1 $env:DATABASE_URL = '' puede ELIMINAR la variable y el
  load_dotenv() conecta al Postgres demo. BD demo verificada intacta tras
  login real (avance e1=100, presupuesto 30000, fechas correctas, ent-7 sin
  aprobar). Regla nueva: no correr sondas standalone que importen app.main;
  para caracterizacion usar pytest (conftest garantiza memoria).
- Registro: fila VULN-005 en .ops/security/vulns.md.
- Puntero: root -> backend 8a9de54.
## 2026-11-09 (iteracion 60: dedupe de URL base en specs + fin del era mock)

Objetivo: eliminar los ultimos residuos de la era mock detectados en la
revision del navbar: el nombre heredado `UserSwitcher` y los 50 literales
`http://localhost:8100` repartidos en 5 specs.

- Constante unica (shared-lib 18fd4d8): `API_BASE_URL_POR_DEFECTO` y el
  helper `urlApiPorDefecto(ruta)` exportados desde api-enlace.ts; el factory
  del token `API_BASE_URL` usa la constante. Los specs de api-enlace,
  autenticacion y sincronizador-escrituras (shared-lib) y app y login (shell)
  migrados al helper: 0 literales restantes (unico sitio del codigo con el
  8100: la constante).
- Renombrado (shell 7cc4133): `user-switcher/` -> `sesion-usuario/` (carpeta,
  clase `SesionUsuario`, selector `app-sesion-usuario`, clases CSS del
  template). El select mock "Usuario activo" ya se habia eliminado en it55
  (130d7ec); quedaba solo el nombre, que viaja al bundle prod porque app.html
  referencia el selector. app.ts/app.html/app.spec.ts actualizados; JSDoc
  cuenta la historia.
- Verificacion: vitest 314/314 (7 repos), lint raiz 7 repos exit 0, build
  raiz 7 repos exit 0, bundle prod del shell sin 'user-switcher' ni
  'Usuario activo' y con 'app-sesion-usuario'. Demo dockerizada: shell
  reconstruido (imagen nueva), manifest 440x correcto, remoteEntry 200 en
  los 5, chunk servido (14732 B) contiene 'app-sesion-usuario'/'Cambiar
  contrasena'/'Cerrar sesion' y 0 strings mock, login real de diana contra
  8100: 200/200/200 (login, /me, /api/usuarios). navegador CDP no disponible
  en esta sesion; verificacion por HTTP y bundles servidos.
- Nota: para tocar shared-lib y testear el shell sigue siendo obligatorio
  `npx ng build` en shared-lib (el shell consume dist por `file:`), ahora
  los exports nuevos se ven en types/projecthub-shared.d.ts y
  fesm2022/projecthub-shared.mjs (archivos consolidados).
- Punteros: root 96bd359 (shared-lib 18fd4d8, shell 7cc4133).

## 2026-11-09 (iteracion 59: barrido integral de regresion tras it58)

Objetivo: confirmar que el fix de AutenticacionService (77bb148) no rompio
nada en ninguna parte; ademas cubrir el spec de la pantalla de login del
shell, que consumia el mismo camino.

- Resultado del barrido (sin cambios de codigo de produccion): vitest
  shared-lib 177, shell 29, mfe-projects 29, mfe-admin 13, mfe-governance
  20, mfe-reports 6, ui-lib 40; pytest backend 140 passed + 4 skipped;
  ruff 0 hallazgos; eslint 7 repos limpio; build raiz 7 repos exit 0.
- Hallazgo menor: el spec de login del shell (2 tests de login exitoso)
  sufria el mismo efecto de it58 (5 peticiones de sync abiertas al
  verify()); corregido con el mismo helper (shell f4f992d, solo test).
- Leccion: el helper de sincronizacion de tests vivia duplicado (shared-lib
  y shell); aceptable por estar en repos independientes, pero si aparece
  un tercer caso habra que moverlo a un util de test de shared-lib.

## 2026-11-09 (iteracion 58: NG0203 en resincronizarStores tras el login)

Objetivo: endurecer el mismo patron de riesgo de la it57 en el unico sitio
que quedaba expuesto: AutenticacionService.iniciarSesion().

- Hallazgo: iniciarSesion() llama a resincronizarStores() -> sincronizarStores()
  DESPUES de await(s) HTTP; fuera del contexto de inyeccion los inject() de
  sincronizarStores fallaban en silencio (el catch de degradacion tragaba el
  error) y tras un login exitoso la app quedaba en semilla local hasta F5.
  Impacto real: al iniciar sesion no se descargaba el estado autoritativo
  (10.3), contradiciendo el comentario de la propia llamada.
- Fix (shared-lib 77bb148): campo `private readonly inyector = inject(Injector);`
  capturado en el constructor y `await runInInjectionContext(this.inyector,
  () => sincronizarStores())` en resincronizarStores. cambiarContrasena no
  sincroniza (revisado; no hace falta).
- Spec actualizado (mismo commit): los 2 tests de login exitoso ahora
  responden las 5 lecturas autoritativas que la sincronizacion emite con
  sesion real (helper responderSincronizacion con tick + flush de
  usuarios/proyectos/etapas/entregables/bitacora). Los logins con error no
  llegan a sincronizar. Baseline verificado con git stash: sin el fix el
  spec viejo pasaba porque la sync moria en silencio (el test validaba el
  bug). Leccion: cuando un catch tragaba un error, arreglar el error puede
  exigir actualizar el test que lo daba por bueno.
- Verificacion: tests shared-lib 177/177; build shared-lib + shell OK;
  rebuild del shell demo y e2e re-ejecutados (banner 9/9, repush 8/8,
  bitacora-append 10/10); BD demo sin residuos E2E (DELETE 2 proyectos
  E2E RePush% + 2 bitacora hijas); chunk del shell sin strings mock.

## 2026-11-09 (iteracion 57: NG0203 en bootstrap prod + cache remoteEntry + e2e banner)

Objetivo: smoke integral de la demo dockerizada. Destapo una regresion real
introducida en la iteracion 55 y quedo cerrada con fix verificado.

- Hallazgo 1 (cache): remoteEntry.json del shell salia con
  Cache-Control: public, max-age=3600 (shell.conf sin location dedicada;
  los remotes si tenian no-cache desde it50). Tras un redeploy los
  navegadores podian cargar chunks inexistentes hasta vencer el TTL.
  deploy (ea0867d): location = /remoteEntry.json con no-cache; verificado
  con curl -I en 4400 (remoteEntry e index.html).
- Hallazgo 2 (REGRESION CRITICA): NG0203 en el bootstrap prod del shell
  (body vacio en la demo). Causa raiz: en it55 el initializer paso a
  llamar sincronizarStores() DESPUES de await restaurarSesion(); el
  contexto de inyeccion no sobrevive al await y los inject() de
  sincronizarStores fallan fuera de el. shared-lib (522c78e): se captura
  inject(Injector) antes del await y se envuelve con
  runInInjectionContext(inyector, () => sincronizarStores()). Tests
  shared-lib 177/177; builds shared-lib y shell OK; verificado en local
  (http-server 4399: 0 pageerrors, dashboard renderiza) y en demo
  (rebuild shell; 0 errores NG0*; dashboard compone widgets).
- e2e-banner-api actualizado al texto de it55 y ejecutado 9/9 (antes
  esperaba 'modo demo'); e2e-repush 8/8 y e2e-bitacora-append 10/10
  re-verificados tras el rebuild; BD demo sin residuos E2E (DELETE 2).
- Demo verificada: chunk del shell sin 'Usuario activo' ni 'modo demo',
  con 'datos locales de referencia'; remoteEntry con no-cache.
- Leccion: los tests no atrapan NG0203 porque en TestBed el contexto de
  inyeccion se administra distinto; la unica verificacion valida para el
  bootstrap prod es servir el dist y abrir el browser.
## 2026-11-09 (iteracion 56: barrido integral de regresion + runbook de deploy)

Objetivo: confirmar que la iteracion 55 no rompio nada en ninguna parte
del sistema y documentar el despliegue.

- Barrido de regresion (todo verde, sin cambios de codigo):
  vitest shared-lib 177/177, shell 29/29, mfe-projects 29/29,
  mfe-admin 13/13, mfe-governance 20/20, ui-lib 40/40,
  mfe-reports 6/6; pytest backend 140 passed + 4 skipped; ruff limpio;
  eslint OK en los 7 repos (npm run lint); npm run build raiz OK
  (7 repos: mfe-admin, mfe-governance, mfe-projects, mfe-reports,
  shared-lib, shell, ui-lib).
- deploy (commit 721b6a3): nuevo
  deploy/projecthub/RUNBOOK.md - variables de entorno (AUTH_SECRET,
  ALLOWED_ORIGINS, RATE_LIMIT_LOGIN_*), limitacion del limitador de login
  en memoria con varias instancias (Redis/edge como camino), comandos de
  despliegue y rebuild por servicio, hardening de la iteracion 50,
  verificacion post-despliegue (curl + login de humo) y operacion
  (logs, backup/restore, down -v destructivo).
- Limpieza: eliminados .dev-logs/msg-*.txt (temporales de la iteracion
  55).
## 2026-11-09 (iteracion 55: sesion real sin selector mock - eliminar hardcodeo)

Objetivo: eliminar el select "Usuario activo" del navbar (herencia del mock)
y todo lo hardcodeado asociado, moviendo el sistema a sesion unicamente real.

- shared-lib (commit 285a178): SesionStore real - solo AutenticacionService
  fija el usuario (fijarUsuario); eliminados USUARIOS_SEMILLA del store,
  usuariosActivos, seleccionar() y registrarUsuario(). AutenticacionService
  resincroniza los stores tras el login y expone reBaselinear() en el
  sincronizador para reanclar el push. api-enlace sin X-Actor-Id (la
  identidad viaja solo en el token Authorization). project.store lleva
  catalogo propio de usuarios desde el backend; exigirResponsableActivo y
  exigirAdmin validan contra ese catalogo. Tests: 13 archivos, 177/177.
- shell (commit 130d7ec): user-switcher sin modo demo - con sesion muestra
  usuario/roles/perfil/cierre; sin sesion muestra acceso a /login.
  sesion.guard redirige SIEMPRE a /login sin sesion; permiso.guard igual.
  Banner de backend caido ya no menciona modo demo. Tests: 8 archivos,
  29/29.
- mfe-projects (commit 1fca9c3): responsables desde UsuarioStore
  (catalogo), no desde la sesion; mensajes "Inicia sesion para continuar."
  Tests: 5 archivos, 29/29.
- mfe-admin (228dfaf) y mfe-governance (cee3d22): specs con sesion real
  (fijarUsuario + fixture). 13/13 y 20/20.
- Verificacion integral: build de los 7 repos OK; lint OK en los 6 con
  eslint (un fix: variables sesion sin uso en usuarios.spec).
- Residuos iteracion 54: DELETE en BD demo de proyectos "E2E RePush%"
  (2 filas via datos->>nombre) y commit del script
  tools/e2e/e2e-bitacora-append-api.mjs (d5d7394).
- docs/funcionalidades.md: 1.6 marcado como reemplazado por sesion real
  (14.3), decision de eliminacion de la sesion simulada (2026-11-09),
  11.6 con texto nuevo del banner, X-Actor-Id reclassificado como
  herramienta de pruebas del backend.
## 2026-11-08 (iteracion 50: hardening del deploy demo)

- nginx sin privilegios: nginx.conf propio (listen 8080, pid y temp paths en
  /tmp, logs a stdout/stderr, sin directiva user); master y workers corren como
  uid 101. Empiricamente: un tmpfs en /var/cache/nginx queda root:root y nginx
  no puede crear subdirectorios ahi, por eso todo lo escribible vive en /tmp.
- api.Dockerfile: usuario appuser (uid 10001) en vez de root.
- compose: read_only + tmpfs + no-new-privileges en todos los servicios;
  puertos 440x -> 8080 (el usuario no root no puede enlazar <1024).
- Cabeceras de seguridad (headers.conf incluido por shell.conf y remote.conf):
  X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy;
  Server sin version (server_tokens off en http de nginx.conf; headers.conf se
  incluye en dos niveles, duplicarlo da error).
- Cache segura para federation: remoteEntry.json e index.html con
  Cache-Control no-cache (antes max-age=3600: un redeploy dejaria chunks
  viejos en los browsers); assets hasheados max-age=3600, una sola cabecera
  Cache-Control (expires anadiria una duplicada).
- Demo reconstruida y verificada: 200 en 4400-4404 y api/salud; uid 101 en
  frontends y 10001 en api (docker exec id); read_only y no-new-privileges
  (docker inspect); cabeceras y cache con curl; login e2e en navegador
  (diana) y F5 en /governance -> login con ?de=%2Fgovernance. La demo quedo
  actualizada con shared-lib de las iteraciones 47-48.
- Experimento 403 USUARIO_INACTIVO en demo (desactivar a diana via PUT
  /api/sincronizacion): me respondio 403 USUARIO_INACTIVO; al reactivarla por
  DB restauro el estado. HALLAZGO: un Admin puede desactivar a todos los
  Admin y bloquear el sistema (sin guard de ultimo Admin); sin endpoint de
  reactivacion alcanzable. Queda como item de la siguiente iteracion.
- Commits: deploy (hardening, 9 archivos), root 827f120 (submodulos 47-48 +
  deploy), root docs (esta entrada, handoff, funcionalidades 14.1-14.7).

## 2026-11-08 (iteracion 51: guard de ultimo Admin activo)

- Hallazgo de la iteracion 50 cerrado: un Admin podia desactivarse a si mismo
  (o retirarse el rol Admin) y desactivar a los demas Admins via PUT
  /api/sincronizacion; el sistema quedaba sin ninguna via de reactivacion.
- Guard en ServicioProyectos (nivel servicio, cubre ambas vias):
  editar_usuario rechaza desactivar al ultimo Admin activo o retirarle el
  rol; escribir_estado_completo y _validar_diff_usuarios rechazan un estado
  entrante sin ningun Admin activo. Error 422 VALIDACION con mensaje
  accionable ("promueve a otro Admin antes de retirar el ultimo").
- tests/test_ultimo_admin.py: 9 casos (servicio y HTTP reproduciendo el
  hallazgo, incluido el caso limite de reenviar una edicion a un usuario ya
  inactivo). El caso positivo HTTP usa u-doble (semilla) promovido a Admin:
  solo usuarios semilla administran usuarios (proteccion preexistente contra
  X-Actor-Id suplantado).
- Verificado: backend 142 pytest (133 + 9), ruff limpio; imagen api del demo
  reconstruida; experimento E2E por HTTP contra 8100: 422 al dejar 0 Admins
  activos, 200 desactivando un Analista con Diana activa, estado de demo
  restaurado, me 200.
- Commits: backend 568e3ea, root ba99db7 (submodulo), docs (esta entrada +
  handoff + funcionalidades 14.8).

# PROGRESS.md - ProjectHub

Log de avance dia a dia. Fuente de verdad del avance; `.ops` lo organiza y enlaza.

## 2026-11-08 (iteracion 53: bitacora append-only en el re-sync, VULN-001)

- Hallazgo cerrado: PUT /api/sincronizacion reemplazaba la coleccion de
  bitacora al completo; cualquier actor autenticado podia borrar el
  historial (parte pendiente de VULN-001, invariante 3.5) y un cliente
  stale entraba en 422 al conservar entradas ya registradas en servidor.
- Servidor (`backend/app/servicio.py`): `escribir_estado_completo` llama a
  `_fusionar_bitacora(bitacora, actor_id)`. Fusion por id, el servidor es
  la fuente autoritativa y su bitacora nunca pierde entradas: entrada
  vigente omitida del push se conserva (omision = no-op: un push stale no
  borra ni entra en 422); entrada vigente con otro contenido -> 422
  VALIDACION (el historial es invariable); entrada nueva con autorId !=
  actor del re-sync -> 422 (la bitacora solo crece por acciones propias;
  VULN-001). Nueva via administrativa `bitacora_reemplazar()` para seeds y
  tests, fuera del canal de re-sync.
- Cliente (`shared-lib`, sincronizador-escrituras.ts): set `confirmadas`
  con ids vistos en el eco del servidor; `reBaselinearConfirmadas()` en la
  primera lectura de `observar()`; `empujar()` filtra la bitacora a propia
  del actor o ya confirmada; `aplicarRespuesta()` reconstruye el set con
  la bitacora autoritativa. Un push stale que omita una entrada registrada
  por otro se recupera solo: el servidor la conserva y el siguiente push
  ya la lleva confirmada.
- DecisiÃ³n de diseÃ±o: la omision de una entrada vigente se interpreta como
  cliente desactualizado y se conserva la copia del servidor (merge
  conservador), no como borrado a rechazar: rechazar obligaria a que todo
  cliente empuje siempre la bitacora completa y fresca (422 en bucle de
  recuperacion). El 422 queda reservado para lo irreversible: modificar
  el historial o atribuir acciones ajenas.
- Verificado: pytest 136/136 (backend .venv), ruff limpio, vitest
  shared-lib 177/177 (nuevo spec de filtrado VULN-001 en
  sincronizador-escrituras.spec.ts). Log: .dev-logs/pytest-vuln001-bitacora.log
  y ngtest-sharedlib-iter53.log. Nota de entorno: `npx ng test
  --browsers=...` no aplica a esta config de vitest (usa `npx ng test
  --watch=false`).
- Commits: backend 1f8b297, shared-lib b7c489f, root b6f7a3f (punteros).

## 2026-11-08 (iteracion 48: cuenta desactivada en pleno uso, 403 USUARIO_INACTIVO)

- Contrato backend: obtener_actor responde 403 con detail.codigo=
  USUARIO_INACTIVO cuando el token es criptograficamente valido pero el
  usuario fue desactivado por un Admin (antes: el actor pasaba y las
  escrituras fallaban por otra via). Diferenciado del 401 SESION_INVALIDA:
  la identidad es conocida, solo la cuenta esta inactiva. X-Actor-Id sin
  token conserva su comportamiento.
- Shared-lib: ApiEnlaceService detecta 403 USUARIO_INACTIVO (con token
  presente) y notifica via onCuentaDesactivada() sin limpiar el token (la
  identidad sigue siendo valida; cerrar la sesion es decision de la app);
  un 403 con otro codigo (p. ej. PERMISO_DENEGADO) no notifica.
  AutenticacionService reacciona cerrando la sesion y expone
  desactivaciones() (contador reactivo, paralelo a expiraciones()).
- Shell: efecto en App redirige a /login?desactivada=1 (replaceUrl); Login
  muestra el aviso "Tu cuenta fue desactivada; contacta a un administrador."
  (role=alert), distinto del aviso de sesion expirada.
- Verificacion: backend 133/133 pytest + ruff limpio; shared-lib 176/176
  vitest + build dist; shell 30/30 vitest + build + lint en verde.
- Commits: backend f8874e6, shared-lib b95f5d4, shell fdd6e3f; docs raiz.

## 2026-11-08 (iteracion 47: sesion expirada con token vigente en pantalla)

- Contrato backend: obtener_actor ahora responde 401 con
  detail.codigo=SESION_INVALIDA cuando el Bearer es invalido/expirado o el
  usuario ya no existe (antes: 422 VALIDACION / 404). Regla unica de
  cliente: 401 SESION_INVALIDA => cerrar sesion y volver a login.
  X-Actor-Id (compatibilidad) conserva 404 ENTIDAD_NO_ENCONTRADA.
- Shared-lib: ApiEnlaceService detecta 401 SESION_INVALIDA (con token
  presente), limpia el token y notifica via onSesionExpirada(); el estado
  de salud de la API no cambia (el backend sigue vivo). AutenticacionService
  reacciona cerrando la sesion y expone expiraciones() (contador reactivo).
- Shell: efecto en App redirige a /login?expirada=1 (replaceUrl) al
  detectar la expiracion, salvo que ya este en /login; Login muestra el
  aviso "Tu sesion ha expirado; inicia sesion de nuevo." (role=alert).
- Verificacion: backend 132/132 pytest + ruff limpio (y smoke E2E contra
  la API viva: token invalido en /api/usuarios => 422 VALIDACION por
  compilacion previa al fix; contrato cubierto por tests); shared-lib
  174/174 vitest + build dist; shell 28/28 vitest + build + lint raiz
  (5 repos) en verde.
- Commits: backend 5e46a39, shared-lib 5932430, shell d2e608e; docs raiz.

## 2026-11-08 (iteracion 46: barrido integral de regresion tras el ciclo de seguridad)

- Justificacion: los cambios de shared-lib (api-enlace, autenticacion) y
  del backend se propagan a los 5 apps via dist; barrido completo para
  confirmar que nada rompio.
- Verificacion: npx ng test en ui-lib (6), shell (8), mfe-projects (5),
  mfe-admin (3), mfe-governance (4), mfe-reports (5) archivos de tests,
  todos en verde; npm run build exit 0 en los 6; lint raiz exit 0;
  backend 131/131 ya verificado en iteracion 42.
- Sin cambios de codigo: iteracion de verificacion pura.
- Commits: raiz (docs).

## 2026-11-08 (iteraciones 44-45: CI del backend y manejo del 429 en la UI)

- Iteracion 44 (CI): workflow `backend-ci.yml` (pytest + ruff, Python 3.14
  con cache pip, repositorio en memoria) activado con cambios en backend/.
  Sin ejecucion local nueva necesaria (131/131 ya verificado).
- Iteracion 45 (manejo del 429 en el frontend): la demo seguia mostrando
  "El backend no responde" cuando el backend respondia 429 LIMITE_INTENTOS
  (verificado por navegador: 401x5 -> 429 con mensaje equivocado). Fix en
  `AutenticacionService.mapearError` (shared-lib): 429 -> codigo
  LIMITE_INTENTOS con el mensaje del backend ("Demasiados intentos
  fallidos; reintente mas tarde."). Test nuevo en autenticacion.spec.ts.
- Verificacion: shared-lib 172/172 vitest + build dist; rebuild de los 5
  frontends demo y E2E de navegador: 401x5 -> 429 y la UI muestra el
  mensaje correcto; estado demo intacto (7/6/5/10/5).
- Commits: raiz (CI), shared-lib (fix 429), raiz (docs).

## 2026-11-08 (iteracion 43: demo alineada con las mitigaciones - verificacion E2E de seguridad)

- Justificacion: los 5 frontends demo (4400-4404) tenian embebida la
  shared-lib con el bug de registrarCaida (4xx = caida): con VULN-002
  activa, el modo demo habria mostrado el banner "Sin conexion" en falso.
- Implementado: rebuild de las 5 imagenes demo (shell, projects, reports,
  admin, governance) mas la API ya reconstruida en las iteraciones 39-42;
  sin cambios de codigo.
- Verificacion (navegador integrado contra la demo reconstruida):
  - Modo demo sin sesion en 4400: los 422 de los GET anÃ³nimos NO disparan
    el banner de caida (consola con 422 esperados, UI con semilla y sin
    "Sin conexion"); degradacion elegante intacta.
  - Login real de Diana (Bearer): dashboard con datos del backend.
  - Ruta profunda /projects: portafolio con los 6 proyectos reales,
    patrocinadores resueltos, sin banner.
  - F5 en /projects: sesion y datos persisten (token en localStorage).
- Cierre del ciclo de seguridad: VULN-001 (parcial), 002, 003 y 004
  mitigadas y verificadas en la demo.
- Commits: raiz (docs).

## 2026-11-08 (iteracion 42: mitigacion VULN-001 - validacion de diff de usuarios en el re-sync)

- Justificacion: VULN-001 (Alta) permitia a cualquier actor autenticado
  escalar roles o destruir la bitacora via PUT /api/sincronizacion. La
  mitigacion profunda (degradar el re-sync total) cambia el contrato 13.4,
  pero la parte segura no: validar el diff de usuarios server-side.
- Implementado: `_validar_diff_usuarios()` en `escribir_estado_completo`
  (backend/app/servicio.py): si la coleccion usuarios empujada difiere de
  la vigente (nuevo, eliminado, roles, activo, correo o nombre), exige
  Admin con el mismo guard `_exigir_admin` de 1.8 -> 409
  PERMISO_DENEGADO; el re-sync sin diff de usuarios lo acepta cualquier
  actor autenticado (contrato del frontend intacto: ninguna vista empuja
  cambios de usuarios via re-sync, la administracion usa
  POST/PATCH /api/usuarios).
- Decision documentada (vulns.md): la inmutabilidad profunda de bitacora
  y el resto de colecciones de gobierno siguen en el contrato actual;
  restringirlos queda como decision de alcance del propietario.
- Tests: la caracterizacion VULN-001 se sustituye por 3 tests de
  mitigacion (escalada -> 409 y estado intacto + Admin si puede; borrado
  de bitacora conserva contrato, restaurando semilla; re-sync de PM sin
  diff aceptado).
- Verificacion: backend pytest 131/131, ruff limpio; API demo reconstruida
  y sonda HTTP en vivo: escalada 409 PERMISO_DENEGADO con roles intactos,
  re-sync de PM (sin diff) OK, estado demo 7/6/5/10/5 y analista sin
  Admin.
- Commits: backend, raiz (docs/.ops).

## 2026-11-08 (iteracion 41: mitigacion VULN-004 - CORS configurable)

- Justificacion: VULN-004 (Baja) dejaba los origenes CORS fijos en codigo;
  un despliegue en dominio real exigiria tocar codigo, contrario a la
  configuracion por entorno (DEC-001).
- Implementado: `_origenes_permitidos()` en `app/main.py` lee
  `ALLOWED_ORIGINS` (separada por comas, normaliza barras finales y
  entradas vacias) y conserva los 6 origenes de desarrollo/demo como
  default; cero cambios de comportamiento para dev y demo.
- Tests: `tests/test_cors.py` nuevo (5 tests: default, separacion por
  comas, normalizacion, env vacio -> default, puertos del proyecto).
- Verificacion: backend pytest 130/130, ruff limpio; API demo reconstruida
  y CORS probado por HTTP: origen permitido 4400 recibe
  Access-Control-Allow-Origin, origen ajeno no lo recibe.
- Commits: backend, raiz (docs/.ops).

## 2026-11-08 (iteracion 40: mitigacion VULN-003 - rate limit en login)

- Justificacion: VULN-003 (Media) permitia fuerza bruta sobre
  /api/auth/login (25 intentos en 1.6 s sin bloqueo). A estandares de
  produccion el endpoint publico de credenciales exige limitacion.
- Implementado: `backend/app/rate_limit.py` nuevo (limitador en memoria,
  sin dependencias nuevas por la politica del repo): ventana fija por
  correo+IP, 5 fallos en 60 s -> 429 LIMITE_INTENTOS; config por env
  (`RATE_LIMIT_LOGIN_INTENTOS`, `RATE_LIMIT_LOGIN_VENTANA_SEG`, 0
  desactiva); solo cuentan fallos (un login exitoso no acumula); hilo
  seguro con limpieza perezosa. Conectado en el endpoint de login.
- Tests: 6 unitarios del limitador (maximo, ventana que expira, claves
  independientes, desactivacion, limpiar) + 2 de integracion HTTP (429 en
  el sexto intento y exitos no acumulan).
- Nota registrada: con varias instancias del backend conviene un limitador
  externo (Redis); queda en vulns.md como decision de despliegue.
- Verificacion: backend pytest 120/120, ruff limpio; API demo reconstruida
  y probada por HTTP: 401x5 -> 429, otra cuenta OK; estado demo intacto.
- Commits: backend, raiz (docs/.ops).

## 2026-11-08 (iteracion 39: mitigacion VULN-002 - sesion exigida en lecturas de dominio)

- Justificacion: VULN-002 (Media) dejaba 12 GET de dominio sin autenticacion;
  a estandares de produccion el estado completo del sistema (usuarios con
  roles, bitacora, presupuesto) no puede ser de dominio publico.
- Implementado (backend): `obtener_actor` como dependencia en los 12 GET
  (`/api/usuarios`, `/api/proyectos` + resumenes/detalle/gate/etapas/
  entregables/bitacora, colecciones planas y `/api/sincronizacion`). Solo
  `/api/salud` y `/api/auth/login` quedan publicos. El actor sigue aceptando
  X-Actor-Id (contrato demo) y Bearer (sesion real, camino principal).
- Implementado (frontend shared-lib): `ApiEnlaceService` distingue caida real
  de rechazo: red/timeout/5xx marcan indisponible; un 4xx (p. ej. 422
  VALIDACION por sesion ausente en modo demo) mantiene el banner en
  disponible y el fallback a semilla intacto. Sin esto, el modo demo habria
  mostrado "sin conexion" con la API viva.
- Tests: `test_vuln002_mitigado_lecturas_de_dominio_exigen_sesion` sustituye
  la caracterizacion (422 anonimo + 200 con sesion por ruta); cliente de
  tests con X-Actor-Id por defecto + cliente `anon` para peticiones sin
  sesion; en shared-lib 2 tests nuevos (4xx no marca caida; 5xx si; sync con
  422 conserva semillas).
- Verificacion: backend pytest 112/112, ruff limpio; shared-lib vitest
  171/171 y build de dist OK; rebuild de la API demo (`docker compose up -d
  --build api`) + sondas HTTP: anonimo 422 VALIDACION, con sesion 200,
  salud 200; login Bearer de Diana OK; estado demo intacto
  (7/6/5/10/5). Contenedor demo actualizado con la mitigacion.
- Commits: backend, shared-lib y raiz (docs/.ops).

## 2026-11-08 (iteracion 38: auditoria de seguridad de la API y registro VULN)

- Justificacion: el proyecto se trabaja con estandares de produccion (AGENTS.md);
  el dominio y el DoD funcional estaban cerrados, pero nadie habia auditado la
  superficie de seguridad de la API que ahora sostiene la demo completa.
- Metodo: revision de codigo de backend/app (auth, rutas, servicio) + pruebas
  HTTP reales contra la API dockerizada (8100) + suite pytest de regresion.
- Hallazgos (registro en `.ops/security/vulns.md`, estados abiertos a decision
  del propietario):
  - VULN-001 (Alta): `PUT /api/sincronizacion` acepta el reemplazo completo del
    estado desde cualquier actor autenticado sin validar la matriz. Reproducido
    por HTTP: analista se auto-eleva a Admin (roles persistidos en la respuesta)
    y vacia la bitacora (bitacora=0) en dos PUT.
  - VULN-002 (Media): 12 GET de dominio responden 200 sin sesion (usuarios,
    proyectos, etapas, entregables, bitacora, sincronizacion y variantes);
    verificado con curl sin Bearer ni X-Actor-Id.
  - VULN-003 (Media): login sin limitacion de intentos: 25 contrasenas
    erroneas seguidas procesadas en 1.6 s sin bloqueo (fuerza bruta).
  - VULN-004 (Baja): CORS con origenes localhost fijos en codigo, sin env.
- Implementado (test de caracterizacion, no fix: la mitigacion toca contrato de
  escritura y consumidores del frontend, decision del propietario): 3 tests
  nuevos en `backend/tests/test_api.py` que documentan VULN-001 (escalada y
  borrado de bitacora, con restauracion de semilla al final) y VULN-002 (GETs
  sin sesion 200). Fallaran al mitigar, forzando actualizar el registro.
- Limpieza: la auditoria contra la demo dejo residuos (proyectos PH-E2E, un
  usuario y bitacora vacia); estado demo restaurado a semilla exacta via
  PUT /api/sincronizacion con payload generado desde app.semilla
  (usuarios=7, proyectos=6, etapas=5, entregables=10, bitacora=5; login Diana
  OK verificado despues).
- Verificacion: backend 112/112 pytest (antes 109), ruff check exit 0.
- Commits: backend (tests de caracterizacion); raiz (.ops/security + docs).

## 2026-11-08 (iteracion 35b: E2E del re-push en verde y causa raiz del bloqueo silencioso)

- Justificacion: la verificacion en vivo del re-push (pendiente de 35) fallaba
  en la fase offline sin rastro: 0 PUTs, sin error, sin consola. Nueve
  diagnosticos con Playwright aislaron la causa: el input de presupuesto usa
  `step=1000`; al llenar `1234567` el navegador marca stepMismatch y la
  validacion interactiva bloquea el submit en silencio (no hay submit event,
  el boton no esta disabled porque la validacion Angular pasa y
  `requestSubmit()` no omite constraints).
- Implementado: `e2e-repush-api.mjs` (10mo script E2E): login -> creacion con
  API arriba (PUT ok) -> caida -> creacion offline via navegacion client-side
  (PUT emitido y fallido, navegacion a detalle) -> recuperacion -> re-push
  automatico sin interaccion; presupuesto de prueba siempre multiplo de 1000
  para no chocar con el step del input.
- Verificacion: 8/8 comprobaciones OK contra la demo dockerizada 4400; el
  re-push salio +1 PUT a los 1521 ms de restaurar la API, sin tocar la UI.
  Leccion registrada para el E2E: valores de campos con step deben respetar
  el step o el submit se bloquea en silencio.
- Pendiente (it. 36): considerar `step="any"` en el formulario para permitir
  montos arbitrarios (guardar() ya valida >= 0 y finito).

## 2026-11-08 (iteracion 36: step=any en presupuestos de proyecto y etapa)

- Justificacion: el hallazgo de 35b (step=1000 bloqueaba submits con montos
  no multiplos de 1000, en silencio) era un defecto real de producto: un
  usuario que escribe 1234567 no puede crear el proyecto ni asignar
  presupuesto a una etapa, sin mensaje alguno.
- Implementado: step="any" en los dos inputs de presupuesto (proyecto-form y
  proyecto-detalle). La validacion de dominio no cambia: guardar() y el
  store ya exigen monto >= 0 y finito.
- Verificacion: eslint exit 0, tests mfe-projects 29/29, rebuild de la demo
  (solo se recereo mfe-projects; las demas imagenes quedaron identicas por
  cache) y prueba en vivo con navegador integrado: login como Diana, creacion
  con 1234567 -> navegacion a detalle y presupuesto persistido en el backend
  (GET /api/proyectos/... devuelve 1234567).
- Commits: mfe-projects d298339; este commit raiz actualiza docs.

## 2026-11-08 (iteracion 37: regresion E2E contra la demo reconstruida)

- Justificacion: el rebuild de la demo (it. 36) puede regresar banner de API
  y re-push de escrituras; la demo es la referencia de produccion.
- Verificacion: e2e-banner-api 8/8 (ciclo completo de caida/recuperacion con
  banner y consola limpia) y e2e-repush-api 8/8 (creacion con API arriba,
  creacion offline con PUT fallido, re-push automatico +1 PUT a los 5118 ms
  tras restaurar) contra la demo 4400 con el fix step=any incluido.
- Ademas: verificacion en vivo con navegador integrado del segundo input
  (presupuesto de etapa): etapa creada con 987654, persistida en
  GET /api/proyectos/{id}/etapas, datos de prueba eliminados (etapa borrada y
  proyecto cancelado con motivo en bitacora).

## 2026-11-08 (iteracion 35: re-empuje automatico de escrituras tras recuperar la API)

- Justificacion: los cambios hechos con la API caida solo se reintentaban al
  siguiente cambio del usuario; sin mas cambios se perdian al cerrar la
  pestana (gap de produccion detectado revisando 13.4).
- Implementado: `SincronizadorEscrituras.conectarRecuperacion()` escucha la
  transicion a disponible del `ApiEnlaceService` y programa un empuje si hay
  escrituras fallidas pendientes; bandera `conCambiosNoEnviados` se marca al
  fallar y se limpia al tener exito; el initializer lo conecta junto a
  `observar()`.
- Verificacion: 168/168 tests de shared-lib (3 tests nuevos: re-push al
  recuperar, no re-push sin escrituras pendientes, bandera limpia tras
  exito); build y eslint limpios.
- Pendiente: verificacion en vivo del re-push contra la demo (opcional, el
  unit test cubre el ciclo completo).

## 2026-11-08 (iteracion 34: E2E automatizado del banner de estado de API)

- Justificacion: el ciclo de caida/recuperacion del banner se verifico dos
  veces a mano (iteraciones 32 y 33); sin un E2E, una regresion del sondeo o
  del banner pasaria inadvertida.
- Implementado: `e2e-banner-api.mjs` (9no script E2E): controla el contenedor
  `projecthub-api-1` con docker, verifica banner ausente con API arriba,
  aparicion con texto de modo demo al caer (~5 s), dashboard operando durante
  la caida, retirada del banner al restaurar y consola sin errores graves;
  garantiza la API arriba en el `finally`.
- Verificacion: 8/8 comprobaciones OK contra la demo dockerizada 4400.
- Commits: raiz (script copiado a tools/e2e + docs).

## 2026-11-08 (iteracion 33: demo docker con banner de API y leccion de cache)

- Justificacion: la demo dockerizada quedo con la imagen previa a la
  iteracion 32 (sin banner): la demo debe mostrar el mismo comportamiento de
  degradacion que el desarrollo.
- Implementado: rebuild de las 5 imagenes (shell + 4 remotes) con
  `docker compose -f deploy/projecthub/docker-compose.yml build` + `up -d`;
  nota en `deploy/projecthub/README.md` (ace10a3) sobre la cache de
  es-module-shims tras un rebuild y sobre el banner.
- Verificacion (Playwright, 4400): con API caida el banner aparece en ~5 s con
  "Sin conexion con el backend ... modo demo" y desaparece al restaurar
  (waitForSelector detached); navegacion y login sin errores de consola.
- Hallazgo: tras un rebuild, es-module-shims mantiene el importmap viejo en
  memoria: hubo errores `enlace.estado is not a function` hasta limpiar la
  cache HTTP (CDP Network.clearBrowserCache); con importmap fresco (zmwDjManaB)
  todo funciona. Documentado en el README del deploy.
- Commits: deploy/projecthub ace10a3, raiz 8adfc65.

## 2026-11-08 (iteracion 32: banner de estado de API + vacio explicito en tablero)

- Justificacion: auditoria DoD "estados de carga, vacio, error y sin
  permisos" en las 9 paginas: descubrio que la degradacion a modo demo
  (backend caido) era silenciosa, y que tablero-general no tenia estado
  vacio explicito.
- Implementado: `EstadoApi` ('verificando'|'disponible'|'indisponible')
  como signal en `ApiEnlaceService` + sondeo de salud `GET /api/salud`
  (15 s arriba / 5 s caido, idempotente, arrancado por el inicializador
  de entorno en `proporcionarSincronizacionBackend`); banner de aviso en
  el shell (ph-permission-banner, variante warn) visible solo con
  'indisponible'; estado vacio explicito en tablero-general (mfe-reports).
- Verificacion: 165/165 shared-lib, 25/25 shell, 6/6 mfe-reports,
  29/29 mfe-projects (`npx ng test`); build integral EXIT 0 (7 repos);
  navegador: con API caida aparece el banner (Playwright waitForSelector
  texto "Sin conexion con el backend ... modo demo"), dev server viejo
  sin HMR no tomaba el cambio: leccion reconfirmada, relanzar `ng serve`.
  Con API restaurada el estado vuelve a 'disponible' (test unitario y
  sondeo en vivo 200).
- Nota: la demo dockerizada (4400-4404) quedo construida antes del cambio
  (imagen 01:25); sin el banner hasta reconstruir (iteracion 33).
- Commits: shared-lib 426f196, shell c0d3c92, mfe-reports 5f8b6d2.

## 2026-11-08 (iteracion 31: barrido de calidad integral post-commit masivo)

- Justificacion: 19 commits de subrepos en las iteraciones 1-22; ninguna
  corrida integral de tests/build/lint despues de ellos. Puerta de calidad
  de release antes de continuar con hardening.
- Hallazgo metodologico: `npx vitest run` directo NO sirve en este workspace
  (los specs dependen del bootstrap de TestBed que inyecta el builder
  vitest de Angular; fallan con "Need to call TestBed.initTestEnvironment()").
  La forma correcta es `npx ng test` por repo o `npm test` raiz.
- Resultado tests: 7/7 repos en verde con `npx ng test` â€” shared-lib 161,
  ui-lib 40, shell 22, mfe-projects 29, mfe-admin 13, mfe-governance 20,
  mfe-reports 5 = 290 tests unitarios OK.
- Resultado builds: `node tools/run-all.mjs build` EXIT 0 â€” los 7 proyectos
  compilan en produccion (4 MFEs + shell + 2 libs ng-packagr).
- Resultado lint: `node tools/run-all.mjs lint` EXIT 0 en los 7 repos.
- Resultado backend: 109/109 pytest.
- Verificacion en vivo: remoteEntry.json 200 en 4301-4304, /api/salud 200
  en 8100, y navegador integrado sobre http://localhost:4300/login con
  sesion real activa (Diana Admin + roles + Cerrar sesion) y formulario de
  login renderizado.
- Sin cambios de codigo: el workspace estaba sano; la alerta inicial de
  "20 failed" era metodologica, no una regresion.

## 2026-11-08 (iteracion 30: cierre de items 13.1 / 13.3 / 13.4)

- Cierre documental de los tres items â—‘ de la seccion 13 (Backend) con la
  evidencia acumulada; sin cambios de codigo.
- 13.1 -> â˜‘: API REST espejo ampliada con auth JWT, /me, rutas planas y
  salud/docs; 109/109 pytest + ruff limpio; API viva en 8100 (salud 200 y
  docs 200 verificados con curl hoy).
- 13.3 -> â˜‘: el consumo de la API por el frontend quedo completo con la fase
  14 (login JWT y token en cada llamada); los 8 scripts E2E de la bateria de
  hoy corrieron con 0 recursos >= 400 contra shell 4300 + API 8100.
- 13.4 -> â˜‘: persistencia de escrituras re-verificada hoy: e2e-flujos (23)
  persiste proyecto + etapa + entregable + aprobacion tras F5 y e2e-
  transiciones (24) confirma la transicion Planteamiento -> Iniciativa
  persistida con su entrada de bitacora.
- Documento actualizado: docs/funcionalidades.md (seccion 13).

## 2026-11-08 (iteracion 29: regresion E2E de exportacion PDF)

- Justificacion: mfe-reports fue tocado despues de su ultima corrida de PDF
  (commit de lint 0e81473 y catalogo compartido de la iteracion 7); rerun de
  files/e2e-pdf.mjs para validar la exportacion por dialogo nativo.
- Resultado: 14/14 comprobaciones OK. Tablero general: boton Exportar PDF,
  dialogo de impresion invocado con titulo "Tablero general de indicadores",
  secciones Detalle por proyecto / Proyectos por etapa del ciclo de vida /
  Proyectos por estado, marca de tiempo "generado el " y celdas escapadas
  (sin script crudo). Presupuesto: boton Exportar PDF, dialogo invocado con
  titulo "Reporte de presupuesto", seccion asignado vs consumido y fila de
  totales <tfoot>. Consola sin errores ni warnings durante ambas
  exportaciones.
- Sin cambios de codigo.

## 2026-11-08 (iteracion 28: regresion E2E de widgets federados)

- Justificacion: la iteracion 22 toco la resolucion de nombres en
  mfe-projects (fuente de ProjectSummaryWidget) y el dashboard del shell
  compone widgets de 3 remotes; rerun de files/e2e-widgets.mjs.
- Resultado: 8/8 comprobaciones OK. Dashboard del shell con 4
  ph-summary-widget federados, ruta /reports/proyecto-widget carga el widget
  remote a remote sin error ("Resumen de proyecto"), exactly 1 widget montado
  en mfe-reports, avance formateado con Intl (0% / $ 0), el selector de
  proyecto cambia el resumen mostrado (PH-E2E STORE UNICO -> PH-E2E FLUJO),
  F5 en la ruta profunda recarga el widget federado y consola limpia con
  0 recursos >= 400.
- Sin cambios de codigo.

## 2026-11-08 (iteracion 27: regresion E2E federado general)

- Justificacion: la iteracion 22 y el lint de iteraciones previas tocaron el
  shell y los remotes; rerun de files/e2e-federado.mjs para validar el corazon
  de la federacion tras esos cambios.
- Hallazgo y fix del script: e2e-federado.mjs era de la era demo (pre fase 14)
  y esperaba el selector demo "Usuario activo" en el header. El producto evoluciono
  correctamente: con sesion real la identidad la determina el backend y el
  shell muestra actor autenticado + roles + "Cambiar contrasena" + "Cerrar
  sesion" (shell/src/app/user-switcher/user-switcher.ts). Se actualizo el
  script (practica ya usada en la iteracion 16 con e2e-widgets): login real
  contra la API, header verificado en modo real (Diana Admin, Cerrar sesion,
  y el selector demo ausente por diseno) y ruta profunda de F5 actualizada a
  /governance/bitacora (existente hoy).
- Resultado final: 10/10 comprobaciones OK. Shell carga con titulo ProjectHub,
  header en modo sesion real, las 4 rutas (/projects, /reports, /admin,
  /governance) renderizan sin fallback, F5 en ruta profunda del remote
  funciona, consola limpia y 0 recursos 404.
- Sin cambios de codigo de producto; solo se adapto el script E2E (archivo de
  sesion, no commiteado).

## 2026-11-08 (iteracion 26: regresion E2E del store unico)

- Justificacion: la iteracion 22 cambio el portafolio y el detalle (paginas
  alimentadas por el ProjectStore unico); rerun de files/e2e-store-unico.mjs
  para validar sesion compartida, lecturas cross-MFE y escritura visible entre
  remotes tras ese cambio.
- Resultado: 7/7 comprobaciones OK. Sesion de Diana visible en mfe-admin,
  mfe-projects lista proyectos del store, mfe-reports lee el mismo dominio,
  escritura en mfe-projects persiste en el store y se ve en
  /reports/presupuesto sin recargar la app (store unico, no copias),
  mfe-governance lee el dominio compartido y consola limpia con
  0 recursos >= 400.
- Sin cambios de codigo.

## 2026-11-08 (iteracion 25: regresion E2E de bitacora federada)

- Justificacion: la resolucion de autores por nombre en bitacora se toco en la
  iteracion 5 y la convencion de nombres se reforzo en la 22; rerun de
  files/e2e-bitacora.mjs para validar la pagina /governance/bitacora en el
  shell federado tras esos cambios.
- Resultado: 11/11 comprobaciones OK. Link Bitacora visible en el nav de
  governance, navegacion por click al URL /governance/bitacora, semilla
  renderizada con proyecto y autores resueltos por nombre (Diana Admin /
  Sergio Sponsor) y transiciones legibles "Origen -> Destino", filtro por tipo
  "Cambio" deja solo esos registros y se restaura, export CSV descarga
  bitacora-2026-11-08-0423.csv (patron de nombre con fecha), ruta profunda sin
  sesion redirige a /login?de=%2Fgovernance%2Fbitacora y consola limpia con
  0 recursos >= 400.
- Sin cambios de codigo.

## 2026-11-08 (iteracion 24: regresion E2E de transiciones de etapa)

- Justificacion: la iteracion 22 toco proyecto-detalle (filas de etapas con
  responsable resuelto), la pagina donde operan las transiciones. Rerun de
  files/e2e-transiciones.mjs para descartar regresiones.
- Resultado: 19/19 comprobaciones OK sobre shell 4300 + API 8100. Flujo del
  gate completo por UI: avance con gate cerrado rechazado con mensaje de
  dominio ("esta cerrado") y proyecto sigue en Planteamiento -> acta de
  planteamiento cargada (pendiente) -> autoaprobacion rechazada (banner de
  dominio) -> aprobacion por Sergio Sponsor -> transicion "Ir a Iniciativa"
  aceptada con "Transicion registrada en la bitacora" -> badge y bitacora
  muestran Planteamiento -> Iniciativa -> gate de la etapa destino recalculado
  (exige "Documento de iniciativa") -> sin boton de retroceso no permitido ->
  etapa y bitacora persisten tras F5 -> consola limpia, 0 recursos >= 400.
- Sin cambios de codigo; el gate de origen y el de destino, la matriz de
  permisos y el ciclo de vida se comportan igual tras el cambio de UI.
- Comandos de verificacion usados: Playwright headless (directiva del dueno:
  browser + playwright).

## 2026-11-08 (iteracion 23: regresion E2E de flujos de escritura)

- Justificacion: la iteracion 22 modifico las paginas exactas que recorre
  e2e-flujos.mjs (portafolio, detalle, etapas). Rerun completo para descartar
  regresiones de producto tras el cambio de forma de las filas del portafolio
  (patrocinadorId + nombre resuelto).
- Resultado: 14/14 comprobaciones OK sobre shell 4300 + API 8100 (Playwright
  headless). Flujo verificado de punta a punta: formulario Nuevo proyecto ->
  redireccion al detalle -> etapa "Fase E2E" creada y visible -> persiste tras
  F5 (push /api/sincronizacion + rehidratacion) -> entregable "Acta E2E 19"
  cargado y pendiente -> autoaprobacion rechazada con banner de dominio (Diana
  es autora) -> Aprobar visible para Sergio Sponsor (matriz 1.5) -> pill
  "Aprobado" y aprobador resuelto por nombre -> tarjeta Gate de etapa con
  resumen (Cerrado, faltan por cargar: 1) -> /projects/nuevo sin sesion
  redirige a /login?de=%2Fprojects%2Fnuevo -> consola sin errores de Angular
  ni singletons duplicados, 0 recursos >= 400.
- Dato extra: el gate informo "Aprobados: 0 / Pendientes de aprobacion: 0 /
  Faltan por cargar: 1" (el entregable aprobado pertenece a otra etapa del
  mismo proyecto), coherente con el dominio.
- Sin cambios de codigo: la iteracion valida la iteracion 22 en runtime.
  Verificacion adicional con navegador integrado registrada en la iteracion
  22; esta iteracion usa Playwright headless (directiva del dueno: browser +
  playwright).

## 2026-11-08 (iteracion 22: nombres de usuario resueltos en la UI)

- Defecto de produccion detectado en revision de codigo: portafolio, detalle y CSV mostraban
  IDs crudos de usuario (u-admin, u-sponsor, u-pm) en columna Patrocinador, pill
  "Patrocinador:" y columna Responsable de etapas.
- mfe-projects: portafolio y proyecto-detalle resuelven nombres via UsuarioStore con fallback
  "Sin asignar" para IDs no catalogados; el ID tecnico queda como tooltip (title) en la
  columna del portafolio y en el pill del detalle. CSV del portafolio hereda el nombre.
- ui-lib: `ph-pill` gana input opcional `title` (markup identico si no se pasa).
- Verificacion: ui-lib 40/40 tests (5 de pill nuevos), mfe-projects 29/29, lint limpio en
  ambos, builds de produccion OK. Validacion visual con navegador integrado (Playwright)
  sobre shell 4300: login Diana -> /projects muestra "Sergio Sponsor" en Patrocinador ->
  /projects/detalle/p1 muestra "Patrocinador: Sergio Sponsor" (title=u-sponsor) y
  "Paula Manager" en Responsable. Ademas: deep-link /projects/detalle/p1 sin sesion redirige
  a /login?de=... y vuelve al destino tras entrar (guard verificado de paso).
- Commits: mfe-projects 11020cb (fix) + e989b70 (refactor imports), ui-lib 583281e (feat).
  docs/funcionalidades.md 2.2 y 2.4 actualizados.

## 2026-11-08 (iteracion 21: E2E de filtros de listas)

- Cierre de la iteracion que quedo en curso por reinicio del equipo: dev servers 4300-4304 y
  backend 8100 verificados en pie, rerun de files/e2e-filtros.mjs (sesion anterior) -> 12/12
  comprobaciones OK: login Diana, portafolio 16 filas, filtro etapa=Planteamiento deja solo
  proyectos en Planteamiento, busqueda sin coincidencias muestra estado vacio, restauracion
  de filtros devuelve el listado completo, documentos cambia gate y tabla al cambiar de
  proyecto (16 opciones), bitacora filtra por proyecto (2 selects, filas solo del elegido),
  usuarios 7 filas + formulario Nuevo usuario con 6 mat-checkbox de roles, consola sin
  errores de Angular ni singletons duplicados y 0 recursos >= 400 (NG0956 incluido).
- Sin cambios de codigo: la iteracion valida filtros ya implementados. docs/funcionalidades.md
  2.3 actualizado con la validacion runtime. Scripts E2E viven en files/ de sesion (decision
  de usuario, no commiteados).

## 2026-11-08 (iteracion 19: E2E de flujos de escritura por UI)

- Primera bateria E2E que cubre escritura (no solo lectura): e2e-flujos.mjs, 14 checks,
  Playwright headless sobre shell 4300 + backend 8100. Flujo verificado de extremo a extremo:
  login Diana (Admin) -> crear proyecto "PH-E2E Flujo" por formulario (validaciones activas,
  redireccion a /projects/detalle/:id) -> crear etapa "Fase E2E" (2 inputs date + mat-select
  responsable) -> persistencia de la etapa tras F5 (push a /api/sincronizacion + rehidratacion)
  -> cargar entregable "Acta E2E 19" en /governance (queda pendiente) -> autoaprobacion
  rechazada con mensaje de dominio ("El autor de un entregable no puede aprobar su propio
  documento" en ph-permission-banner danger) -> cerrar sesion -> login sergio (Sponsor) ->
  Aprobar visible por matriz 1.5 -> pill Aprobado + aprobador resuelto -> tarjeta Gate de etapa
  visible -> proteccion /projects/nuevo sin sesion (redirige a /login) -> consola sin errores
  NG0 ni singletons duplicados, 0 recursos >= 400.
- Hallazgos: (a) la ruta de Documentos es /governance (path '' del remote); /governance/
  documentos no existe y el shell hace fallback silencioso al dashboard, leccion para
  diagnosticar: verificar URL antes de asumir bug de producto; (b) quirks de Playwright sobre
  Material: opciones deshabilitadas de mat-select llevan aria-disabled="true" (no
  mat-mdc-option-disabled), patron fiable click-select -> wait -> click-opcion-por-texto ->
  wait; (c) sin bug de producto: los 6 fallos iniciales eran URLs erroneas del script.
- Regresion: e2e-bitacora 11/11 OK durante el diagnostico. Estado: bateria de escritura 14/14.
  Scripts viven en files/ de sesion (no commiteados por decision de usuario).
- Nota de proceso: sin navegador integrado ni Playwright MCP disponibles en la sesion, los
  e2e-*.mjs (playwright-core headless) son la unica via de verificacion de navegador; se usan
  como bateria al cerrar iteracion y sondeos minimos solo para diagnostico.

## 2026-11-08 (iteracion 16: chips restantes sobre ph-pill)

- Unificacion completa del patron pill/chip: los chips de conteo del gate (documentos.html:
  Aprobados/Pendientes de aprobacion/Faltan por cargar) y la metadata de proyecto-detalle
  (mfe-projects: Patrocinador, Objetivo) migran a ph-pill. Para no duplicar criterios de
  tamano se normalizo ph-pill al formato chip (padding 0.15rem 0.6rem, font-size 0.75rem,
  sin uppercase) con el tono neutral como variante metadata; los tonos ok/info/warn/danger/
  primario conservan su semantica. ph-stage-badge sigue intacto (decision 12.3, chip nativo).
- Eliminados los ultimos estilos hand-rolled: .chip de documentos.scss (3 variantes) y .chip
  de proyecto-detalle.scss. Verificacion: ui-lib 37/37 + build + lint; mfe-governance 20/20 +
  build + lint; mfe-projects 26/26 + build + lint, todo exit 0. Commits: ui-lib dad3e6c,
  mfe-governance c4ebebd, mfe-projects fd88177.

## 2026-11-08 (iteracion 15: ph-pill en ui-lib y dedupe de pills en mfe-governance)

- Auditoria Material de las paginas nuevas de mfe-governance (documentos, bitacora): usan
  Material correcto (mat-card, mat-select, mat-form-field, mat-flat-button, ph-data-table,
  ph-permission-banner, ph-stage-badge); el unico elemento hand-rolled eran los spans .pill
  con estilos duplicados identicos en documentos.scss y bitacora.scss (tokens legacy locales).
- Nuevo componente generico ph-pill en ui-lib (Pill, selector ph-pill): input tono
  (ok|info|warn|danger|neutral|primario, default neutral) y contenido requerido; usa los
  tokens canonicos --ph-color-* de _theme.scss con fallbacks. Barrel ui.ts exporta Pill.
  3 tests nuevos (contenido+neutral por defecto, tono ok, clase base en 5 tonos): ui-lib
  37/37 (antes 34), build y lint exit 0; commit 01a1448. Correccion del spec: el segundo
  render no puede llamar configureTestingModule de nuevo (TestBed ya instanciado); los tonos
  restantes se prueban creando otra instancia del componente sobre el mismo modulo.
- Migracion en mfe-governance: gate Abierto/Cerrado y estado de entregable (documentos.html)
  y tipo de registro (bitacora.html) usan ahora ph-pill con tono derivado de la fila;
  imports Pill en documentos.ts y bitacora.ts; eliminados los bloques .pill de ambos SCSS
  (-37 lineas de CSS duplicado). Tests 20/20, build y lint exit 0; commit 93720f2.
- Los chips .chip del resumen del gate se conservan esta iteracion (conteo, no etiqueta):
  candidato a dedupe en la siguiente pasada si se generaliza el patron.

## 2026-11-08 (iteracion 13: validacion del widget remote-a-remote en runtime)

- Cierre del caveat de 11.5: E2E federado 8/8 (session files e2e-widgets.mjs) â€” mfe-reports
  consume ProjectSummaryWidget de mfe-projects por federacion, cambio de proyecto actualiza
  el widget (avance Intl 0% -> 42,4% y montos $), F5 en /reports/proyecto-widget lo recarga,
  consola limpia y 0 recursos >= 400.
- Incidente y diagnostico: al abrir el ciclo, /reports /projects /admin y /governance pintaban
  todos el fallback del shell ("Modulo no disponible") sin un solo error de consola, pageerror
  ni request >= 400; los chunks de Module respondian 200. Sondas Playwright confirmaron que
  los exposes './Widget' seguian vivos (dashboard OK) y que el remote evaluaba limpio. Causa
  raiz: dev servers con build desactualizado por cache HMR (antecedente del informe E2E
  2026-11-07). La cura fue detener los procesos de 4300 y 4302 y relanzar `npx ng serve`;
  tras el reinicio los 3 remotes renderizan sus modulos reales y el E2E pasa 8/8.
- Nota de operacion (anteproyecto de mejora): el catch silencioso de remoteConFallback()
  (shell app.routes.ts) traga la causa del fallback; cuando el modulo si carga pero el build
  esta desactualizado no queda rastro del motivo. MEJORA EJECUTADA en la iteracion 14:
  remoteConFallback delega en cargaRemote(remote, cargar?) â€” inyectable para tests â€” que
  registra en consola (console.warn) el remote y el error real antes de recurrir al fallback;
  spec nuevo app.routes.spec.ts (2 casos: exito -> remoteRoutes; fallo -> fallback '**' con
  data.remote y warn con el error). shell 22/22 tests, build y lint exit 0; commit a003638.
- Lecciones de la sonda: una sonda por ruta extraia /reports desde <main|body> y reportaba
  el widget como texto (OK) pese al fallback; la sonda fiable compara el selector del
  componente real (ph-summary-widget). Mantener ese patron en los E2E.
- Doc: docs/funcionalidades.md 11.5 actualizado con la validacion runtime y la leccion HMR.

## 2026-11-08 (iteracion 12: matriz de responsabilidades sobre mat-table)

- Ultima tabla nativa restante de la auditoria Material (12.3): matriz.html de mfe-admin
  pasa de tabla HTML a `<table mat-table>` con 11 columnas explicitas (etapa + las 10
  acciones de ACCIONES). Las celdas de accion siguen la maquetacion cruzada original:
  cada matColumnDef accede fila.celdas[i] por indice (i = posicion en ACCIONES), conserva
  la clase td.celda con [class.vacia] y el title con titulo(). El spec vigente sigue
  pasando sin cambios (td.celda.vacia se conserva).
- matriz.ts gana readonly columnas = ['etapa', ...ACCIONES] y MatTableModule en imports;
  matriz.scss ajusta selectores a th.mat-mdc-header-cell / td.mat-mdc-cell, conservando
  fondo de etapa, color primario de celda y bordes.
- Verificacion: mfe-admin 13/13 tests (vitest), build exit 0, lint exit 0.
- Commit: mfe-admin c2d7f58 (refactor). Sin push.

## 2026-11-08 (iteracion 11: tabla de presupuesto sobre ph-data-table)

- Auditoria Material transversal (12.3/1.7): los botones de todos los remotes ya usan
  mat-button/mat-flat-button; quedaban 2 tablas nativas (presupuesto en mfe-reports y
  matriz en mfe-admin).
- `ph-data-table` (ui-lib) gana input `pie` opcional: renderiza una mat-footer-row que
  reutiliza las plantillas #cell de las columnas; oculta el pie si no se pasa. 2 tests
  nuevos (34/34 en ui-lib). Commit ui-lib 8148391.
- Presupuesto (mfe-reports) migrado de tabla nativa a ph-data-table con pie de totales;
  se conservan los resaltados negativa/positiva por plantilla. Commit mfe-reports 671dca1.
- Verificacion: ui-lib 34/34 + build + lint exit 0; mfe-reports 5/5 + build + lint exit 0.
- Pendiente iteracion 12: matriz de mfe-admin (tabla cruzada con th por fila; requiere
  evaluar si mat-table aporta o si conserva su maquetacion).

## 2026-11-08 (iteracion 10: fechaHora en IntlFormat)

- `IntlFormat` de ui-lib gana `fechaHora()` (fecha + hora:minuto) y `fechaHoraSegundos()`
  (fecha + hora:minuto:segundo), delegando en un helper privado compartido con `fecha()`.
  Locale es-CO, guion '-' para null/invalid. 3 tests nuevos (32/32 en ui-lib).
  Leccion: es-CO formatea en 12 h ('02:05 p. m.' para 14:05), no 24 h.
- Consumidores: mfe-governance Bitacora (`this.intl.fechaHora(b.fecha)`) y mfe-projects
  proyecto-detalle (`fechaBitacora()` delega en `this.intl.fechaHora(valor)`, comentario
  de parseo ISO conservado).
- Verificacion: mfe-governance 20/20 (asercion de orden actualizada al formato 12 h),
  build y lint exit 0; mfe-projects 26/26, build y lint exit 0.
- Commits: ui-lib 982ca32, mfe-governance 41cb28b, mfe-projects 08dd5a4.

## 2026-11-08 (iteracion 9: dedupe de NavGovernance)

- NavGovernance de mfe-governance (ts/html/scss/spec, 2 tests propios) eliminado en favor
  de `ph-section-nav` de @projecthub/ui, que ya cubre su comportamiento (exact en la raiz
  /governance y prefijo para /governance/bitacora). Las paginas Documentos y Bitacora
  definen navLinks y renderizan el componente compartido.
- Verificacion: mfe-governance 20/20 tests (antes 22, -2 al retirar el spec del
  componente), build y lint exit 0. Commit mfe-governance 1e37c1d.

## 2026-11-08 (iteracion 8: componente generico ph-section-nav)

- Nuevo componente genÃ©rico `ph-section-nav` en ui-lib (`lib/section-nav`): nav de
  secciones en pills con RouterLink/RouterLinkActive, inputs `links` (required),
  `ariaLabel` y `exact`; `[routerLinkActiveOptions]` con exact solo para el primer
  enlace (raiz) y prefijo para el resto. Estilos con tokens `--ph-color-*` y fallbacks.
  2 tests nuevos en ui-lib (30/30); leccion: no leer `input.required()` en tiempo de
  construccion del componente (NG0950) y asertar `href` (RouterLink no refleja el
  property binding como atributo).
- Consumidores: mfe-reports (tablero-general, presupuesto) y mfe-admin (usuarios,
  matriz; matriz pierde su boton RouterLink puntual). Specs de tablero-general y
  presupuesto necesitaron `provideRouter([])` nuevo; usuarios y matriz ya lo tenian.
- Correccion durante verificacion: un `PromptDialogService` quedo accidentalmente en el
  array `imports` del componente Usuarios (NG2012, es un servicio); retirado.
- Verificacion: ui-lib 30/30 + build + lint exit 0; mfe-reports 5/5 + build + lint;
  mfe-admin 13/13 + build + lint.
- Commits: ui-lib 2705727 (feat), mfe-reports 2515df3 (feat), mfe-admin c7c1e4b (feat).
- Pendiente para iteraciones siguientes: deduplicar NavGovernance de mfe-governance
  sobre ph-section-nav (patron original que generaliza), y E2E federado del nav.

## 2026-11-08 (iteracion 7: catalogo compartido de tipos de bitacora)

- Deduplicacion del catalogo de tipos de registro de bitacora, que vivia duplicado en
  mfe-governance (constantes locales de la pagina Bitacora) y como ternarios inline en
  proyecto-detalle.ts de mfe-projects (regla de negocio fuera de shared-lib).
- shared-lib `domain/catalogos.ts`: `TIPOS_BITACORA` (const `as const`),
  `TipoBitacora` (type derivado) y `ETIQUETA_TIPO_BITACORA` (Record readonly con
  etiquetas Transicion/Aprobacion/Cambio), junto a los catalogos existentes.
  `BitacoraEntrada.tipo` pasa a estar tipada con `TipoBitacora`.
- Nuevo `catalogos.spec.ts` (4 tests: conteo de tipos, etiqueta por tipo, tipado de
  BitacoraEntrada con entrada real y coherencia de conteos de catalogos existentes).
- Rewire de consumidores: bitacora.ts de mfe-governance ya no define tipos ni etiquetas
  locales; proyecto-detalle.ts de mfe-projects delega en `ETIQUETA_TIPO_BITACORA`.
- Verificacion: shared-lib 157/157 tests (runner oficial `npm test -- --watch=false`;
  nota: `npx vitest run` directo falla en specs de stores por TestBed
  initTestEnvironment, preexistente y ajeno a este cambio), build+lint exit 0;
  mfe-governance 22/22 + build + lint; mfe-projects 26/26 + build + lint.
- Commits: shared-lib aac61cc (feat), mfe-governance 0404ae5 (refactor), mfe-projects
  245d5e8 (refactor). Durante el rewiring el build de mfe-governance fallo una vez por
  una referencia residual a la constante eliminada (TS2552), corregida reutilizando la
  propiedad ya expuesta en el componente.

## 2026-11-08 (lint backend con ruff)

- Lint formal del backend (fase 0-8, deuda 11.4 extendida): `pyproject.toml` nuevo con
  ruff 0.17.4 (line-length 120, reglas E/F/I/B/UP, isort first-party `app`, formato con
  comillas dobles). B008 se permite para `fastapi.Depends/Query/Header` via
  extend-immutable-calls: Depends() en defaults de parametros es el patron idiomatico de
  FastAPI.
- Primer check: 121 errores (50 B008, 35 E501, 10 F401, 9 E402, 5 UP031, 5 I001, 3 UP017,
  y otros). Correcciones: E402 en servicio.py (logger intercalado entre imports, movido
  abajo), UP031 % -> f-strings a mano en dependencias.py y servicio.py preservando el
  texto exacto de los mensajes (los tests los validan), resto con `ruff check --fix`
  (imports sin uso, orden isort, datetime.timezone.utc -> UTC, logging % -> f-string,
  f-string sin placeholders).
- `ruff format .`: 10 archivos reformateados (semilla.py y calculos.py los de mayor
  diff: datos de semilla envueltos). Revisado el diff: sin cambios semanticos.
- Verificacion final: `ruff check .` exit 0 y pytest 109/109 (7.65s) tras el formato.
- requirements.txt: `ruff>=0.17` anadido (el repo no separa dev-dependencies; el
  Dockerfile del api lo instala sin impacto). Commit backend 5ba04b5.
- Con esto, lint formal queda cerrado en los 8 repos (7 frontend + backend). Pendiente
  derivado: evaluar gate de lint en el DoD (seccion 5 del handoff).

## 2026-11-08 (lint formal en los 7 repos frontend)

- Deuda 11.4 cerrada: eslint 9 + typescript-eslint 8 + angular-eslint 22 (flat config) en
  shell, mfe-projects, mfe-reports, mfe-admin, mfe-governance, shared-lib y ui-lib.
  Script `lint` por repo; verificacion lint+tests+build verde y commit en los 7
  (shell 8ef80c9, mfe-projects ec15cff, mfe-reports 0e81473, mfe-admin 8e0df10,
  mfe-governance daf2e3f, shared-lib b1a671b, ui-lib 15b77bf).
- Convencion de prefijos de selector, documentada en cada eslint.config.mjs: `ph` = API
  publica compartida (widgets federados y componentes de ui-lib), `app` = resto. Los MFEs
  usan ['app','ph']; ui-lib ['ph','app']; shared-lib sin angular-eslint (dominio) con
  no-explicit-any en error.
- Fixes que destapo el linter: imports/variables sin uso (sesionStore en shell,
  UsuarioStore en mfe-admin, ApiEnlaceService y `enlace` en specs de shared-lib,
  ComponentFixture en 3 specs de ui-lib) y hosts de spec renombrados a `app-*`
  (prohibido el prefijo reservado `spec-`/`test-`).
- ui-lib: `ph-data-table-column` es una @Directive con selector de elemento (API
  declarativa de la columna de la data table); se valido con configs duales de
  directive-selector. La forma plana (dos objetos tras 'error') no pasa el esquema de
  ESLint (array-form maxItems 1 por opcion): la forma correcta es anidar el arreglo
  (option 2 = arreglo de 1-2 configs), y angular-eslint elige la config por tipo real
  del selector (atributo camelCase, elemento kebab-case).
- Totales de tests sin cambio: 237 frontend + 109 backend.
- Pendiente derivado: lint del backend (ruff) y evaluar gate de lint en el DoD.

## 2026-11-05

- Sesion: arranque del proyecto. Bootstrap de `.ops/` (OKF 0.2) con arboles product, project,
  governance, qa, implementations y templates; plan de 9 fases derivado de
  `docs/funcionalidades.md`; backlog inicial BL-001..BL-013; REQ-001..REQ-011 propuestos.
- Entorno verificado: node v24.21.0, npm 11.19.0, Docker 29.8.2, Docker Compose v5.6.0.
- Restriccion de puertos: el rango 4200-4204 esta ocupado en el host. Decision de entorno:
  desarrollo local en 4300-4304 (shell 4300, mfe-projects 4301, mfe-reports 4302, mfe-admin
  4303, mfe-governance 4304); Docker publica en 4400-4404. Los puertos del rulebook (4200-4204)
  quedan como contrato logico; el mapeo fisico vive en configuracion (env/compose), nunca en
  literales de codigo.
- Siguiente paso: fase 0 - workspace Angular 22 + Native Federation + modelos.
- Pivote de arquitectura (instruccion del propietario): multirepo, no monorepo. Un repositorio
  Git por desarrollo: `shell`, `mfe-projects`, `mfe-reports`, `mfe-admin`, `mfe-governance`,
  `shared-lib`, `ui-lib`, `deploy` (docker/compose) y `backend` (placeholder documentado).
  Registrado como DEC-003 (abierta, resolucion del propietario) y aplicado a las
  especificaciones: docs/funcionalidades.md 8.1, plan.md, backlog, fase-0, IMPL-001, IMPL-002.
  AGENTS.md seccion 1 (Estructura) queda contradicha; su correccion la pide el propietario.
- Limpieza: eliminado `projecthub-ref/` (scaffold de referencia). El `package.json` de raiz
  queda como orquestador de scripts (sin codigo de app); `node_modules` de raiz se elimina
  cuando los repos tengan sus propias dependencias.
- Siguiente paso: fase 0 - scaffold de repos multirepo (shell host + 4 remotes + 2 libs +
  deploy) con puertos 4300-4304 en dev y 4400-4404 en Docker.
- Fase 0 ejecutada (IMPL-001): 7 repos con git propio (shell, mfe-projects, mfe-reports,
  mfe-admin, mfe-governance, shared-lib, ui-lib) + raiz orquestadora (tools/run-all.mjs,
  start-dev.mjs, bootstrap-repos.mjs). Libs consumidas por `file:../<lib>/dist/...`.
  Builds prod exit 0 en los 7. Smoke dev 4300-4304: remoteEntry 200 en los 5, navegacion,
  F5 en ruta profunda. Fix ngDevMode (define en main.ts antes de initFederation).
  Leccion: el dev server NF contamina dist con artefactos -dev; para Docker, build fresco.
- Deploy Docker (IMPL-001, item 8.3): `deploy/projecthub/` con shell.Dockerfile,
  remote.Dockerfile (parametrizado por ARG_REPO), nginx con SPA fallback y CORS (el runtime
  del shell hace fetch cross-origin de remoteEntry.json; nginx reemplaza add_header
  heredado cuando el location define el suyo), compose 4400-4404 y manifest Docker con
  URLs 440x. 5 imagenes construidas; stack verificado: remoteEntry 200 en 4400-4404,
  navegacion a las 4 rutas, F5 en /governance, consola limpia. `.dockerignore` en raiz
  (node_modules/dist/.git fuera del contexto).
- Backend placeholder (item 10.3 fuera de alcance): `backend/README.md` documenta el
  contrato previsto (FastAPI); sin codigo ejecutable.
- IMPL-002 (dominio en shared-lib): catalogos, errores (6 subclases con mensajes en
  espanol), grafo de ciclo de vida con retrocesos acotados, matriz de permisos 9x10,
  modelos (Proyecto, EtapaTrabajo, Usuario, Entregable, BitacoraEntrada, PermisoMatriz),
  calculos (avance ponderado por duracion, presupuesto/consumo, desviacion, validaciones).
  Scaffold Angular del generador eliminado; public-api.ts exporta solo dominio puro.
  Tests: 31 en verde (vitest). Build de la lib exit 0.
- Singleton check: ninguna app importa todavia `@projecthub/shared` (solo declarada en
  package.json por `file:`). Angular/rxjs/tslib ya viajan como singletons con strictVersion
  en los remoteEntry. Al importar la lib, agregarla al shared config de cada federation
  config.
- Siguiente paso: commits por repo; luego fase 1 (stores + sesion) segun plan.

## Fases 1-7 (registro consolidado de sesiones previas)

- Fase 1 (dominio): ciclo de vida completo de 9 etapas con transiciones y retrocesos
  acotados, gates de etapa (checklist de entregables + aprobaciones), matriz de permisos
  9x10, errores de dominio con mensajes en espanol. Todo en `@projecthub/shared`.
- Fase 2 (stores y sesion): ProjectStore y stores acompanantes como instancia unica
  resuelta por InjectionToken; sesion simulada con usuario activo; datos semilla.
- Fase 3 (ui-lib): componentes base de presentacion (SummaryWidget y acompanantes) con
  tema SCSS compartido; Gantt propio en SVG/CSS (sin librerias externas, decision del
  proyecto).
- Fase 4 (mfe-projects): portafolio, detalle de proyecto, etapas de trabajo, presupuesto
  y ProjectSummaryWidget federado. Fix NG0203 en tests de widgets con signals:
  vitest-base.config.mts + `"runnerConfig": true` en el target test de angular.json.
- Fase 5 (mfe-admin): usuarios, roles y matriz de responsabilidades.
- Fase 6 (mfe-reports): reportes y PortfolioKpiWidget (remote a remote, consume
  ProjectStore compartido).
- Fase 7 (shell): Dashboard con 3 widgets federados (mfe-projects, mfe-reports,
  mfe-governance) via loadRemoteModule + NgComponentOutlet con fallback por celda;
  UserSwitcher (selector de usuario activo, solo usuarios activos, badges de rol);
  RemoteFallback para degradacion elegante de remotes caidos; rutas con helper
  remoteConFallback(). GateStatusWidget creado en mfe-governance y expuesto como
  './Widget'. Commits: 86a4567 (mfe-governance), b5bfb26 (mfe-reports), 7ae2a6a (shell),
  ac51a34 (docs raiz).
- Integracion (fase 8, parcial): tests verdes en los 7 repos: shared-lib 98, ui-lib 18,
  mfe-projects 26, mfe-admin 13, mfe-reports 5, mfe-governance 3, shell 6 = 169 tests.
  Builds prod exit 0 en los 7.
- Fix real en tools/start-dev.mjs: usaba readFileSync sin importarlo (ReferenceError al
  filtrar repos con package.json). Corregido; pendiente de commit.
- Leccion ngDevMode (reincidencia): dev servers vivos desde antes de un build prod sirven
  el import map viejo con chunks de prod -> ReferenceError: ngDevMode is not defined.
  Tras alternar builds prod/dev, reiniciar los 5 dev servers o limpiar
  node_modules/.cache/native-federation.

## 2026-11-05 (sesion actual)

- Hallazgo de puertos (feedback del propietario): la evidencia mezclaba stacks sin
  etiquetar. Contrato vigente (DEC-001): dev = 4300-4304 (npm), docker = 4400-4404
  (compose). Verificado con docker ps: los contenedores projecthub-* llevaban 4 horas
  arriba con imagenes construidas ANTES de las fases 5-7 -> el navegador en 4400 mostraba
  contenido viejo. Causa documentada, no bug de la app.
- Politica de proteccion de comandos (pedido del propietario): creada
  `.ops/development/command-safety.md` (arbol development nuevo). Prohibido descartar
  salida que se espera observar (2>&1 | Out-Null); builds largos con Tee-Object a
  .dev-logs/; exit code no sustituye a la salida; evidencia etiquetada por stack;
  verificar antiguedad/hash del artefacto antes de juzgar un stack.
- Rebuild Docker re-ejecutado con salida visible: `docker compose build 2>&1 |
  Tee-Object -FilePath .dev-logs/docker-build.log` (log en .dev-logs/docker-build.log).
  Estado previo verificado: contenedores e imagenes con 4h de antiguedad (el rebuild
  interrumpido no habia dejado nada).
- Fix de .dockerignore: los patrones sin `**/` no excluyen node_modules anidados de cada
  repo del multirepo -> contexto de build de ~1.7GB y 200s+ solo transfiriendo. Con
  `**/node_modules` etc., el build completo de 5 imagenes baja a ~4 minutos.
- Bug real corregido en shell (commit 342593b): `remoteConFallback()` devolvia `Routes`
  (arreglo) y el punto de uso lo expandia con spread dentro del objeto de ruta
  `{ path: 'projects', ...[...] }` -> propiedades indice en vez de fusion: NG04014
  "Invalid configuration of route 'projects'" y main vacio en rutas de remotes. Los 6
  tests del shell pasaban porque probaban el arreglo interno, no el punto de uso. Fix:
  devolver `Route` (objeto). Leccion: el spread de arreglos dentro de objetos no fusiona.
- Verificacion de punta a punta tras el fix:
  - dev (4300-4304): remoteEntry 200 en los 5; /governance con F5 directo renderiza el
    remote; tests shell 6/6; build prod exit 0.
  - docker (4400-4404): imagenes reconstruidas (antiguedad < 1 min al verificar);
    remoteEntry 200 en los 5; navegacion a /, /projects, /reports, /admin, /governance;
    F5 en /governance; dashboard con los 3 widgets federados con datos; UserSwitcher
    cambia sesion y mfe-admin reacciona via store compartido (Nuevo usuario/Acciones
    aparecen con Diana Admin; Ivan Inactivo sin boton Desactivar); consola sin warnings
    de singletons duplicados ni errores.
- ngDevMode reincidio al ejecutar el build prod del shell con dev servers vivos: aplicada
  la leccion documentada (reiniciar los 5 dev servers tras alternar builds prod/dev).

## 2026-11-06 (sesion RC2->RC3, continuacion)

- Migracion Angular Material (DEC-005) completada: skip list de Native Federation corregido
  (los wildcards NO funcionan; predicados funcion `(pkg) => pkg.startsWith('@angular-devkit')`,
  `'@schematics/'`, `'source-map-support'`, `'oxc-parser'` y exacto `'@angular/cdk/schematics'`
  - el secondary toxico re-exporta @schematics/angular con builtins node). Builds prod de los
  5 apps verdes. Tests de los 4 remotes arreglados: NG0203 MAT_CARD_CONFIG por doble
  instancia de @angular/material en el grafo de test (via @projecthub/ui file: junction);
  fix con `dedupe: ['@angular/material', '@angular/cdk', ...]` en `vitest-base.config.mts`
  de los 4 remotes. Suites finales: shell 15/15, shared-lib 125/125, ui-lib 21/21,
  mfe-projects 26/26, mfe-reports 5/5, mfe-admin 13/13, mfe-governance 3/3.
- Backend FastAPI: 68 tests verdes verificados (pytest --tb=no en .venv).
- DEC-006 registrada (orden del propietario): persistencia del backend con PostgreSQL 17 en
  contenedor Docker (compose en backend/, puerto host 5433, volumen nombrado, healthcheck,
  DATABASE_URL, fallback en memoria). docs/funcionalidades.md: seccion 13 Backend nueva
  (13.1 API 68 tests verdes; 13.2 PostgreSQL/Docker planificado; 13.3 HttpClient en stores);
  10.3 en curso; orden de implementacion con fase 10 backend.

## 2026-11-06 (fase 13: persistencia y http-stores)

- 13.2 Persistencia PostgreSQL completada: app/almacen.py (RepositorioPostgres con psycopg3,
  JSONB camelCase, upsert ON CONFLICT, re-sync total; RepositorioMemoria como default),
  inyeccion en ServicioProyectos sin cambiar sus 42 metodos, _crear_repositorio() en main.py
  con DATABASE_URL y fallback a memoria, docker-compose.yml (postgres:17-alpine, host 5433),
  requirements + psycopg[binary]. Tests 76/76 con roundtrip real (BD efimera projecthub_test);
  smoke HTTP contra Postgres OK (GET/POST persisten).
- RC3 cerrada: rama RC3/dev + tag rc3 en los 9 repos (8 submodulos + meta).
- 13.3 http-stores completado: ApiEnlaceService (timeout 2500ms, X-Actor-Id, API_BASE_URL,
  disponibilidad con listeners), sincronizarStores() (5 colecciones -> stores, fallback a
  semilla), cargarDesdeBackend en ProjectStore/UsuarioStore, provideAppInitializer en shell y
  4 remotes con provideHttpClient. Fix NG0203: sincronizarStores debe correr en contexto de
  inyeccion (TestBed.runInInjectionContext en tests). shared-lib 130/130, builds de los 5 apps
  verdes. Pendiente: escrituras via API (hoy solo lectura inicial).

## 2026-11-06 (fase 13.4: escrituras del frontend persistidas)

- Backend: GET/PUT /api/sincronizacion. El PUT reemplaza el estado completo
  (5 colecciones) validando forma (listas, ids unicos) y modelos Pydantic;
  persiste por el repositorio (memoria o Postgres). 6 tests nuevos: 82/82.
- shared-lib: SincronizadorEscrituras con effect() sobre las senales de los
  stores, debounce 400ms (runOutsideAngular), single-flight y reprogramacion
  si hubo cambios durante el envio. 2 tests: 132/132.
- Cableado en shell y 4 remotes (factory que llama observar()); builds 5/5.
- Verificado E2E parcial: uvicorn 8111 -> GET /api/sincronizacion con las 5
  colecciones de semilla; PUT vacio reemplaza el estado (comportamiento
  esperado del re-sync total, cubierto por test roundtrip camelCase).
- Pendiente en la fase: refresco de stores desde respuesta del servidor y
  verificacion E2E con navegador contra dist.

## 2026-11-06 (fase 13.4, cierre: refresco de stores + exposes + E2E navegador)

- shared-lib: `aplicarRespuesta()` aplica el estado del backend a UsuarioStore y
  ProjectStore tras cada push exitoso. Supresion de eco por identidad de
  referencias (`esEcoDelServidor` + campo `aplicada`): un flag booleano no
  funciona porque los effects no corren sincronos con la escritura de la senal.
- Nuevo provider `proporcionarSincronizacionBackend()`: ENVIRONMENT_INITIALIZER
  (observar()) + provideAppInitializer (sincronizarStores + preparar()),
  capturando la referencia del servicio antes del await. Corrige el NG0203
  "SincronizadorEscrituras injection failed" del arranque en el navegador.
  shared-lib: 137/137 tests, build ok.
- Fix critico: los 4 remotes y el shell servian `remoteEntry.json` con
  `exposes: []`. Los `exposes` de `federation.config.mjs` se habian perdido
  ('./Module' en los 4; './Widget' en mfe-projects, mfe-reports y
  mfe-governance). Restaurados; el dashboard volvio a componer los 3 widgets.
- Verificacion E2E con navegador (dev 4300-4304, backend 8100/Postgres):
  dashboard con los 3 widgets, sesion Diana Admin (rol Admin visible),
  navegacion a /projects con los 6 proyectos de semilla, creacion de
  "Proyecto E2E sincronizacion" via UI -> PUT persistido en el backend
  (GET /api/sincronizacion lo devuelve, presupuesto 120000000),
  recarga F5: el proyecto sigue y el dashboard muestra 6 de 7 activos
  (recuperacion desde el servidor funciona). 404 residuales en consola son
  recursos del dev server, no de la app.
- Tests/apps: shell 15/15, mfe-projects 5 archivos, mfe-reports 5, mfe-admin 3,
  mfe-governance 2 (todos verdes); builds de produccion 5/5.
- Commits: shared-lib feat (refresco + provider), 5 apps fix (provider +
  exposes restaurados).
- Leccion nueva: cambiar `federation.config.mjs` (exposes) exige reiniciar los
  dev servers; el remoteEntry.json se genera al arranque, no en watch.

## 2026-11-06 (fase 14: autenticacion real + cierre documental)

- Cierre documental pendiente: commit del backend (load_dotenv + python-dotenv,
  ya estaba en el arbol sin commit). Bug corregido en el camino: load_dotenv()
  restauraba DATABASE_URL desde .env dentro de los tests de API y estos mutaban
  la BD dev de Postgres (409 en transiciones). Fix: tests/conftest.py fija
  DATABASE_URL="" (load_dotenv no sobreescribe variables existentes). 101/101.
- Fase 14 (10.3, autenticacion real) implementada:
  - Backend: app/auth.py (PBKDF2-HMAC-SHA256 stdlib, 240k iteraciones; JWT
    HS256 con PyJWT; credenciales en memoria sembradas de forma perezosa con
    AUTH_CONTRASENA_DEMO), POST /api/auth/login, GET /api/auth/me, Bearer con
    prioridad sobre X-Actor-Id (compatibilidad), CORS + Authorization.
    tests/test_auth.py: 19 tests nuevos (101/101). Smoke HTTP real: login,
    me, 401/403/422.
  - shared-lib: AutenticacionService (login, restaurarSesion via /me en el
    initializer, cerrarSesion), TokenAlmacen (localStorage), Bearer automatico
    en ApiEnlaceService, SesionStore.registrarUsuario, actor de escrituras
    (13.4) = usuario de la sesion. 148/148 tests.
  - shell: pantalla /login, sesionGuard redirige a /login con backend
    disponible (al dashboard en modo demo, degradacion elegante), area de
    sesion con usuario autenticado + Cerrar sesion (selector de usuarios solo
    en demo). 20/20 tests.
  - Builds prod de los 5 apps exit 0; tests de los 4 remotes y ui-lib verdes
    (26/5/13/3/21).
  - E2E con navegador (dev 4300-4304 + backend 8100/Postgres): /projects sin
    sesion redirige a /login?de=%2Fprojects; contrasena incorrecta muestra
    "Correo o contrasena incorrectos."; login Diana Admin reanuda el destino;
    F5 restaura sesion via /api/auth/me; creacion de "Proyecto E2E
    autenticacion" via UI persistida en el backend con Bearer (verificada por
    GET /api/proyectos); Cerrar sesion vuelve a /login y borra el token.
  - Limitacion documentada (14.5, DEC pendiente): credenciales en memoria del
    proceso; sin endpoint de cambio de contrasena. AUTH_SECRET del .env de
    dev (gitignored); en prod debe definirse o los tokens no sobreviven al
    reinicio.
- Commits: backend (load_dotenv, conftest, auth), shared-lib (autenticacion),
  shell (login + guard + user-switcher). Push pendiente al cierre.

## 2026-11-07

- Fase 14.5 (gestion de contrasenas persistida) implementada de punta a punta,
  cerrando la DEC pendiente como DEC-007 (credenciales en tabla propia).
  - Backend: `ServicioCredenciales` respaldado por repositorio (Postgres con
    DATABASE_URL, memoria como fallback); metodos autenticar/registrar/cambiar/
    renombrar/sincronizar_con_usuarios; politica LONGITUD_MINIMA_CONTRASENA=8.
    Endpoint `PUT /api/auth/contrasena` (401 CONTRASENA_ACTUAL_INVALIDA, 422
    VALIDACION). Al editar el correo de un usuario la credencial se renombra;
    al escribir el estado se limpian huerfanos. Tabla `credenciales(correo PK,
    hash)` creada por `crear_esquema()`; `main.py` construye el repositorio y
    lo inyecta tarde en el servicio (`asignar_credenciales`).
  - Frontend: `AutenticacionService.cambiarContrasena(actual, nueva)` en
    shared-lib (maneja las dos formas de error: {codigo,mensaje} raiz y
    {detail:{...}} de HTTPException); pantalla `/perfil` en el shell con
    validacion cliente (longitud, coincidencia) y mensajes de error/exito;
    boton "Cambiar contrasena" en el area de sesion real del UserSwitcher.
    Rebuild de shared-lib dist (las apps la consumen por file:../dist).
  - Verificacion (evidencia por stack, politica de ahorro del propietario:
    corridas puntuales, no suites repetidas):
    - Tests puntuales: backend tests/test_auth.py 23/23 (incluye 4 nuevos de
      cambio de contrasena) y tests/test_api.py 1/1; shared-lib 152/152.
    - E2E dev (curl contra 8100 + Postgres 5433 via docker compose): login
      demo -> cambio 200 -> login nueva 200 -> login vieja 401 -> restaurar.
      Persistencia probada matando y reiniciando uvicorn: la nueva clave
      siguio validando tras el reinicio.
    - E2E Docker (build shell en imagen 2026-11-07, stack 4400-4404): probes
      200 en / y remoteEntry de 4401-4404; con navegador en 4400: cambio por
      UI, logout, re-login con la nueva, error 401 visible con actual
      incorrecta, F5 en /perfil (sesion restaurada), restauracion a demo via
      UI y verificacion final del login demo contra 8100.
  - Nota de arquitectura verificada en Docker: el compose 4400-4404 no tiene
    servicio de API; los frontend usan `API_BASE_URL` por defecto
    (http://localhost:8100, shared-lib/api-enlace.ts). El stack Docker consume
    el backend del host (DEC-002); `/api` en el nginx del shell no existe y
    responde 405 a POST (SPA fallback). Registrar servicio API en el compose
    queda como trabajo pendiente.
  - Docs: DEC-007, plan.md fase 14 implementado, funcionalidades.md 14.5
    marcado, handoff.md actualizado.
- Certificacion (REL-001, .ops/operations/releases.md): corrida consolidada
    unica backend pytest 105/105 y shared-lib ng test 152/152; fix detectado
    por los tests y corregido: cambiarContrasena leia el token del signal
    espejo y no de TokenAlmacen (el guard fallaba si el token se escribio
    fuera del servicio); rebuild de shared-lib dist, imagen shell y smoke
    /perfil en 4400. Lint: sin script en los repos (el build estricto cubre
    tipos); sin suites repetidas por la politica de ahorro del propietario.
- Commits: backend (feat credenciales persistidas), shared-lib (feat cambio),
  shell (feat perfil), raiz (docs de fase 14.5). Push pendiente al cierre.

## 2026-11-07 (migracion Material por componentes, cierre 12.5)

- Complemento de la migracion Angular Material (DEC-005): las paginas que
  quedaban en HTML nativo migraron a componentes Material, repo por repo:
  ui-lib 9b8c11b (PromptDialogService @Injectable), mfe-projects 7c915f6,
  mfe-admin d3d90ba, mfe-reports d9fe54c, mfe-governance 800a575 (layout
  con nav + router-outlet y placeholder con mat-card), shell a057140.
- shell (a057140): user-switcher con mat-select (opcion Sin sesion disabled,
  seleccionar() publico) y mat-button; login y perfil con ph-form-field
  (DEC-005) + input matInput + mat-flat-button; dashboard con mat-select de
  proyecto. Fix de tests: dedupe de @angular/material y @angular/cdk en
  vitest-base.config.mts (NG0203 por doble Angular via @projecthub/ui).
  Header/nav se mantienen con anchors semanticos (sin beneficio Material).
- Verificacion: shell 20/20 tests, build prod OK (150.99 kB). Suites de
  remotes/ui-lib/shared-lib verdes en sus commits. Estado git limpio en los
  9 repos; sin push (politica del propietario).

- Verificacion federada E2E (post a057140, sesion 2026-11-07): el dev server
  del shell servia un build desactualizado (chunk con UserSwitcher en select
  nativo); reinicio y relanzamiento de ng serve --port 4300 lo resolvio.
  Playwright headless en modo demo: 12/12 OK (mat-select/mat-form-field en
  user-switcher, 7 opciones en overlay CDK, cambio de usuario refleja en UI,
  /projects /reports /admin /governance sin fallback, F5 en ruta profunda
  /governance/decisiones OK, consola sin errores Angular ni singletons
  duplicados). Deuda no bloqueante: 24 peticiones 404 en runtime porque
  Sincronizacion consume /api/etapas, /api/entregables y /api/bitacora planas
  que el backend no expone (los remotes degradan con elegancia). Informe en
  session files (e2e-informe-2026-11-07.md).

## 2026-11-08 (rutas planas del backend + fix de push en modo demo)

- Backend (96fa534): 3 GET planos `GET /api/etapas`, `GET /api/entregables` y
  `GET /api/bitacora` (sin filtro de proyecto) en rutas.py + metodos de
  coleccion etapas()/entregables()/bitacora() en servicio.py. Tests: 4 nuevos
  en test_api.py (colecciones planas + consistencia contra /api/sincronizacion);
  suite backend 109/109.
- shared-lib (3f48335): fix de 404 en `PUT /api/sincronizacion` desde el
  navegador. Causa raiz: en modo demo sin usuario activo, actorId() devolvia
  'sistema' como fallback y el backend rechazaba con 404
  (ENTIDAD_NO_ENCONTRADA: el usuario 'sistema' no existe; reproducido con
  curl: X-Actor-Id: sistema -> 404 {"codigo":"ENTIDAD_NO_ENCONTRADA"}).
  Fix: actorId() devuelve null sin sesion y empujar() no envia nada (los
  cambios de demo son efimeros). Test nuevo: no empuja sin sesion activa;
  suite shared-lib 153/153.
- Distribucion del fix: `npx ng build` de shared-lib + reinicio de los 5 dev
  servers con `.angular/cache` limpia (el prebundle de Vite servia el dist
  viejo; tocar app.config.ts no basto). Leccion: tras cambiar una lib
  consumida por `file:../dist`, rebuild + reinicio de servers con cache
  limpia.
- E2E federado (Playwright, dev 4300-4304 + backend 8100): 12/12 OK con
  **0 recursos 404** (antes: 6 x PUT 404 + 24 rutas planas 404). Endurecido
  e2e-federado.mjs: los 404 ahora fallan el run; listener de responses >=400
  con STATUS/METHOD/URL.
- Commits: backend 96fa534 (feat), shared-lib 3f48335 (fix). Sin push
  (politica del propietario).

## 2026-11-08 (API y db Postgres dentro del compose demo)

- Objetivo (deuda del handoff, seccion 7): los frontends de la demo llaman a
  `http://localhost:8100` por defecto (API_BASE_URL) y ese puerto no tenia
  servicio en el compose. Se agrego la API y su db al stack demo.
- deploy (1deb0b8): `api.Dockerfile` nuevo (python:3.14-slim, pip install de
  requirements.txt, CMD uvicorn app.main:app --port 8100) y servicio `api`
  + servicio `db` (postgres:17-alpine con healthcheck pg_isready) en
  `docker-compose.yml`, con volumen `projecthub_pgdata_demo` y dependencia
  `condition: service_healthy`. DATABASE_URL y AUTH_SECRET sobreescribibles
  por entorno (`${VAR:-default}`). Puerto host de la db demo: 5434 (el 5433
  lo ocupa la db de desarrollo del compose del backend).
- Ajuste: el AUTH_SECRET inicial de 30 bytes disparaba
  InsecureKeyLengthWarning (RFC 7518 exige >= 32 para HMAC-SHA256); default
  alargado a 38 bytes en Dockerfile y compose; warning desaparecido de los
  logs.
- Choque de puertos en 8100 detectado y resuelto: el uvicorn de desarrollo
  del host (PID 13092, IPv6) convivia con el proxy de Docker (IPv4). Detenido
  el proceso dev; 8100 queda con dueno unico (API dockerizada).
- Verificacion de la API dockerizada (todo contra localhost:8100):
  GET /api/salud -> {"estado":"ok"}; POST /api/auth/login (diana@
  projecthub.local / projecthub-demo) -> token JWT + usuario Diana Admin;
  GET /api/sincronizacion con Bearer -> usuarios=7 proyectos=6 etapas=5
  entregables=10 bitacora=5; docker exec psql contra projecthub-db-demo ->
  tabla usuarios con 7 filas (persistencia Postgres real, no memoria).
- Rebuild de los 5 frontends demo: las imagenes previas (11-07 05:03) no
  incluian la migracion Material (a057140, 11-07 16:38). `docker compose
  build` + `up -d` de shell y 4 remotes; arboles git limpios antes de
  construir.
- Smoke demo completo: remoteEntry.json 200 en 4400-4404,
  federation.manifest.json con URLs 440x, E2E federado Playwright (variante
  SHELL=4400): **12/12 OK, 0 recursos 404** (user-switcher mat-select,
  cambio de usuario, 4 rutas sin fallback, F5 profundo, consola limpia).
- Commits: deploy 1deb0b8 (feat). Backend y shared-lib sin cambios. Sin push.

## 2026-11-08 (widget remote-a-remote: fix definitivo con REMOTE_MODULE_LOADER)

- Bug reproducido y diagnosticado a fondo: mfe-reports consume
  ProjectSummaryWidget de mfe-projects (8.5, remote a remote) y el widget
  quedaba colgado en "Cargando widget..." sin error ni timeout, tanto en dev
  4300 como en demo Docker 4400.
- Causa raiz: cada app que importa `loadRemoteModule` enlinea una copia del
  runtime NF en su chunk. En el chunk expuesto Module.js de mfe-reports esa
  copia NUNCA ejecuta initFederation, asi que `federationPromise` (estado a
  nivel de modulo) queda en pendiente para siempre y el await cuelga sin
  excepcion.
- Intento descartado: compartir el runtime NF como shared singleton en las 5
  federation.config.mjs. En prod lo excluye NG_SKIP_LIST; en dev el import
  map solo existe DESPUES de que initFederation corra en runtime (es-module-
  shims, shimMode), asi que el bare specifier es irresoluble al boot y rompia
  el arranque del shell. Revertido; el dev-host-instances-plugin solo aplica
  a SSR, no hay camino oficial.
- Solucion (Plan B): InjectionToken `REMOTE_MODULE_LOADER` en @projecthub/
  shared (shared-lib 7e840ec, patron SESION_STORE). Cada app lo provee en su
  app.config con SU copia de `loadRemoteModule` (inicializada por su
  bootstrap); los consumidores (shell dashboard.ts, mfe-reports
  proyecto-widget.ts) lo resuelven con `remoteModuleLoader()` y ya no
  importan el runtime: los chunks expuestos quedan sin runtime NF
  (verificado en los 10 chunks Module/Widget de los 4 remotes).
- Los consumidores validan que el export cargado sea funcion y lanzan error
  explicito si el remote no expone lo esperado.
- Evidencia: builds prod de los 5 apps OK; tests 219/219 (shared-lib 153,
  shell 20, mfe-projects 26, mfe-reports 5, mfe-admin 13, mfe-governance 2);
  backend pytest 109/109; E2E Playwright dev 4300 8/8 OK (login real diana
  /projecthub-demo, dashboard con 4 widgets, /reports/proyecto-widget
  renderiza el widget remoto con avance Intl, cambio de proyecto actualiza
  el resumen, F5 recarga, 0 recursos >= 400, consola limpia); standalone
  mfe-reports 4302 degrada con elegancia (tablero funciona, widget requiere
  sesion real).
- E2E actualizado a login real (fase 14): el user-switcher demo no persiste
  la sesion entre recargas (SesionStore en memoria); el token JWT del login
  si persiste en localStorage (projecthub.token).
- Commits: shared-lib 7e840ec (feat), shell 58661b5 (fix), mfe-reports
  8b5481a (fix), mfe-projects 85b9fee / mfe-admin 50dc27e / mfe-governance
  71d2ec5 (chore, provider del token en app.config). Sin push.
- Deuda registrada: lint formal (ESLint 9) sin configurar en ningun repo
  frontend (11.4 del handoff).

## 2026-11-08 (validacion del fix en demo Docker 4400)

El pendiente del handoff "rebuild demo Docker con el fix" quedo cubierto sin rebuild adicional:
docker compose build reutilizo cache de BuildKit y las imagenes 440x ya contienen el token
REMOTE_MODULE_LOADER (grep dentro de las imagenes shell y mfe-reports: presente en
_projecthub_shared y chunks de shell/reports). `docker compose up -d` recreo los contenedores.

E2E demo (SHELL=http://localhost:4400, login real diana@projecthub.local): 8/8 OK.
- dashboard del shell compone 4 widgets federados.
- /reports/proyecto-widget: widget remote a remote monta (count=1), avance Intl
  ("PORTAL DE PAGOS 42,4% $ 81.500 de $ 150.000"), cambio de proyecto lo actualiza
  ("DATA WAREHOUSE CORPORATIVO 4,8%...").
- F5 en ruta profunda recarga el widget; 0 recursos >= 400; consola limpia.

Siguiente deuda: lint formal (11.4): ningun repo frontend tiene eslint ni script lint.

## 2026-11-08 (pagina de documentos y gates en mfe-governance)

- Primera pagina real de mfe-governance (reemplaza el PlaceholderComponent): Documentos
  y entregables en src/app/pages/documentos (ts/html/scss/spec). Filtro de proyecto,
  tarjeta de estado del gate, tabla de entregables con aprobacion segun matriz y
  formulario de carga (version 1, queda pendiente).
- Dominio: `EstadoGate` gana el campo derivado `aprobados` (nombres obligatorios ya
  aprobados) en shared-lib/gates.ts, con test. El resumen del gate usa conteos y la
  pill Abierto/Cerrado es span local (stage-badge es de etapa/estado de proyecto).
- Estados de vista: banner Sesion requerida sin sesion (estructura @else if), banner
  de proyecto no activo (solo lectura) y error del dominio via permission-banner;
  el boton Cargar entregable solo aparece con proyecto Activo.
- Casos limite cubiertos en spec (11 tests, antes 2): render semilla, sin sesion,
  sin permisos (u-analista), crear, nombre vacio, aprobar con u-admin, autor-propio
  (crea como u-admin y intenta autoaprobacion), p6 cancelado, lista vacia p5.
- Verificacion: mfe-governance 11/11 (vitest), build y lint exit 0, shared-lib
  153/153. Commits: shared-lib fe863d0 (feat), mfe-governance b7c5acc (feat
  governance). Sin push.

## 2026-11-08 (iteracion 2: mat-checkbox en dependencias de etapa)
- proyecto-detalle de mfe-projects: checkbox nativo de dependencias reemplazado por mat-checkbox (patron de mfe-admin/usuarios). Ajuste de CSS del bloque dependencias. mfe-projects 26/26 tests, build y lint verdes. Commit be5afd3. Cierra el ultimo hallazgo de la auditoria Material (12.4).

## 2026-11-08 (iteracion 3: verificacion E2E del store unico, 8.4)
- Nuevo script E2E federado (en session-state, no versionado): login real (diana@projecthub.local), sesion compartida visible en mfe-admin, lecturas de dominio en mfe-projects/mfe-reports/mfe-governance, creacion de proyecto "PH-E2E Store Unico" en mfe-projects y comprobacion de que aparece en /reports/presupuesto via store unico, consola limpia. Resultado: 7/7 OK, 0 recursos >= 400. Segunda corrida (idempotencia, proyecto ya cancelado): 7/7 OK.
- Limpieza: proyecto de prueba p-mw78zvoq-1 cancelado via POST /api/proyectos/{id}/cancelar (no existe DELETE de proyectos; el dominio baja proyectos por cancelacion). Se verifico GET /api/proyectos/p-mw78zvoq-1 -> estado Cancelado y la corrida E2E sigue 7/7.
- docs/funcionalidades.md 8.4 marcado â˜‘ con nota de evidencia. Con esto el alcance 1-14 no queda con items â— abiertos.

## 2026-11-08 (iteracion 4: pagina de bitacora cross-proyecto en mfe-governance)
- Nueva pagina Bitacora en mfe-governance (ruta /governance/bitacora, link en nav): solo
  lectura, lista la bitacora de todos los proyectos del portafolio con filtros mat-select
  por proyecto y por tipo (transicion/aprobacion/cambio), evento de transicion legible con
  ETIQUETA_ETAPA ("Origen -> Destino"), autor resuelto por nombre via UsuarioStore y orden
  mas recientes primero (localeCompare descendente sobre fecha ISO).
- Reusa ph-data-table/ph-data-table-column, ph-permission-banner y intl.fecha de
  @projecthub/ui; pill con clase por tipo. Banner Sesion requerida sin sesion y banner
  Sin registros con proyecto sin bitacora (p5).
- Spec nuevo con 7 tests (render semilla, transicion legible, filtro por proyecto, filtro
  por tipo, estado vacio, sin sesion, autores resueltos). Correccion durante la iteracion:
  test 1 comparaba fechas formateadas ordenadas lexicograficamente (incorrecto: orden
  lexico no es cronologico); se reemplazo por asercion de primera fila = registro mas
  reciente (b5, 15 de oct de 2026).
- Verificacion: mfe-governance 18/18 (vitest), build exit 0, lint exit 0. Commit
  mfe-governance (feat governance). Sin push.

## 2026-11-08 (iteracion 5: mejoras de bitacora)
- mfe-projects (proyecto-detalle): la seccion Bitacora ahora muestra la fecha formateada
  con intl.fecha (antes ISO crudo), el autor resuelto por nombre via UsuarioStore (antes
  el id) y el tipo de registro como etiqueta ("Transicion.", "Aprobacion.", "Cambio.")
  antes del evento. Bug corregido durante la iteracion: recortar el ISO a 'YYYY-MM-DD'
  lo parseaba como medianoche UTC y retrocedia un dia en zonas UTC-negativas (20 de ago
  se veia como 19 de ago); el fix formatea el ISO completo, igual que la pagina Bitacora
  de mfe-governance.
- mfe-governance (pagina Bitacora): boton "Exportar CSV" junto a los filtros (patron CSV
  de mfe-reports/presupuesto: serializarCsv RFC 4180, descargarArchivo con BOM y
  nombreConFecha 'bitacora-YYYY-MM-DD-HHmm.csv'), deshabilitado sin sesion o sin filas.
  Reutiliza los helpers ya publicados por @projecthub/shared (7.5); sin tocar shared-lib.
- Tests: 2 nuevos en bitacora.spec.ts (export genera Blob + URL.createObjectURL + click
  del ancla + revokeObjectURL; export con filtro sin resultados), aserciones reforzadas
  en proyecto-detalle.spec.ts (Diana Admin, 20 de ago de 2026, sin 'u-admin' ni ISO crudo).
- Verificacion: mfe-governance 20/20, mfe-projects 26/26 (vitest), builds y lint exit 0
  en ambos. Commits: mfe-projects 14d1eec, mfe-governance 01ef742 (feat, sin push).

## 2026-11-08 (iteracion 6: e2e federado de bitacora + nav del remote)
- Hallazgo estructural: en modo federado el app.html del remote mfe-governance nunca se
  renderiza; el shell monta las rutas expuestas ("./Module") directamente en su router,
  de modo que el nav standalone (Documentos/Bitacora) solo existia en el remote aislado.
  Corollario de Native Federation, no un bug: el nav real de secciones debe vivir en las
  paginas del remote.
- mfe-governance: componente app-nav-governance (src/app/shared) con RouterLink +
  RouterLinkActive y un signal activo derivado de router.events (NavigationEnd); colocado
  al inicio de las paginas Documentos y Bitacora. Test propio con provideRouter de rutas
  de prueba (el primero fallaba porque /governance/bitacora no existia en el router vacio).
- E2E federado (session-state files/e2e-bitacora.mjs, Playwright headless contra el shell
  4300): 11/11 comprobaciones OK. Incluye descarga real del CSV (evento download, nombre
  bitacora-2026-11-07-2316.csv) y proteccion de ruta profunda sin sesion: el shell
  redirige a /login?de=/governance/bitacora antes de que el remote renderice su banner.
  Leccion de sondas: imprimir 200+ chars del body y comparar en minusculas.
- Verificacion: mfe-governance 22/22 (vitest), build exit 0, lint exit 0. Commit
  mfe-governance 0103a1a (feat). Sin push.

### Iteracion 17 (2026-11-08) - prompt-dialog a mat-form-field (Material correcto)

- Objetivo: ultimo componente de entrada con controles nativos (prompt-dialog de ui-lib, DEC-005) a Material.
- Verificacion previa: specs de consumidores no dependen de selectores del DOM del dialogo (mfe-admin mockea PromptDialogService; e2e usan input[type=...] generico). Solo componentes.spec.ts de ui-lib toca el dialogo.
- Cambios: prompt-dialog.ts usa mat-form-field appearance=outline + matInput (input/textarea) + mat-hint + etiqueta con span.ph-dialog-req; imports +MatFormFieldModule +MatInputModule; eliminados estilos hand-rolled .ph-dialog-input/.ph-dialog-etiqueta/.ph-dialog-ayuda; .ph-dialog-campo ahora display block width 100%.
- Test nuevo en componentes.spec.ts: estructura Material del dialogo (2 mat-form-field, input[matinput], textarea[matinput], mat-hint, .ph-dialog-req).
- Verificado: ui-lib 38/38 (antes 37), build exit 0, lint exit 0. Commit ui-lib 78baba2.
- Consumidores (mfe-projects, mfe-admin) verificados por analisis: no cambian (sin dependencia del DOM interno del dialogo).

## Verificacion E2E federada post-iteracion 17 (2026-11-08, 02:57)

- Bateria completa de navegador 38/38: e2e-federado 12/12, e2e-widgets 8/8, e2e-store-unico 7/7, e2e-bitacora 11/11.
- Verifica en runtime federado las iteraciones 15-17: ph-pill en documentos/bitacora/detalle, chips del gate con conteo, metadata del portafolio y prompt-dialog 100% Material (mat-form-field + matInput + mat-hint).
- Episodio documentado: los dev servers que llevaban desde antes de la iteracion 15 servian builds desactualizados (HMR) y los exposes './Module' de mfe-projects y mfe-governance caian al fallback silencioso del shell (SyntaxError blob, sin error visible). Sintoma: "Modulo no disponible" en /projects y /governance/bitacora con remoteEntry 200. Cura: detener los ng serve y relanzarlos (misma leccion de la iteracion 13). Tras relanzar: consola limpia y 38/38.
- Leccion operativa reforzada: cuando varias iteraciones de codigo no pasan por navegador, verificar E2E antes de dar por cerrado el ciclo; un dev server viejo enmascara los cambios.

## Iteracion 18 (2026-11-07) - Exportacion PDF de reportes (7.5) sin dependencias

- shared-lib: domain/pdf.ts con generarHtmlPdf (HTML imprimible: tablas con thead/tbody/tfoot,
  alineacion derecha de numeros, escape HTML, marca de tiempo) + imprimirPdf (iframe oculto
  aria-hidden + window.print, limpieza a 30 s). Barrel actualizado. 4 tests -> 161/161 OK, build OK.
- mfe-reports: exportarPdf() en tablero-general (3 tablas: detalle por proyecto, por etapa, por
  estado) y presupuesto (tabla + pie de totales); botones "Exportar PDF" junto a los de CSV.
  Build OK, 5/5 tests, lint OK.
- E2E nuevo e2e-pdf.mjs: 14/14 checks (botones, dialogo invocado en ambas paginas, titulos
  "Tablero general de indicadores" / "Reporte de presupuesto", secciones, fila de totales,
  marca de tiempo, escape HTML, consola limpia). Regresion completa 52/52 checks E2E verdes
  (14 pdf + 12 federado + 8 widgets + 7 store + 11 bitacora).
- Leccion tecnica: reconstruir el dist de shared-lib con los ng serve corriendo puede envenenar
  el watcher del shell (TS2307/TS2571 a mitad de escritura; no se recupera solo) -> reiniciar
  ese ng serve. Interceptar window.print en Playwright: nunca tocar Document.prototype.title
  (recursion); override de window.print por frame guardando window.__pdfCapturado y leerlo
  via polling de iframes[aria-hidden=true].
- Commits: shared-lib 7f16aca, mfe-reports 4549935, docs raiz (ver hash). 7.5 queda â˜‘ completo
  en docs/funcionalidades.md: todo el alcance numerado esta implementado.

## Iteracion 20 (2026-11-08) - E2E de gate de etapa del ciclo de vida por UI + NG0956

- Bateria nueva files/e2e-transiciones.mjs (19 checks, Playwright headless contra el shell): login Diana ->
  crear proyecto -> "Ir a Iniciativa" rechazado con mensaje de dominio (gate cerrado) -> acta obligatoria
  cargada en Documentos -> autoaprobacion rechazada (validarAprobacion) -> login Sergio (Sponsor) aprueba ->
  transicion aceptada -> badge Iniciativa -> bitacora "Planteamiento -> Iniciativa" -> gate recalculado
  ("Falta entregable: Documento de iniciativa") -> sin boton de retroceso no permitido -> F5 persiste ->
  consola limpia. RESULTADO 19/19.
- Fixes NG0956 (track by identity en colecciones de un elemento): proyecto-detalle.html transiciones/
  faltantes/pendientesAprobacion y user-switcher.ts (shell) ambos modos track $index. El warning solo se
  disparaba al clic de transicion (recompute de senales), no en navegacion simple (sonda-ng0956.mjs).
- Lecciones: (a) Test-NetConnection a 127.0.0.1 da falsos negativos cuando Vite escucha en IPv6; usar
  Invoke-WebRequest http://localhost:puerto. (b) Cuando dos bloques de plantilla son textualmente identicos,
  el edit tool falla con "Multiple matches found": desambiguar con contexto unico por bloque. (c) Los servidores
  dev de la iteracion 19 siguen sirviendo HMR tras los edits; el rerun del E2E contra los mismos procesos
  valida los cambios sin relanzar.
- Commits: mfe-projects 033d300, shell 05eb519 (fix, sin push). mcp-config.json global restaurado a su
  contenido original tras edicion por error de alcance; la deshabilitacion de mobile-mcp/maestro la hara
  el usuario manualmente.
