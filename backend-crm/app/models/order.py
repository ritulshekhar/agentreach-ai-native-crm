from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class OrderItem(BaseModel):
    name: str
    quantity: int
    price: float


class OrderCreate(BaseModel):
    customer_id: str
    amount: float
    items: List[OrderItem]


class OrderOut(BaseModel):
    order_id: str
    customer_id: str
    amount: float
    items: List[OrderItem]
    created_at: datetime

    model_config = {"from_attributes": True}
