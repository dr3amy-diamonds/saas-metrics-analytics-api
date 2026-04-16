# Importación de herramientas
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

# Creación del esquema de usuarios
class UserBase(BaseModel):
    full_name: str
    email: EmailStr

class UserResponse(UserBase):
    id:UUID
    registration_date:datetime

    class Config:
        from_attributes = True

# El Esquema de Suscripciones (El motor del MRR)
class UserSubscription(BaseModel):
    plan_name: str
    status:bool
    monthly_price:Decimal

class SubscriptionResponse(UserSubscription):
    id: UUID
    user_id: UUID
    started_at: datetime
    canceled_at: Optional[datetime] = None  # Aquí usamos el Optional

    class Config:
        from_attributes = True

# El Esquema de Pagos
class UserPayment(BaseModel):
    id: UUID
    subscription_id: UUID
    amount: Decimal
    payment_status: bool
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True

# El Esquema de Métricas

class UserMetricsRow(BaseModel):
    plan_name: str
    plan_total_revenue: Decimal
    total_subscribers: int
    market_share: str


