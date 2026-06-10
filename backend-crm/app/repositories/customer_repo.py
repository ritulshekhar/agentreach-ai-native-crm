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
