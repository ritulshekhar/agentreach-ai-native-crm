from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.prediction_service import predict_campaign, infer_audience_profile
from app.services.channel_recommendation_service import recommend_channel
from app.repositories.customer_repo import CustomerRepository

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])
customer_repo = CustomerRepository()


class PredictionRequest(BaseModel):
    channel: str
    audience_filter: Dict[str, Any] = {}
    avg_order_value: Optional[float] = 1500.0


@router.post("/campaign", response_model=dict)
async def predict_campaign_performance(body: PredictionRequest):
    """
    Generate pre-launch performance predictions for a campaign.
    Uses channel heuristics and audience profile inference.
    """
    audience_size = await customer_repo.count_by_filter(body.audience_filter)
    audience_profile = infer_audience_profile(body.audience_filter)

    prediction = predict_campaign(
        channel=body.channel,
        audience_size=audience_size,
        audience_profile=audience_profile,
        avg_order_value=body.avg_order_value or 1500.0,
    )

    channel_rec = recommend_channel(
        audience_size=audience_size,
        audience_profile=audience_profile,
        audience_filter=body.audience_filter,
    )

    return {
        "success": True,
        "data": {
            **prediction,
            "channel_recommendation": channel_rec,
        },
    }
