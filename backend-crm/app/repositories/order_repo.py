from app.core.database import get_db
from app.models.order import OrderCreate
from datetime import datetime
import uuid


class OrderRepository:
    def __init__(self):
        self.collection_name = "orders"

    def _col(self):
        return get_db()[self.collection_name]

    async def create(self, data: OrderCreate) -> dict:
        doc = {
            "order_id": f"ORD-{uuid.uuid4().hex[:8].upper()}",
            "customer_id": data.customer_id,
            "amount": data.amount,
            "items": [item.model_dump() for item in data.items],
            "created_at": datetime.utcnow(),
        }
        await self._col().insert_one(doc)
        return doc

    async def get_all(self, skip: int = 0, limit: int = 50) -> list:
        cursor = self._col().find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_by_customer(self, customer_id: str) -> list:
        cursor = self._col().find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=100)

    async def count(self) -> int:
        return await self._col().count_documents({})

    async def get_stats(self) -> dict:
        pipeline = [
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": "$amount"},
                "total_orders": {"$count": {}},
                "avg_order_value": {"$avg": "$amount"}
            }}
        ]
        result = await self._col().aggregate(pipeline).to_list(length=1)
        if result:
            return result[0]
        return {"total_revenue": 0, "total_orders": 0, "avg_order_value": 0}

    async def get_customer_stats(self, customer_id: str) -> dict:
        pipeline = [
            {"$match": {"customer_id": customer_id}},
            {"$group": {
                "_id": "$customer_id",
                "total_spent": {"$sum": "$amount"},
                "order_count": {"$count": {}},
                "last_order_at": {"$max": "$created_at"}
            }}
        ]
        result = await self._col().aggregate(pipeline).to_list(length=1)
        if result:
            return result[0]
        return {"total_spent": 0, "order_count": 0, "last_order_at": None}

    async def get_monthly_revenue(self) -> list:
        pipeline = [
            {"$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "revenue": {"$sum": "$amount"},
                "orders": {"$count": {}}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}},
            {"$limit": 12}
        ]
        return await self._col().aggregate(pipeline).to_list(length=12)
