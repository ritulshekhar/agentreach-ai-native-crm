import httpx
import asyncio
from app.core.database import get_db
from app.repositories.campaign_repo import CampaignRepository
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
CHANNEL_SERVICE_URL = os.getenv("CHANNEL_SERVICE_URL", "http://localhost:8001")


async def dispatch_campaign(campaign: dict, customers: list):
    """Send messages to all customers in background."""
    campaign_repo = CampaignRepository()
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for customer in customers:
            try:
                payload = {
                    "campaign_id": campaign["campaign_id"],
                    "customer_id": customer["customer_id"],
                    "channel": campaign["channel"],
                    "message": campaign["message"].replace("{name}", customer.get("name", "Customer"))
                }
                await client.post(f"{CHANNEL_SERVICE_URL}/send", json=payload)
                # Small delay to avoid overwhelming the service
                await asyncio.sleep(0.05)
            except Exception as e:
                print(f"Failed to dispatch to {customer['customer_id']}: {e}")
