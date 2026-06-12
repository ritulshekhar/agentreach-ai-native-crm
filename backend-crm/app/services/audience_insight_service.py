"""
Audience Insight Service.
Runs MongoDB aggregation pipelines on a filtered customer segment
to compute spend analytics, city distribution, and purchase behaviour.
"""

from app.core.database import get_db
from typing import Dict, Any


async def get_audience_insights(mongo_filter: dict) -> Dict[str, Any]:
    """
    Compute segment-level analytics for a given MongoDB customer filter.

    Returns:
        audience_size, avg_spend, median_spend, top_cities,
        city_distribution, spend_buckets, repeat_purchase_rate,
        recent_activity (last 30 days count)
    """
    db = get_db()
    customers_col = db["customers"]
    orders_col = db["orders"]

    # 1. Get matching customer IDs
    cursor = customers_col.find(mongo_filter, {"customer_id": 1, "_id": 0})
    customers = await cursor.to_list(length=500)
    customer_ids = [c["customer_id"] for c in customers]
    audience_size = len(customer_ids)

    if audience_size == 0:
        return _empty_insights()

    # 2. Aggregate spend stats from orders for this segment
    spend_pipeline = [
        {"$match": {"customer_id": {"$in": customer_ids}}},
        {"$group": {
            "_id": "$customer_id",
            "total_spent": {"$sum": "$amount"},
            "order_count": {"$sum": 1},
        }},
        {"$group": {
            "_id": None,
            "avg_spend": {"$avg": "$total_spent"},
            "total_customers_with_orders": {"$sum": 1},
            "repeat_customers": {
                "$sum": {"$cond": [{"$gt": ["$order_count", 1]}, 1, 0]}
            },
            "all_spends": {"$push": "$total_spent"},
        }},
    ]
    spend_result = await orders_col.aggregate(spend_pipeline).to_list(length=1)

    avg_spend = 0.0
    median_spend = 0.0
    repeat_purchase_rate = 0.0
    customers_with_orders = 0

    if spend_result:
        r = spend_result[0]
        avg_spend = round(r.get("avg_spend", 0), 2)
        customers_with_orders = r.get("total_customers_with_orders", 0)
        repeat_customers = r.get("repeat_customers", 0)
        repeat_purchase_rate = round(
            (repeat_customers / customers_with_orders * 100) if customers_with_orders > 0 else 0, 1
        )
        spends = sorted(r.get("all_spends", []))
        if spends:
            mid = len(spends) // 2
            median_spend = spends[mid] if len(spends) % 2 != 0 else round((spends[mid - 1] + spends[mid]) / 2, 2)

    # 3. Top cities from matching customers
    city_pipeline = [
        {"$match": {**mongo_filter, "city": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8},
    ]
    city_result = await customers_col.aggregate(city_pipeline).to_list(length=8)
    city_distribution = [{"city": r["_id"], "count": r["count"]} for r in city_result]
    top_cities = [r["city"] for r in city_result[:3]]

    # 4. Spend range buckets
    spend_bucket_pipeline = [
        {"$match": {"customer_id": {"$in": customer_ids}}},
        {"$group": {"_id": "$customer_id", "total": {"$sum": "$amount"}}},
        {"$bucket": {
            "groupBy": "$total",
            "boundaries": [0, 2000, 5000, 10000, 25000, 100000],
            "default": "50000+",
            "output": {"count": {"$sum": 1}},
        }},
    ]
    bucket_labels = ["0-2k", "2k-5k", "5k-10k", "10k-25k", "25k-50k", "50k+"]
    try:
        bucket_result = await orders_col.aggregate(spend_bucket_pipeline).to_list(length=10)
        spend_buckets = []
        for i, b in enumerate(bucket_result):
            label = bucket_labels[i] if i < len(bucket_labels) else str(b["_id"])
            spend_buckets.append({"range": label, "count": b["count"]})
    except Exception:
        spend_buckets = []

    # 5. Recent activity (last 30 days)
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=30)
    recent_count = await orders_col.count_documents({
        "customer_id": {"$in": customer_ids},
        "created_at": {"$gte": cutoff},
    })

    return {
        "audience_size": audience_size,
        "avg_spend": avg_spend,
        "median_spend": median_spend,
        "repeat_purchase_rate": repeat_purchase_rate,
        "top_cities": top_cities,
        "city_distribution": city_distribution,
        "spend_buckets": spend_buckets,
        "recent_activity_30d": recent_count,
        "customers_with_orders": customers_with_orders,
    }


def _empty_insights() -> Dict[str, Any]:
    return {
        "audience_size": 0,
        "avg_spend": 0,
        "median_spend": 0,
        "repeat_purchase_rate": 0,
        "top_cities": [],
        "city_distribution": [],
        "spend_buckets": [],
        "recent_activity_30d": 0,
        "customers_with_orders": 0,
    }
