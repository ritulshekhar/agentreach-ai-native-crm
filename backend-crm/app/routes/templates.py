from fastapi import APIRouter, HTTPException
from app.services.template_service import get_all_templates, get_template

router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.get("", response_model=dict)
async def list_templates():
    """Return all predefined campaign templates."""
    templates = get_all_templates()
    return {"success": True, "data": templates, "total": len(templates)}


@router.get("/{template_id}", response_model=dict)
async def get_template_by_id(template_id: str):
    """Return a single campaign template by ID."""
    template = get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return {"success": True, "data": template}
