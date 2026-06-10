# -- PASO 0: Las Importaciones de SQLAlchemy --
import uuid
from .database import Base
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

# Paso 1: Definir la Clase (La Tabla)


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "core"}
    id = Column(UUID(as_uuid=True), primary_key=True)
    full_name = Column(String, unique=False, nullable=False)
    email = Column(String, unique=True, nullable=False)
    registration_date = Column(DateTime, nullable=False)

class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {"schema": "core"}
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('core.users.id'), nullable=False)
    plan_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    monthly_price = Column(Numeric, nullable=False)
    started_at = Column(DateTime, nullable=False)
    canceled_at = Column(DateTime, nullable=True)


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = {"schema": "core"}
    id = Column(UUID(as_uuid=True), primary_key=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey('core.subscriptions.id'), nullable=False)
    amount = Column(Numeric, nullable=False)
    status = Column(String, nullable=False)
    processed_at = Column(DateTime, nullable=False)

class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"
    __tablename___args__ = {"schema": "core"}
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('core.users.id'), nullable=False)
    event_type = Column(String, nullable=False)
    event_date = Column(DateTime, nullable=False)