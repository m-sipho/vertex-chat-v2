from app.core.database import Base
import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String, DateTime
from sqlalchemy.sql import func
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id : Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name : Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    password : Mapped[str] = mapped_column(nullable=False)
    display_name : Mapped[str] = mapped_column(nullable=False)
    avatar_seed : Mapped[str] = mapped_column(nullable=False)
    status_message : Mapped[str] = mapped_column(String(100), nullable=True)
    is_banned : Mapped[bool] = mapped_column(default=False, nullable=False)
    reputation_score : Mapped[int] = mapped_column(default=100, nullable=False)
    created_at : Mapped[datetime] = mapped_column( DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User {self.name} at {self.created_at}>"