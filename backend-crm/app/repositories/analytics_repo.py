"""
Analytics Repository.
Aggregates funnel metrics, revenue attribution, and top campaign rankings
from delivery_receipts and purchased_events collections.
"""

from app.core.database import get_db
from typing import List, Dict, Any
from datetime import datetime


class AnalyticsRepository:
    def _receipts(self):
        return get_db()["delivery_receipts"]

    def _purchases(self):
        return get_db()["purchased_events"]

    def _campaigns(self):
        return get_db()["campaigns"]

    async def get_campaign_funnel(self, campaign_id: str) -> Dict[str, Any]:
        """
        Return 6-stage funnel counts for a campaign.
        Stages: sent → delivered → opened → read → clicked → purchased
        """
        pipeline = [
            {"$match": {"campaign_id": campaign_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
        results = await self._receipts().aggregate(pipeline).to_list(length=20)
        stages = {
            "sent": 0, "delivered": 0, "opened": 0,
            "read": 0, "clicked": 0, "failed": 0,
        }
        for r in results:
            if r["_id"] in stages:
                stages[r["_id"]] = r["count"]

        # Add purchased from purchased_events collection
        purchased_count = await self._purchases().count_documents({"campaign_id": campaign_id})
        stages["purchased"] = purchased_count

        # Compute conversion rates between stages
        funnel_stages = ["sent", "delivered", "opened", "read", "clicked", "purchased"]
        funnel = []
        for i, stage in enumerate(funnel_stages):
            count = stages.get(stage, 0)
            prev = stages.get(funnel_stages[i - 1], 0) if i > 0 else count
            rate = round((count / prev * 100), 1) if prev > 0 else 0.0
            funnel.append({
                "stage": stage,
                "count": count,
                "conversion_from_prev_pct": rate if i > 0 else 100.0,
            })

        return {
            "campaign_id": campaign_id,
            "funnel": funnel,
            "summary": {
                "total_sent": stages["sent"],
                "delivery_rate": round(stages["delivered"] / stages["sent"] * 100, 1) if stages["sent"] > 0 else 0,
                "open_rate": round(stages["opened"] / stages["delivered"] * 100, 1) if stages["delivered"] > 0 else 0,
                "ctr": round(stages["clicked"] / stages["opened"] * 100, 1) if stages["opened"] > 0 else 0,
                "purchase_rate": round(stages["purchased"] / stages["clicked"] * 100, 1) if stages["clicked"] > 0 else 0,
                "failed": stages["failed"],
            },
        }

    async def get_revenue_attribution(self, campaign_id: str) -> Dict[str, Any]:
        """Aggregate revenue attributed to a campaign via purchased events."""
        pipeline = [
            {"$match": {"campaign_id": campaign_id}},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": "$order_value"},
                "total_orders": {"$sum": 1},
                "avg_order_value": {"$avg": "$order_value"},
            }},
        ]
        result = await self._purchases().aggregate(pipeline).to_list(length=1)
        if result:
            r = result[0]
            return {
                "campaign_id": campaign_id,
                "revenue_generated": round(r.get("total_revenue", 0), 2),
                "orders_generated": r.get("total_orders", 0),
                "avg_order_value": round(r.get("avg_order_value", 0), 2),
            }
        return {
            "campaign_id": campaign_id,
            "revenue_generated": 0,
            "orders_generated": 0,
            "avg_order_value": 0,
        }

    async def get_top_revenue_campaigns(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Return campaigns ranked by attributed revenue."""
        pipeline = [
            {"$group": {
                "_id": "$campaign_id",
                "revenue": {"$sum": "$order_value"},
                "orders": {"$sum": 1},
            }},
            {"$sort": {"revenue": -1}},
            {"$limit": limit},
        ]
        results = await self._purchases().aggregate(pipeline).to_list(length=limit)

        enriched = []
        for r in results:
            campaign = await self._campaigns().find_one(
                {"campaign_id": r["_id"]}, {"_id": 0, "name": 1, "channel": 1, "audience_count": 1}
            )
            enriched.append({
                "campaign_id": r["_id"],
                "name": campaign.get("name", "Unknown") if campaign else "Unknown",
                "channel": campaign.get("channel", "") if campaign else "",
                "audience_count": campaign.get("audience_count", 0) if campaign else 0,
                "revenue": round(r["revenue"], 2),
                "orders": r["orders"],
                "avg_order_value": round(r["revenue"] / r["orders"], 2) if r["orders"] > 0 else 0,
            })
        return enriched

    async def save_purchased_event(self, event: dict):
        """Persist a purchased event."""
        await self._purchases().insert_one(event)

    async def get_overall_funnel(self) -> Dict[str, Any]:
        """Aggregate funnel across all campaigns."""
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
        results = await self._receipts().aggregate(pipeline).to_list(length=20)
        stages = {s: 0 for s in ["sent", "delivered", "opened", "read", "clicked", "failed"]}
        for r in results:
            if r["_id"] in stages:
                stages[r["_id"]] = r["count"]

        total_purchases = await self._purchases().count_documents({})
        stages["purchased"] = total_purchases
        return stages
