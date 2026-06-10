from fastapi import APIRouter, HTTPException, Query
from app.models.customer import CustomerCreate, CustomerOut
from app.repositories.customer_repo import CustomerRepository
from app.repositories.order_repo import OrderRepository

router = APIRouter(prefix="/api/customers", tags=["Customers"])
customer_repo = CustomerRepository()
order_repo = OrderRepository()


@router.post("", response_model=dict, status_code=201)
async def create_customer(data: CustomerCreate):
    try:
        customer = await customer_repo.create(data)
        return {"success": True, "data": customer}
    except Exception as e:
        if "duplicate" in str(e).lower():
            raise HTTPException(status_code=409, detail="Customer with this email already exists")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict)
async def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    customers = await customer_repo.get_all(skip=skip, limit=limit)
    total = await customer_repo.count()
    
    # Enrich with order stats
    enriched = []
    for c in customers:
        stats = await order_repo.get_customer_stats(c["customer_id"])
        enriched.append({
            **c,
            "total_spent": stats.get("total_spent", 0),
            "order_count": stats.get("order_count", 0),
            "last_order_at": stats.get("last_order_at"),
        })
    
    return {"success": True, "data": enriched, "total": total, "skip": skip, "limit": limit}


@router.get("/{customer_id}", response_model=dict)
async def get_customer(customer_id: str):
    customer = await customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    stats = await order_repo.get_customer_stats(customer_id)
    orders = await order_repo.get_by_customer(customer_id)
    
    return {
        "success": True,
        "data": {
            **customer,
            "total_spent": stats.get("total_spent", 0),
            "order_count": stats.get("order_count", 0),
            "last_order_at": stats.get("last_order_at"),
            "orders": orders
        }
    }
