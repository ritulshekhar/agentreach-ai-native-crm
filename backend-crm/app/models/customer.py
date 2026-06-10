from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str
    phone: str
    city: str


class CustomerOut(BaseModel):
    customer_id: str
    name: str
    email: str
    phone: str
    city: str
    joined_at: datetime
    total_spent: float = 0.0
    order_count: int = 0
    last_order_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
