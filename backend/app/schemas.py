# Importación de herramientas analíticas
from datetime import datetime
from decimal import Decimal          # para precios y montos con precisión decimal exacta
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS DE USUARIO
# ──────────────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    full_name: str
    email: EmailStr       # valida automáticamente que el formato sea un email válido
    user_type: str        # arquetipo de comportamiento: power_user, casual_user, etc.

class UserResponse(UserBase):
    # extiende UserBase agregando los campos que devuelve la BD al consultar un usuario
    id: UUID
    registration_date: datetime

    class Config:
        from_attributes = True  # permite construir el esquema desde un objeto ORM (SQLAlchemy)


# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS DE SUSCRIPCIÓN (Eje del Ingreso Mensual Recurrente - MRR)
# ──────────────────────────────────────────────────────────────────────────────

class UserSubscription(BaseModel):
    plan_name: str
    status: str           # 'active' o 'canceled', viene como texto desde la BD
    monthly_price: Decimal

class SubscriptionResponse(UserSubscription):
    # extiende UserSubscription con los campos de identificación y fechas
    id: UUID
    user_id: UUID
    started_at: datetime
    canceled_at: Optional[datetime] = None  # None si la suscripción sigue activa

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS DE PAGOS Y FINANZAS
# ──────────────────────────────────────────────────────────────────────────────

class UserPayment(BaseModel):
    # representa un pago individual asociado a una suscripción
    id: UUID
    subscription_id: UUID
    amount: Decimal
    status: str           # 'success', 'failed', etc.
    processed_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS DE MÉTRICAS Y RENDIMIENTO MACRO
# ──────────────────────────────────────────────────────────────────────────────

class UserMetricsRow(BaseModel):
    # fila cruda del resultado de métricas, incluye market_share como texto formateado (ej: "34.5%")
    plan_name: str
    plan_total_revenue: Decimal
    total_subscribers: int
    market_share: str

class UserMetrics(BaseModel):
    # métricas base sin market_share, usada internamente antes de calcular el porcentaje
    plan_name: str
    plan_total_revenue: Decimal
    total_subscribers: int

    class Config:
        from_attributes = True

class MetricsWithMarketShare(BaseModel):
    # versión final de métricas que ya incluye el market_share calculado
    plan_name: str
    plan_total_revenue: Decimal
    total_subscribers: int
    market_share: str


# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMA DE  VALIDACIÓN PARA ACCIONES PREVENTIVAS DE RETENCIÓN
# ──────────────────────────────────────────────────────────────────────────────

class RetentionActionCreate(BaseModel):
    """
    Valida el cuerpo de la petición POST enviada por el frontend
    cuando se decide mitigar manualmente el riesgo de un cliente.
    """
    user_id: UUID
    action_type: str = "email_warning"  # tipo de acción por defecto si el frontend no especifica
    status: str = "sent"                # estado inicial de la acción al crearse

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS DE MÉTRICAS ANALÍTICAS
# ──────────────────────────────────────────────────────────────────────────────

class LTVPorPlan(BaseModel):
    # representa el LTV estimado por plan, calculado a partir de ARPU y churn promedio
    plan_name: str
    arpu: Decimal                            # ingreso promedio por usuario (precio fijo del plan)
    churn_promedio_3m: Decimal             # churn promedio de los últimos 3 meses
    ltv_estimado: Optional[Decimal] = None  # None si churn_rate es 0 (evita división por cero)
    nota: Optional[str] = None              # mensaje explicativo cuando ltv_estimado no se puede calcular

# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS PARA MÉTRICAS DE INGRESOS (MRR)
# ──────────────────────────────────────────────────────────────────────────────

class MRRMensual(BaseModel):
    # representa una fila del reporte de MRR: un mes con su ingreso total y suscripciones activas
    mes: datetime          # primer día del mes al que pertenece el dato (ej: 2026-01-01)
    mrr_total: Decimal     # suma de ingresos mensuales de todas las suscripciones activas ese mes
    suscripciones_activas: int  # cantidad de suscripciones contadas como activas ese mes

    class Config:
        from_attributes = True  # permite construir el esquema desde un objeto ORM (SQLAlchemy)

# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS PARA MOVIMIENTO DE MRR (DESGLOSE)
# ──────────────────────────────────────────────────────────────────────────────

class MRRMovement(BaseModel):
    # representa una fila del desglose de MRR Movement: un mes, una categoría y su cambio neto
    mes: datetime          # primer día del mes al que pertenece el movimiento
    categoria: str         # tipo de movimiento: 'Nuevo', 'Expansión', 'Contracción' o 'Sin Cambio'
    cambio_neto_mrr: Decimal  # dinero ganado o perdido ese mes en esa categoría (puede ser negativo)

    class Config:
        from_attributes = True  # permite construir el esquema desde un objeto ORM (SQLAlchemy)

# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS PARA MÉTRICAS DE ABANDONO (CHURN)
# ──────────────────────────────────────────────────────────────────────────────

class ChurnMensual(BaseModel):
    # representa una fila del histórico de churn: un mes y su tasa de cancelación
    mes: datetime                  # primer día del mes al que pertenece el dato
    churn_rate: Decimal  # porcentaje promedio de cancelaciones ese mes

    class Config:
        from_attributes = True  # permite construir el esquema desde un objeto ORM (SQLAlchemy)

# ──────────────────────────────────────────────────────────────────────────────
# ESQUEMAS PARA MÉTRICAS DE ABANDONO (CHURN) POR PLAN
# ──────────────────────────────────────────────────────────────────────────────

class ChurnPorPlan(BaseModel):
    # representa una fila del churn segmentado: un mes, un plan y su tasa de cancelación
    mes: datetime       # primer día del mes al que pertenece el dato
    plan_name: str      # nombre del plan
    churn_rate: Decimal # porcentaje de cancelaciones de ese plan ese mes

    class Config:
        from_attributes = True  # permite construir el esquema desde un objeto ORM (SQLAlchemy)