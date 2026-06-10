from fastapi import APIRouter
from app.repositories.customer_repo import CustomerRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.campaign_repo import CampaignRepository

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
customer_repo = CustomerRepository()
order_repo = OrderRepository()
campaign_repo = CampaignRepository()


@router.get("/stats", response_model=dict)
async def dashboard_stats():
    total_customers = await customer_repo.count()
    total_orders = await order_repo.count()
    total_campaigns = await campaign_repo.count()
    order_stats = await order_repo.get_stats()
    monthly = await order_repo.get_monthly_revenue()
    all_analytics = await campaign_repo.get_all_analytics()

    # Aggregate campaign delivery stats
    total_sent = sum(c["analytics"].get("sent", 0) for c in all_analytics)
    total_delivered = sum(c["analytics"].get("delivered", 0) for c in all_analytics)
    total_failed = sum(c["analytics"].get("failed", 0) for c in all_analytics)

    return {
        "success": True,
        "data": {
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_campaigns": total_campaigns,
            "total_revenue": order_stats.get("total_revenue", 0),
            "avg_order_value": order_stats.get("avg_order_value", 0),
            "monthly_revenue": monthly,
            "delivery_summary": {
                "sent": total_sent,
                "delivered": total_delivered,
                "failed": total_failed
            },
            "recent_campaigns": all_analytics[:5]
        }
    }
