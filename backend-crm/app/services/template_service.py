"""
Campaign Template Service.
Provides predefined campaign templates that auto-fill audience rules,
channel, and message draft when selected by the user.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any


def _build_templates() -> List[Dict[str, Any]]:
    """Build template list with fresh date filters at call time."""
    return [
        {
            "id": "tpl_reactivate",
            "name": "Reactivate Customers",
            "description": "Re-engage customers who haven't ordered in 45+ days",
            "icon": "refresh-cw",
            "color": "#818cf8",
            "audience_description": "Customers inactive for 45+ days",
            "audience_filter": {
                "$or": [
                    {"last_order_at": {"$lt": (datetime.utcnow() - timedelta(days=45)).isoformat()}},
                    {"last_order_at": None},
                ]
            },
            "channel": "whatsapp",
            "message": "Hi {name}, we miss you! Come back and enjoy 20% OFF your next order. Code: COMEBACK20 → [link]",
            "tags": ["re-engagement", "inactive"],
        },
        {
            "id": "tpl_upsell",
            "name": "Upsell Existing Customers",
            "description": "Target high-value customers with premium offers",
            "icon": "trending-up",
            "color": "#34d399",
            "audience_description": "High-value customers (spent > Rs. 10,000)",
            "audience_filter": {"total_spent": {"$gt": 10000}},
            "channel": "email",
            "message": "Dear {name}, as one of our valued VIP customers, you get exclusive early access to our Premium Collection. Shop now → [link]",
            "tags": ["upsell", "vip", "high-value"],
        },
        {
            "id": "tpl_winback",
            "name": "Win Back Churned Users",
            "description": "Bring back customers lost for 90+ days with a strong offer",
            "icon": "user-check",
            "color": "#f59e0b",
            "audience_description": "Customers with no orders in 90+ days",
            "audience_filter": {
                "last_order_at": {"$lt": (datetime.utcnow() - timedelta(days=90)).isoformat()}
            },
            "channel": "sms",
            "message": "Hi {name}! We haven't seen you in a while. Here's 25% OFF just for you. No expiry. Code: WINBACK25 → [link]",
            "tags": ["win-back", "churned"],
        },
        {
            "id": "tpl_first_purchase",
            "name": "First Purchase Offer",
            "description": "Convert new signups with a welcome discount",
            "icon": "gift",
            "color": "#60a5fa",
            "audience_description": "New customers (joined in last 7 days)",
            "audience_filter": {
                "joined_at": {"$gte": (datetime.utcnow() - timedelta(days=7)).isoformat()}
            },
            "channel": "email",
            "message": "Welcome, {name}! Thank you for joining us. Here's 10% OFF your first purchase. Code: WELCOME10 → [link]",
            "tags": ["onboarding", "new", "first-purchase"],
        },
        {
            "id": "tpl_festival",
            "name": "Festival Promotion",
            "description": "Reach all customers with a seasonal sale announcement",
            "icon": "star",
            "color": "#a78bfa",
            "audience_description": "All customers",
            "audience_filter": {},
            "channel": "sms",
            "message": "Celebrate the season, {name}! Get 20% OFF on everything today. Code: FESTIVAL20. Shop now → [link]",
            "tags": ["festival", "sale", "promotion"],
        },
    ]


def get_all_templates() -> List[Dict[str, Any]]:
    """Return all available campaign templates."""
    return _build_templates()


def get_template(template_id: str) -> Dict[str, Any] | None:
    """Return a single template by ID."""
    for tpl in _build_templates():
        if tpl["id"] == template_id:
            return tpl
    return None
