"""
Marketing Agent Service - Rule-based goal analysis engine.
Maps marketer business goals to audience segments, channels, and messages.
Designed to be swapped with an LLM call in the future.
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Any


GOAL_INTENTS = [
    {
        "keywords": ["repeat", "repeat purchase", "buy again", "return customer", "increase purchase"],
        "intent": "repeat_purchase",
    },
    {
        "keywords": ["inactive", "reactivate", "win back", "bring back", "lapsed", "re-engage"],
        "intent": "reactivation",
    },
    {
        "keywords": ["upsell", "high value", "premium", "vip", "loyal", "upgrade"],
        "intent": "upsell",
    },
    {
        "keywords": ["churn", "churned", "lost customer", "lost users"],
        "intent": "win_back_churned",
    },
    {
        "keywords": ["new collection", "new product", "new arrival", "launch", "introduce"],
        "intent": "new_collection",
    },
    {
        "keywords": ["welcome", "new customer", "onboard", "first time", "first purchase"],
        "intent": "onboarding",
    },
    {
        "keywords": ["sale", "flash sale", "discount", "offer", "promo", "promotion", "festival"],
        "intent": "promotion",
    },
]


INTENT_STRATEGIES: Dict[str, Dict[str, Any]] = {
    "repeat_purchase": {
        "intent": "repeat_purchase",
        "goal_label": "Increase Repeat Purchases",
        "audience_description": "Customers who made 1-2 purchases in the last 90 days",
        "audience_filter": {"order_count": {"$gte": 1, "$lte": 2}},
        "channel": "whatsapp",
        "message": "Hi {name}! Loved your last purchase? Discover what's new and enjoy 10% OFF on your next order. Code: BACK10 → [link]",
        "reasoning": "Customers with 1-2 orders are most likely to convert again with a small incentive. WhatsApp drives high engagement.",
        "estimated_open_rate": 70,
        "estimated_ctr": 35,
        "estimated_conversion": 8,
    },
    "reactivation": {
        "intent": "reactivation",
        "goal_label": "Reactivate Inactive Customers",
        "audience_description": "Customers inactive for 45+ days",
        "audience_filter": {
            "$or": [
                {"last_order_at": {"$lt": (datetime.utcnow() - timedelta(days=45)).isoformat()}},
                {"last_order_at": None},
            ]
        },
        "channel": "whatsapp",
        "message": "Hi {name}, we miss you! It's been a while. Come back and enjoy 20% OFF your next order. Code: COMEBACK20 → [link]",
        "reasoning": "WhatsApp has the highest open rates for re-engagement. A strong offer (20% OFF) is needed to reactivate dormant users.",
        "estimated_open_rate": 65,
        "estimated_ctr": 30,
        "estimated_conversion": 6,
    },
    "upsell": {
        "intent": "upsell",
        "goal_label": "Upsell High Value Customers",
        "audience_description": "High-value customers (lifetime spend > Rs. 10,000)",
        "audience_filter": {"total_spent": {"$gt": 10000}},
        "channel": "email",
        "message": "Dear {name}, as a valued VIP customer, you get exclusive early access to our Premium Collection. Explore now → [link]",
        "reasoning": "Email suits premium communication. High-value customers expect curated, non-intrusive outreach.",
        "estimated_open_rate": 28,
        "estimated_ctr": 14,
        "estimated_conversion": 5,
    },
    "win_back_churned": {
        "intent": "win_back_churned",
        "goal_label": "Win Back Churned Users",
        "audience_description": "Customers with no orders in 90+ days",
        "audience_filter": {
            "last_order_at": {"$lt": (datetime.utcnow() - timedelta(days=90)).isoformat()}
        },
        "channel": "sms",
        "message": "Hi {name}! We haven't seen you in a while. Here's 25% OFF just for you. No expiry. Code: WINBACK25 → [link]",
        "reasoning": "SMS cuts through inbox noise. Churned users need a compelling reason — a high discount with no expiry performs best.",
        "estimated_open_rate": 45,
        "estimated_ctr": 18,
        "estimated_conversion": 4,
    },
    "new_collection": {
        "intent": "new_collection",
        "goal_label": "Promote New Collection",
        "audience_description": "All active customers (ordered in last 60 days)",
        "audience_filter": {
            "last_order_at": {"$gte": (datetime.utcnow() - timedelta(days=60)).isoformat()}
        },
        "channel": "rcs",
        "message": "Hi {name}! Our new collection is here! Be the first to explore — new styles, new colors, same great quality. Shop now → [link]",
        "reasoning": "RCS offers rich media previews ideal for showcasing new products. Active customers are already engaged.",
        "estimated_open_rate": 55,
        "estimated_ctr": 28,
        "estimated_conversion": 7,
    },
    "onboarding": {
        "intent": "onboarding",
        "goal_label": "Welcome New Customers",
        "audience_description": "Customers joined in the last 7 days",
        "audience_filter": {
            "joined_at": {"$gte": (datetime.utcnow() - timedelta(days=7)).isoformat()}
        },
        "channel": "email",
        "message": "Welcome, {name}! Thank you for joining us. Here's 10% OFF your first purchase as our welcome gift. Code: WELCOME10 → [link]",
        "reasoning": "Email is the standard for welcome flows. First impressions matter — an immediate offer drives first conversion.",
        "estimated_open_rate": 50,
        "estimated_ctr": 25,
        "estimated_conversion": 12,
    },
    "promotion": {
        "intent": "promotion",
        "goal_label": "Run a Promotional Campaign",
        "audience_description": "All customers",
        "audience_filter": {},
        "channel": "sms",
        "message": "FLASH SALE! {name}, 20% OFF on everything today only. Code: FLASH20. Shop now → [link]",
        "reasoning": "SMS ensures near-instant delivery for time-sensitive campaigns. Flash sales need maximum immediate reach.",
        "estimated_open_rate": 45,
        "estimated_ctr": 20,
        "estimated_conversion": 4,
    },
    "general": {
        "intent": "general",
        "goal_label": "General Engagement",
        "audience_description": "All customers",
        "audience_filter": {},
        "channel": "whatsapp",
        "message": "Hi {name}! Check out what's new for you this week. Tap to explore our latest offers → [link]",
        "reasoning": "WhatsApp delivers the highest open rates for general engagement. Broad audience for awareness campaigns.",
        "estimated_open_rate": 70,
        "estimated_ctr": 30,
        "estimated_conversion": 5,
    },
}


def analyze_goal(goal: str) -> Dict[str, Any]:
    """
    Analyze a marketer's business goal and return a full campaign recommendation.
    Entry point designed to be replaced with an LLM call in the future.

    Args:
        goal: Natural language business goal string

    Returns:
        dict with intent, audience, channel, message, and performance estimates
    """
    goal_lower = goal.lower().strip()

    # Match intent by keyword scanning
    matched_intent = None
    for intent_def in GOAL_INTENTS:
        if any(kw in goal_lower for kw in intent_def["keywords"]):
            matched_intent = intent_def["intent"]
            break

    strategy = INTENT_STRATEGIES.get(matched_intent or "general", INTENT_STRATEGIES["general"])

    # Re-compute date-based filters at call time (not at module load)
    strategy = _refresh_date_filters(strategy)

    return {
        "goal": goal,
        "intent": strategy["intent"],
        "goal_label": strategy["goal_label"],
        "audience_description": strategy["audience_description"],
        "audience_filter": strategy["audience_filter"],
        "channel": strategy["channel"],
        "message": strategy["message"],
        "reasoning": strategy["reasoning"],
        "estimated_open_rate": strategy["estimated_open_rate"],
        "estimated_ctr": strategy["estimated_ctr"],
        "estimated_conversion": strategy["estimated_conversion"],
    }


def _refresh_date_filters(strategy: Dict[str, Any]) -> Dict[str, Any]:
    """Recompute any relative date filters to ensure accuracy at runtime."""
    import copy
    s = copy.deepcopy(strategy)
    intent = s["intent"]

    if intent == "reactivation":
        cutoff = (datetime.utcnow() - timedelta(days=45)).isoformat()
        s["audience_filter"] = {
            "$or": [
                {"last_order_at": {"$lt": cutoff}},
                {"last_order_at": None},
            ]
        }
    elif intent == "win_back_churned":
        s["audience_filter"] = {
            "last_order_at": {"$lt": (datetime.utcnow() - timedelta(days=90)).isoformat()}
        }
    elif intent == "new_collection":
        s["audience_filter"] = {
            "last_order_at": {"$gte": (datetime.utcnow() - timedelta(days=60)).isoformat()}
        }
    elif intent == "onboarding":
        s["audience_filter"] = {
            "joined_at": {"$gte": (datetime.utcnow() - timedelta(days=7)).isoformat()}
        }

    return s
