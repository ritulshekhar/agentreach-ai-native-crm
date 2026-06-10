from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class Channel(str, Enum):
    whatsapp = "whatsapp"
    sms = "sms"
    email = "email"
    rcs = "rcs"


class CampaignCreate(BaseModel):
    name: str
    audience_filter: Dict[str, Any]  # MongoDB filter dict
    audience_description: str
    channel: Channel
    message: str


class CampaignOut(BaseModel):
    campaign_id: str
    name: str
    audience_filter: Dict[str, Any]
    audience_description: str
    channel: str
    message: str
    status: str
    audience_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DeliveryStatus(str, Enum):
    sent = "sent"
    delivered = "delivered"
    failed = "failed"
    opened = "opened"
    read = "read"
    clicked = "clicked"


class DeliveryReceipt(BaseModel):
    campaign_id: str
    customer_id: str
    channel: str
    status: DeliveryStatus
    timestamp: datetime


class ReceiptIn(BaseModel):
    campaign_id: str
    customer_id: str
    channel: str
    status: str
    timestamp: str
