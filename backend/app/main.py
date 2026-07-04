import numpy as np
import pandas as pd
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import models
from . import schemas
from .database import engine, get_db, leer_sql

# Crea las tablas en la BD si no existen, basándose en los modelos ORM definidos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Plataforma de Analítica y Mitigación de Abandono",
    version="2.0.0"
)

# Permite que el frontend React consuma la API desde cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ─── FUNCIÓN AUXILIAR: CALCULAR CUOTA DE MERCADO (MARKET SHARE) ───
def calculate_market_share(results: list) -> list[schemas.MetricsWithMarketShare]:
    """
    Calcula el porcentaje de ingresos de cada plan sobre el total.
    Se hace en Python en vez de SQL para no sobrecargar la BD.
    """
    # suma todos los ingresos para usarlos como denominador
    total_revenue = sum(Decimal(row.plan_total_revenue) for row in results)

    metrics_with_share = []
    for row in results:
        revenue = Decimal(row.plan_total_revenue)
        # si no hay ingresos totales, devuelve 0% para evitar división por cero
        share_percentage = (revenue / total_revenue * 100) if total_revenue > 0 else Decimal('0.0')

        metrics_with_share.append(
            schemas.MetricsWithMarketShare(
                plan_name=row.plan_name,
                plan_total_revenue=revenue,
                total_subscribers=row.total_subscribers,
                market_share=f"{share_percentage:.1f}%"  # formatea como "34.5%"
            )
        )
    return metrics_with_share


@app.get("/")
def read_root():
    return {"mensaje": "Servidor analítico corporativo activo y operando correctamente."}


# ─── ENDPOINT: MÉTRICAS GENERALES DE PLANES ───
@app.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    query = text("""
                 SELECT s.plan_name,
                        COALESCE(SUM(p.amount), 0) as plan_total_revenue,
                        COUNT(DISTINCT s.user_id)  as total_subscribers
                 FROM core.subscriptions s
                          LEFT JOIN core.payments p ON s.id = p.subscription_id AND p.status = 'success'
                 WHERE s.status = 'active'
                 GROUP BY s.plan_name;
                 """)
    results = db.execute(query).fetchall()
    return calculate_market_share(results)  # calcula market share antes de devolver


