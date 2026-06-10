from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "crm_db")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    # Create indexes
    await db.customers.create_index("email", unique=True)
    await db.customers.create_index("customer_id", unique=True)
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("customer_id")
    await db.campaigns.create_index("campaign_id", unique=True)
    await db.delivery_receipts.create_index("campaign_id")
    print(f"✅ Connected to MongoDB: {DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
