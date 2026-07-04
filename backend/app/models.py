import uuid
from .database import Base
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "core"}

    id                = Column(UUID(as_uuid=True), primary_key=True)
    full_name         = Column(String, nullable=False)
    email             = Column(String, unique=True, nullable=False)
    registration_date = Column(DateTime(timezone=True), nullable=False)
    # Arquetipo de comportamiento: power_user | casual_user | zombie_user | churned_risk
    # Permite al dashboard de Customer Success priorizar acciones de retención
    # (un power_user inactivo tiene más MRR en riesgo que un zombie_user).
    user_type         = Column(String, nullable=False, default="casual_user")


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {"schema": "core"}

    id            = Column(UUID(as_uuid=True), primary_key=True)
    user_id       = Column(UUID(as_uuid=True), ForeignKey('core.users.id'), nullable=False)
    plan_name     = Column(String, nullable=False)
    status        = Column(String, nullable=False)
    monthly_price = Column(Numeric, nullable=False)
    started_at    = Column(DateTime(timezone=True), nullable=False)
    canceled_at   = Column(DateTime(timezone=True), nullable=True)


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = {"schema": "core"}

    id              = Column(UUID(as_uuid=True), primary_key=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey('core.subscriptions.id'), nullable=False)
    amount          = Column(Numeric, nullable=False)
    status          = Column(String, nullable=False)
    processed_at    = Column(DateTime(timezone=True), nullable=False)


class UserActivityLog(Base):
    __tablename__    = "user_activity_logs"
    __table_args__   = {"schema": "core"}   # Corregido: era __tablename___args__ (triple guión bajo)

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey('core.users.id'), nullable=False)
    event_type = Column(String, nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)


class RetentionAction(Base):
    __tablename__  = "retention_actions"
    __table_args__ = {"schema": "core"}

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey('core.users.id'), nullable=False)
    action_type = Column(String(100), nullable=False, default="email_warning")
    created_at  = Column(DateTime(timezone=True), nullable=False)
    status      = Column(String(50), nullable=False, default="sent")