# ─── ENDPOINT: DETECCIÓN DE CLIENTES EN RIESGO ───
@app.get("/metrics/at-risk")
def get_at_risk_metrics(db: Session = Depends(get_db)):
    # Diccionarios de traducción: convierten los valores técnicos de la BD a texto legible en español
    TRADUCCION_ARQUETIPOS = {
        'power_user': 'USUARIO CLAVE',
        'casual_user': 'USUARIO CASUAL',
        'zombie_user': 'USUARIO INACTIVO',
        'churned_risk': 'RIESGO DE ABANDONO'
    }

    TRADUCCION_ESTADOS = {
        'sent': 'ENVIADO',
        'contacted': 'CONTACTADO',
        'resolved': 'RESUELTO',
        'no_response': 'SIN RESPUESTA'
    }

    TRADUCCION_ACCIONES = {
        'email_warning': 'Alerta Correo',
        'slack_alert': 'Alerta Slack',
        'in_app_notification': 'Notificación App',
        'sales_call': 'Llamada Comercial'
    }

    # LEFT JOIN LATERAL trae solo la acción de retención más reciente por usuario,
    # evitando duplicados sin necesidad de subconsultas adicionales
    query = text("""
                 SELECT u.id,
                        u.full_name,
                        u.email,
                        u.user_type,
                        s.plan_name,
                        s.monthly_price,
                        MAX(l.event_date) as last_activity,
                        ra.action_type    as ultimo_tipo_accion,
                        ra.status         as ultimo_estado_gestion
                 FROM core.users u
                          JOIN core.subscriptions s ON u.id = s.user_id
                          LEFT JOIN core.user_activity_logs l ON u.id = l.user_id
                          LEFT JOIN LATERAL (
                     SELECT action_type, status
                     FROM core.retention_actions
                     WHERE user_id = u.id
                     ORDER BY created_at DESC
                         LIMIT 1
        ) ra
                 ON TRUE
                 WHERE s.status = 'active'
                 GROUP BY u.id, u.full_name, u.email, u.user_type, s.plan_name, s.monthly_price, ra.action_type, ra.status
                 HAVING MAX (l.event_date)
                      < NOW() - INTERVAL '15 days'   -- inactivo hace más de 15 días
                     OR MAX (l.event_date) IS NULL    -- o nunca tuvo actividad registrada
                 ORDER BY last_activity ASC;
                 """)

    result = db.execute(query).fetchall()

    riesgo_list = []
    dinero_en_riesgo = Decimal('0.0')
    hoy = datetime.now(timezone.utc)

    for row in result:
        dinero_en_riesgo += Decimal(row.monthly_price)  # acumula el MRR total en riesgo

        # Calcula días de inactividad; si nunca tuvo actividad, devuelve texto descriptivo
        if row.last_activity:
            last_act = row.last_activity.replace(
                tzinfo=timezone.utc) if row.last_activity.tzinfo is None else row.last_activity
            dias_inactivo = (hoy - last_act).days
            ultima_conexion_str = last_act.strftime("%Y-%m-%d")
        else:
            dias_inactivo = "Nunca ingresó"
            ultima_conexion_str = "Sin registros"

        # Construye el texto de gestión combinando estado y tipo de acción
        estado_crudo = row.ultimo_estado_gestion or "sin_gestionar"
        accion_cruda = row.ultimo_tipo_accion or ""

        if estado_crudo == "sin_gestionar":
            gestion_texto = "Sin Gestionar"
        else:
            txt_est = TRADUCCION_ESTADOS.get(estado_crudo, estado_crudo.upper())
            txt_acc = TRADUCCION_ACCIONES.get(accion_cruda, accion_cruda)
            gestion_texto = f"{txt_est}: {txt_acc}"  # ej: "ENVIADO: Alerta Correo"

        riesgo_list.append({
            "id": str(row.id),
            "cliente": row.full_name,
            "email": row.email,
            "plan": row.plan_name.upper(),
            "dias_inactivo": dias_inactivo,
            "ultima_conexion": ultima_conexion_str,
            # Textos en español listos para mostrar en el frontend
            "arquetipo_exhibicion": TRADUCCION_ARQUETIPOS.get(row.user_type, "USUARIO CASUAL"),
            "estado_gestion_exhibicion": gestion_texto,
            # Valores crudos que el frontend usa para aplicar clases CSS
            "clase_css_arquetipo": row.user_type,
            "clase_css_gestion": estado_crudo
        })

    return {
        "resumen_ejecutivo": {
            "total_clientes_en_riesgo": len(riesgo_list),
            "mrr_en_riesgo_usd": float(dinero_en_riesgo)
        },
        "detalle_clientes": riesgo_list
    }


# ─── ENDPOINT: REGISTRAR ACCIÓN DE RETENCIÓN (POST) ───
@app.post("/metrics/action")
def registrar_accion_retencion(accion: schemas.RetentionActionCreate, db: Session = Depends(get_db)):
    """
    Inserta una acción de retención ejecutada sobre un cliente en riesgo.
    """
    # verifica que el usuario exista antes de insertar para no violar la integridad referencial
    usuario_existente = db.query(models.User).filter(models.User.id == accion.user_id).first()
    if not usuario_existente:
        raise HTTPException(
            status_code=404,
            detail="Operación inválida: El usuario referenciado no existe en los registros core."
        )

    # crea la instancia del modelo ORM con los datos validados por Pydantic
    nueva_accion = models.RetentionAction(
        user_id=accion.user_id,
        action_type=accion.action_type,
        status=accion.status
    )

    try:
        db.add(nueva_accion)
        db.commit()
        db.refresh(nueva_accion)  # actualiza el objeto con el id generado por la BD
        return {
            "mensaje": "Acción preventiva guardada y sincronizada de forma exitosa.",
            "id_accion": str(nueva_accion.id)
        }
    except Exception as e:
        db.rollback()  # revierte todo si algo falla, evita datos a medias
        raise HTTPException(
            status_code=500,
            detail=f"Fallo crítico en la persistencia de datos: {str(e)}"
        )


