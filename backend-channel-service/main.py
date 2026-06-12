from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import asyncio
import httpx
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

CRM_RECEIPT_URL = os.getenv("CRM_RECEIPT_URL", "http://localhost:8000/api/receipt")

app = FastAPI(
    title="AgentReach Channel Service",
    description="Delivery simulation microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SendRequest(BaseModel):
    campaign_id: str
    customer_id: str
    channel: str
    message: str


DELIVERY_FLOW = {
    "whatsapp": [
        ("sent", 0.1),
        ("delivered", 0.3),
        ("read", 0.6),
        ("clicked", 0.9),
        ("purchased", 1.4),
    ],
    "sms": [
        ("sent", 0.1),
        ("delivered", 0.5),
        ("clicked", 1.2),
        ("purchased", 1.8),
    ],
    "email": [
        ("sent", 0.2),
        ("delivered", 0.6),
        ("opened", 1.0),
        ("clicked", 1.5),
        ("purchased", 2.2),
    ],
    "rcs": [
        ("sent", 0.1),
        ("delivered", 0.4),
        ("opened", 0.7),
        ("read", 1.0),
        ("clicked", 1.3),
        ("purchased", 1.9),
    ]
}

# Failure rates per channel
FAILURE_RATE = {
    "whatsapp": 0.08,
    "sms": 0.05,
    "email": 0.10,
    "rcs": 0.12,
}


async def simulate_delivery(campaign_id: str, customer_id: str, channel: str):
    """Simulate async delivery with realistic status progression."""
    channel = channel.lower()
    failure_rate = FAILURE_RATE.get(channel, 0.10)
    flow = DELIVERY_FLOW.get(channel, DELIVERY_FLOW["email"])

    async with httpx.AsyncClient(timeout=10.0) as client:
        if random.random() < failure_rate:
            # Simulate failure
            await asyncio.sleep(random.uniform(0.5, 2.0))
            await send_receipt(client, {
                "campaign_id": campaign_id,
                "customer_id": customer_id,
                "channel": channel,
                "status": "failed",
                "timestamp": datetime.utcnow().isoformat()
            })
            return

        for status, delay in flow:
            await asyncio.sleep(delay + random.uniform(0, 0.5))

            payload = {
                "campaign_id": campaign_id,
                "customer_id": customer_id,
                "channel": channel,
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Attach a simulated order value for purchased events
            if status == "purchased":
                # Realistic order values between Rs.500 and Rs.8000
                payload["order_value"] = round(random.uniform(500, 8000), 2)

            await send_receipt(client, payload)

            # Random drop-off after each stage (more aggressive for purchase)
            drop_rate = 0.50 if status == "clicked" else 0.35
            if status != "sent" and random.random() < drop_rate:
                break


async def send_receipt(client: httpx.AsyncClient, payload: dict):
    try:
        await client.post(CRM_RECEIPT_URL, json=payload)
    except Exception as e:
        print(f"Receipt callback failed: {e}")


@app.post("/send")
async def send_message(body: SendRequest, background_tasks: BackgroundTasks):
    """Accept a message delivery request and simulate it in background."""
    background_tasks.add_task(
        simulate_delivery,
        body.campaign_id,
        body.customer_id,
        body.channel
    )
    return {
        "success": True,
        "message": f"Message queued for {body.channel} delivery",
        "customer_id": body.customer_id,
        "campaign_id": body.campaign_id
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "channel-service"}


@app.get("/")
async def root():
    return {"message": "AgentReach Channel Service", "version": "1.0.0"}
