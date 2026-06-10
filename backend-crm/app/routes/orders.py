from fastapi import APIRouter, HTTPException, Query
from app.models.order import OrderCreate, OrderOut
from app.repositories.order_repo import OrderRepository
from app.repositories.customer_repo import CustomerRepository

router = APIRouter(prefix="/api/orders", tags=["Orders"])
order_repo = OrderRepository()
customer_repo = CustomerRepository()


@router.post("", response_model=dict, status_code=201)
async def create_order(data: OrderCreate):
    # Validate customer exists
    customer = await customer_repo.get_by_id(data.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    try:
        order = await order_repo.create(data)
        return {"success": True, "data": order}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict)
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    orders = await order_repo.get_all(skip=skip, limit=limit)
    total = await order_repo.count()
    return {"success": True, "data": orders, "total": total}


@router.get("/stats/summary", response_model=dict)
async def order_stats():
    stats = await order_repo.get_stats()
    monthly = await order_repo.get_monthly_revenue()
    return {
        "success": True,
        "data": {
            "total_revenue": stats.get("total_revenue", 0),
            "total_orders": stats.get("total_orders", 0),
            "avg_order_value": stats.get("avg_order_value", 0),
            "monthly_revenue": monthly
        }
    }
