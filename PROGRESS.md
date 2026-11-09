## 2026-11-09 (iteracion 61: invariantes de dominio en el re-sync de estado)

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

