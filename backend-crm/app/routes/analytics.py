from fastapi import APIRouter, HTTPException, Query
from app.repositories.analytics_repo import AnalyticsRepository
from app.services.audience_insight_service import get_audience_insights
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
analytics_repo = AnalyticsRepository()


@router.get("/funnel/{campaign_id}", response_model=dict)
async def campaign_funnel(campaign_id: str):
    """Return 6-stage delivery funnel for a campaign."""
    data = await analytics_repo.get_campaign_funnel(campaign_id)
    return {"success": True, "data": data}


@router.get("/revenue/{campaign_id}", response_model=dict)
async def campaign_revenue(campaign_id: str):
    """Return revenue attribution data for a campaign."""
    data = await analytics_repo.get_revenue_attribution(campaign_id)
    return {"success": True, "data": data}


@router.get("/top-campaigns", response_model=dict)
async def top_revenue_campaigns(limit: int = Query(5, ge=1, le=20)):
    """Return top campaigns ranked by attributed revenue."""
    data = await analytics_repo.get_top_revenue_campaigns(limit=limit)
    return {"success": True, "data": data}


@router.get("/overall-funnel", response_model=dict)
async def overall_funnel():
    """Return aggregated funnel across all campaigns."""
    data = await analytics_repo.get_overall_funnel()
    return {"success": True, "data": data}


class AudienceInsightRequest(BaseModel):
    mongo_filter: Dict[str, Any] = {}


@router.post("/audience-insights", response_model=dict)
async def audience_insights(body: AudienceInsightRequest):
    """Compute segment analytics for a given MongoDB audience filter."""
    data = await get_audience_insights(body.mongo_filter)
    return {"success": True, "data": data}
