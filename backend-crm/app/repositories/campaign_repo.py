from app.core.database import get_db
from app.models.campaign import CampaignCreate, ReceiptIn
from datetime import datetime
import uuid


class CampaignRepository:
    def _col(self):
        return get_db()["campaigns"]

    def _receipts(self):
        return get_db()["delivery_receipts"]

    async def create(self, data: CampaignCreate, audience_count: int) -> dict:
        doc = {
            "campaign_id": f"CAMP-{uuid.uuid4().hex[:8].upper()}",
            "name": data.name,
            "audience_filter": data.audience_filter,
            "audience_description": data.audience_description,
            "channel": data.channel.value,
            "message": data.message,
            "status": "active",
            "audience_count": audience_count,
            "created_at": datetime.utcnow(),
        }
        await self._col().insert_one(doc)
        return doc

    async def get_all(self, skip: int = 0, limit: int = 50) -> list:
        cursor = self._col().find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, campaign_id: str) -> dict | None:
        return await self._col().find_one({"campaign_id": campaign_id}, {"_id": 0})

    async def save_receipt(self, receipt: dict):
        await self._receipts().insert_one(receipt)

    async def get_analytics(self, campaign_id: str) -> dict:
        pipeline = [
            {"$match": {"campaign_id": campaign_id}},
            {"$group": {
                "_id": "$status",
                "count": {"$count": {}}
            }}
        ]
        results = await self._receipts().aggregate(pipeline).to_list(length=10)
        stats = {"sent": 0, "delivered": 0, "failed": 0, "opened": 0, "read": 0, "clicked": 0}
        for r in results:
            if r["_id"] in stats:
                stats[r["_id"]] = r["count"]
        return stats

    async def get_all_analytics(self) -> list:
        campaigns = await self.get_all(limit=100)
        result = []
        for camp in campaigns:
            analytics = await self.get_analytics(camp["campaign_id"])
            result.append({**camp, "analytics": analytics})
        return result

    async def count(self) -> int:
        return await self._col().count_documents({})
