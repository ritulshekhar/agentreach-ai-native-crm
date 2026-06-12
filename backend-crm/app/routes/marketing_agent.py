from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.marketing_agent_service import analyze_goal
from app.services.channel_recommendation_service import recommend_channel, recommend_channel
from app.repositories.customer_repo import CustomerRepository
from app.models.campaign import CampaignCreate, Channel
from app.repositories.campaign_repo import CampaignRepository
from app.services.campaign_service import dispatch_campaign
from fastapi import BackgroundTasks

router = APIRouter(prefix="/api/agent", tags=["Marketing Agent"])
customer_repo = CustomerRepository()
campaign_repo = CampaignRepository()


class GoalRequest(BaseModel):
    goal: str


class CreateFromRecommendation(BaseModel):
    name: str
    audience_filter: Dict[str, Any]
    audience_description: str
    channel: str
    message: str


@router.post("/analyze", response_model=dict)
async def analyze_marketing_goal(body: GoalRequest):
    """
    Analyze a business goal and return a full campaign recommendation.
    Includes audience filter, channel, message, estimated reach, and performance predictions.
    """
    if not body.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty")

    recommendation = analyze_goal(body.goal)

    # Compute actual audience size from DB
    audience_filter = recommendation["audience_filter"]
    audience_count = await customer_repo.count_by_filter(audience_filter)

    # Channel recommendation with audience context
    channel_rec = recommend_channel(
        audience_size=audience_count,
        audience_filter=audience_filter,
    )

    return {
        "success": True,
        "data": {
            **recommendation,
            "audience_count": audience_count,
            "channel_recommendation": channel_rec,
        },
    }


@router.post("/create-campaign", response_model=dict, status_code=201)
async def create_campaign_from_recommendation(
    data: CreateFromRecommendation,
    background_tasks: BackgroundTasks,
):
    """
    One-click campaign creation from a Marketing Agent recommendation.
    Reuses the standard campaign creation + dispatch flow.
    """
    try:
        channel = Channel(data.channel)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid channel: {data.channel}")

    campaign_data = CampaignCreate(
        name=data.name,
        audience_filter=data.audience_filter,
        audience_description=data.audience_description,
        channel=channel,
        message=data.message,
    )

    customers = await customer_repo.find_by_filter(data.audience_filter)
    audience_count = len(customers)

    campaign = await campaign_repo.create(campaign_data, audience_count)

    if customers:
        background_tasks.add_task(dispatch_campaign, campaign, customers)

    return {
        "success": True,
        "data": campaign,
        "audience_count": audience_count,
    }
