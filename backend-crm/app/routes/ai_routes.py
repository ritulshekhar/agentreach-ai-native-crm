from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import parse_audience, suggest_campaign
from app.repositories.customer_repo import CustomerRepository

router = APIRouter(prefix="/api/ai", tags=["AI"])
customer_repo = CustomerRepository()


class AudienceQuery(BaseModel):
    prompt: str


class AssistantQuery(BaseModel):
    message: str


@router.post("/audience", response_model=dict)
async def build_audience(body: AudienceQuery):
    """Parse natural language into MongoDB filter and return matching audience."""
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    mongo_filter, description = parse_audience(body.prompt)
    
    # Get matching customers with enrichment
    customers = await customer_repo.find_by_filter(mongo_filter, limit=200)
    count = await customer_repo.count_by_filter(mongo_filter)
    
    return {
        "success": True,
        "data": {
            "prompt": body.prompt,
            "description": description,
            "mongo_filter": mongo_filter,
            "audience_count": count,
            "preview": customers[:10]  # Show first 10
        }
    }


@router.post("/assistant", response_model=dict)
async def ai_assistant(body: AssistantQuery):
    """Rule-based AI assistant that suggests campaign strategy."""
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    suggestion = suggest_campaign(body.message)
    
    return {
        "success": True,
        "data": suggestion
    }
