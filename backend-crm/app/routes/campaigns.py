from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from app.models.campaign import CampaignCreate, ReceiptIn
from app.repositories.campaign_repo import CampaignRepository
from app.repositories.customer_repo import CustomerRepository
from app.services.campaign_service import dispatch_campaign
from datetime import datetime

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])
campaign_repo = CampaignRepository()
customer_repo = CustomerRepository()


@router.post("", response_model=dict, status_code=201)
async def create_campaign(data: CampaignCreate, background_tasks: BackgroundTasks):
    # Get audience
    customers = await customer_repo.find_by_filter(data.audience_filter)
    audience_count = len(customers)
    
    # Create campaign record
    campaign = await campaign_repo.create(data, audience_count)
    
    # Dispatch in background
    if customers:
        background_tasks.add_task(dispatch_campaign, campaign, customers)
    
    return {"success": True, "data": campaign, "audience_count": audience_count}


@router.get("", response_model=dict)
async def list_campaigns(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    campaigns = await campaign_repo.get_all(skip=skip, limit=limit)
    total = await campaign_repo.count()
    return {"success": True, "data": campaigns, "total": total}


@router.get("/{campaign_id}", response_model=dict)
async def get_campaign(campaign_id: str):
    campaign = await campaign_repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    analytics = await campaign_repo.get_analytics(campaign_id)
    return {"success": True, "data": {**campaign, "analytics": analytics}}


@router.get("/{campaign_id}/analytics", response_model=dict)
async def campaign_analytics(campaign_id: str):
    analytics = await campaign_repo.get_analytics(campaign_id)
    return {"success": True, "data": analytics}


@router.post("/receipt", response_model=dict)
async def receive_delivery_receipt(receipt: ReceiptIn):
    """Callback endpoint for channel service to report delivery status."""
    from app.repositories.analytics_repo import AnalyticsRepository
    analytics_repo = AnalyticsRepository()

    doc = {
        "campaign_id": receipt.campaign_id,
        "customer_id": receipt.customer_id,
        "channel": receipt.channel,
        "status": receipt.status,
        "timestamp": datetime.utcnow(),
    }
    if receipt.order_value is not None:
        doc["order_value"] = receipt.order_value

    await campaign_repo.save_receipt(doc)

    # If purchased, also persist to purchased_events for revenue attribution
    if receipt.status == "purchased" and receipt.order_value:
        purchased_doc = {
            "campaign_id": receipt.campaign_id,
            "customer_id": receipt.customer_id,
            "channel": receipt.channel,
            "order_value": receipt.order_value,
            "timestamp": datetime.utcnow(),
        }
        await analytics_repo.save_purchased_event(purchased_doc)

    return {"success": True}