# ─── ENDPOINT: MÉTRICAS DE LTV POR PLAN ───
@app.get("/metrics/ltv", response_model=list[schemas.LTVPorPlan])
def get_ltv_metrics(db: Session = Depends(get_db)):
    # lee el archivo SQL externo en vez de escribir la query aquí
    query_text = leer_sql('ltv_por_plan.sql')

    # ejecuta el SQL y carga el resultado directo en un DataFrame
    df = pd.read_sql(text(query_text), db.connection())

    # fuerza conversión a numérico; si algún valor no convierte, lo deja como NaN
    df['arpu'] = pd.to_numeric(df['arpu'], errors='coerce')
    df['churn_promedio_3m'] = pd.to_numeric(df['churn_promedio_3m'], errors='coerce')

    # LTV = ARPU / (churn% / 100); si churn es 0, el LTV sería infinito → se deja como NaN
    df['ltv_estimado'] = np.where(
        df['churn_promedio_3m'] > 0,
        (df['arpu'] / (df['churn_promedio_3m'] / 100)).round(2),
        np.nan
    )

    # nota explicativa solo para los planes con churn 0% (donde ltv_estimado quedó en NaN)
    df['nota'] = np.where(
        df['churn_promedio_3m'] == 0,
        "LTV infinito. No calculable por Churn del 0%.",
        None
    )

    # reemplaza NaN por None antes de serializar, porque Pydantic no acepta NaN
    return df.replace({np.nan: None}).to_dict(orient='records')

# ─── ENDPOINT: TENDENCIA DE MRR MENSUAL ───
@app.get('/metrics/mrr', response_model=list[schemas.MRRMensual])
def get_mrr_metrics(db: Session = Depends(get_db)):

    # lee el archivo mrr_mensual.sql desde la carpeta /sql
    query_text = leer_sql('mrr_mensual.sql')

    # ejecuta el SQL y carga el resultado directo en un DataFrame
    # db.connection() extrae la conexión cruda que pd.read_sql necesita
    df = pd.read_sql(text(query_text), db.connection())

    # fuerza conversión a numérico; valores no convertibles quedan como NaN en vez de lanzar error
    df['mrr_total'] = pd.to_numeric(df['mrr_total'], errors='coerce')
    df['suscripciones_activas'] = pd.to_numeric(df['suscripciones_activas'], errors='coerce'). astype('Int64')

    # convierte a lista de dicts para que FastAPI serialice y valide contra MRRMensual
    return df.to_dict(orient='records')

# ─── ENDPOINT: DESGLOSE DE MRR MOVEMENT ───
@app.get("/metrics/mrr-movement", response_model=list[schemas.MRRMovement])
def get_mrr_movement(db: Session = Depends(get_db)):

    # lee el archivo mrr_movement.sql desde la carpeta /sql
    query_text = leer_sql('mrr_movement.sql')

    # ejecuta el SQL y carga el resultado directo en un DataFrame
    df = pd.read_sql(text(query_text), db.connection())

    # fuerza conversión a numérico; valores no convertibles quedan como NaN en vez de lanzar error
    df['cambio_neto_mrr'] = pd.to_numeric(df['cambio_neto_mrr'], errors='coerce')

    # convierte a lista de dicts para que FastAPI serialice y valide contra MRRMovement
    return df.to_dict(orient='records')


# ─── ENDPOINT: HISTÓRICO DE CHURN RATE MENSUAL ───
@app.get("/metrics/churn", response_model=list[schemas.ChurnMensual])
def get_churn_metrics(db: Session = Depends(get_db)):

    # lee el archivo churn_rate_mensual.sql desde la carpeta /sql
    query_text = leer_sql("churn_rate_mensual.sql")

    # ejecuta el SQL y carga el resultado directo en un DataFrame
    df = pd.read_sql(text(query_text), db.connection())

    # fuerza conversión a numérico; valores no convertibles quedan como NaN en vez de lanzar error
    df['churn_rate'] = pd.to_numeric(df['churn_rate'], errors='coerce')

    # convierte a lista de dicts para que FastAPI serialice y valide contra ChurnMensual
    return df.to_dict(orient='records')


# ─── ENDPOINT: CHURN RATE SEGMENTADO POR PLAN ───
@app.get("/metrics/churn-by-plan", response_model=list[schemas.ChurnPorPlan])
def get_churn_by_plan_metrics(db: Session = Depends(get_db)):

    # lee el archivo churn_por_plan.sql desde la carpeta /sql
    query_text = leer_sql("churn_por_plan.sql")

    # ejecuta el SQL y carga el resultado directo en un DataFrame
    df = pd.read_sql(text(query_text), db.connection())

    # fuerza conversión a numérico; valores no convertibles quedan como NaN en vez de lanzar error
    df['churn_rate'] = pd.to_numeric(df['churn_rate'], errors='coerce')

    # convierte a lista de dicts para que FastAPI serialice y valide contra ChurnPorPlan
    return df.to_dict(orient='records')