from app.core.database import get_db
from app.models.customer import CustomerCreate, CustomerOut
from datetime import datetime
import uuid


class CustomerRepository:
    def __init__(self):
        self.collection_name = "customers"

    def _col(self):
        return get_db()[self.collection_name]

    async def create(self, data: CustomerCreate) -> dict:
        doc = {
            "customer_id": f"CUST-{uuid.uuid4().hex[:8].upper()}",
            "name": data.name,
            "email": data.email,
            "phone": data.phone,
            "city": data.city,
            "joined_at": datetime.utcnow(),
        }
        await self._col().insert_one(doc)
        return doc

    async def get_all(self, skip: int = 0, limit: int = 50) -> list:
        cursor = self._col().find({}, {"_id": 0}).sort("joined_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, customer_id: str) -> dict | None:
        return await self._col().find_one({"customer_id": customer_id}, {"_id": 0})

    async def count(self, query: dict = {}) -> int:
        return await self._col().count_documents(query)

    async def find_by_filter(self, mongo_filter: dict, limit: int = 200) -> list:
        cursor = self._col().find(mongo_filter, {"_id": 0}).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_by_filter(self, mongo_filter: dict) -> int:
        return await self._col().count_documents(mongo_filter)

    async def get_customer_360(self, customer_id: str) -> dict | None:
        """Return full customer profile with order history and campaign engagement."""
        from app.core.database import get_db
        db = get_db()

        customer = await self._col().find_one({"customer_id": customer_id}, {"_id": 0})
        if not customer:
            return None

        # Order history
        orders_cursor = db["orders"].find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1)
        orders = await orders_cursor.to_list(length=50)

        # Order stats
        from app.repositories.order_repo import OrderRepository
        order_repo = OrderRepository()
        stats = await order_repo.get_customer_stats(customer_id)

        # Campaign delivery receipts
        receipts_cursor = db["delivery_receipts"].find(
            {"customer_id": customer_id}, {"_id": 0}
        ).sort("timestamp", -1).limit(50)
        receipts = await receipts_cursor.to_list(length=50)

        # Enrich receipts with campaign names
        campaign_ids = list({r["campaign_id"] for r in receipts})
        campaigns_cursor = db["campaigns"].find(
            {"campaign_id": {"$in": campaign_ids}},
            {"_id": 0, "campaign_id": 1, "name": 1, "channel": 1}
        )
        campaigns_list = await campaigns_cursor.to_list(length=20)
        campaign_map = {c["campaign_id"]: c for c in campaigns_list}

        enriched_receipts = []
        for r in receipts:
            camp = campaign_map.get(r["campaign_id"], {})
            enriched_receipts.append({
                **r,
                "campaign_name": camp.get("name", "Unknown"),
                "campaign_channel": camp.get("channel", ""),
            })

        # Revenue attributed from purchased_events
        purchase_pipeline = [
            {"$match": {"customer_id": customer_id}},
            {"$group": {
                "_id": None,
                "attributed_revenue": {"$sum": "$order_value"},
                "attributed_orders": {"$sum": 1},
            }},
        ]
        purchase_result = await db["purchased_events"].aggregate(purchase_pipeline).to_list(length=1)
        attribution = purchase_result[0] if purchase_result else {"attributed_revenue": 0, "attributed_orders": 0}

        # Campaign engagement summary
        engagement_summary = {
            "campaigns_received": len(campaign_ids),
            "messages_delivered": sum(1 for r in receipts if r["status"] == "delivered"),
            "messages_opened": sum(1 for r in receipts if r["status"] in ["opened", "read"]),
            "messages_clicked": sum(1 for r in receipts if r["status"] == "clicked"),
        }

        return {
            **customer,
            "total_spent": stats.get("total_spent", 0),
            "order_count": stats.get("order_count", 0),
            "avg_order_value": round(stats["total_spent"] / stats["order_count"], 2)
                if stats.get("order_count") else 0,
            "last_order_at": stats.get("last_order_at"),
            "orders": orders,
            "campaign_receipts": enriched_receipts,
            "engagement_summary": engagement_summary,
            "attribution": {
                "revenue": round(attribution.get("attributed_revenue", 0), 2),
                "orders": attribution.get("attributed_orders", 0),
            },
        }
