from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_db, close_db
from app.routes import customers, orders, campaigns, ai_routes, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AgentReach CRM API",
    description="AI-Native Mini CRM for Shopper Engagement",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(campaigns.router)
app.include_router(ai_routes.router)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    return {"message": "AgentReach CRM API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
