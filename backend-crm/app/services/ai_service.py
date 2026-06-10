"""
AI Audience Builder - Rule-based NLP parser.
Converts natural language prompts into MongoDB filter queries.
No paid API required.
"""

import re
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any


def parse_audience(prompt: str) -> Tuple[Dict[str, Any], str]:
    """
    Parse a natural language audience prompt into a MongoDB filter.
    Returns (mongo_filter, description)
    """
    prompt_lower = prompt.lower().strip()
    filters = []
    description_parts = []

    # Pattern: spent more than / greater than amount
    match = re.search(r"spent\s+(?:more than|greater than|over|above)\s+[₹rs\.]?\s*(\d+(?:\.\d+)?)", prompt_lower)
    if match:
        amount = float(match.group(1))
        filters.append({"total_spent": {"$gt": amount}})
        description_parts.append(f"spent more than ₹{amount:,.0f}")

    # Pattern: spent less than amount
    match = re.search(r"spent\s+(?:less than|under|below)\s+[₹rs\.]?\s*(\d+(?:\.\d+)?)", prompt_lower)
    if match:
        amount = float(match.group(1))
        filters.append({"total_spent": {"$lt": amount}})
        description_parts.append(f"spent less than ₹{amount:,.0f}")

    # Pattern: inactive for X days
    match = re.search(r"inactive\s+(?:for\s+)?(\d+)\s+days?", prompt_lower)
    if match:
        days = int(match.group(1))
        cutoff = datetime.utcnow() - timedelta(days=days)
        filters.append({
            "$or": [
                {"last_order_at": {"$lt": cutoff}},
                {"last_order_at": None}
            ]
        })
        description_parts.append(f"inactive for {days}+ days")

    # Pattern: no orders in X days
    match = re.search(r"no\s+orders?\s+(?:in\s+)?(?:the\s+)?(?:last\s+)?(\d+)\s+days?", prompt_lower)
    if match:
        days = int(match.group(1))
        cutoff = datetime.utcnow() - timedelta(days=days)
        filters.append({"last_order_at": {"$lt": cutoff}})
        description_parts.append(f"no orders in last {days} days")

    # Pattern: from city
    city_match = re.search(r"from\s+([a-zA-Z\s]+?)(?:\s+who|\s+with|\s+and|$)", prompt_lower)
    if city_match:
        city = city_match.group(1).strip().title()
        filters.append({"city": {"$regex": city, "$options": "i"}})
        description_parts.append(f"from {city}")

    # Pattern: in city
    city_match = re.search(r"in\s+([a-zA-Z\s]+?)(?:\s+who|\s+with|\s+and|$)", prompt_lower)
    if city_match:
        city = city_match.group(1).strip().title()
        # avoid common false positives
        skip_words = ["the", "last", "past", "a", "an"]
        if city.lower() not in skip_words:
            filters.append({"city": {"$regex": city, "$options": "i"}})
            description_parts.append(f"in {city}")

    # Pattern: ordered more than X times
    match = re.search(r"ordered?\s+(?:more than\s+)?(\d+)\s+times?", prompt_lower)
    if match:
        count = int(match.group(1))
        filters.append({"order_count": {"$gt": count}})
        description_parts.append(f"placed more than {count} orders")

    # Pattern: new customers (joined in last X days)
    match = re.search(r"new\s+customers?\s+(?:in\s+)?(?:the\s+)?(?:last\s+)?(\d+)\s+days?", prompt_lower)
    if match:
        days = int(match.group(1))
        cutoff = datetime.utcnow() - timedelta(days=days)
        filters.append({"joined_at": {"$gte": cutoff}})
        description_parts.append(f"joined in last {days} days")

    # Pattern: high value customers (total spent > 10000)
    if re.search(r"high.?value|premium|vip", prompt_lower):
        filters.append({"total_spent": {"$gt": 10000}})
        description_parts.append("high-value (spent > ₹10,000)")

    # Pattern: reactivate / win back
    if re.search(r"reactivate|win.?back|lapsed|churned", prompt_lower):
        cutoff = datetime.utcnow() - timedelta(days=45)
        filters.append({
            "$or": [
                {"last_order_at": {"$lt": cutoff}},
                {"last_order_at": None}
            ]
        })
        description_parts.append("inactive for 45+ days (re-engagement)")

    # Build final filter
    if not filters:
        # Default: all customers
        mongo_filter = {}
        description = "All customers"
    elif len(filters) == 1:
        mongo_filter = filters[0]
        description = ", ".join(description_parts)
    else:
        mongo_filter = {"$and": filters}
        description = " AND ".join(description_parts)

    return mongo_filter, description


def suggest_campaign(prompt: str) -> dict:
    """
    AI Campaign Assistant - rule-based suggestion engine.
    Returns suggested audience, message and channel.
    """
    prompt_lower = prompt.lower()

    # Reactivation intent
    if any(kw in prompt_lower for kw in ["reactivate", "inactive", "win back", "lapsed", "churned", "bring back"]):
        return {
            "intent": "reactivation",
            "audience_description": "Customers inactive for 45+ days",
            "audience_filter": {
                "$or": [
                    {"last_order_at": {"$lt": (datetime.utcnow() - timedelta(days=45)).isoformat()}},
                    {"last_order_at": None}
                ]
            },
            "channel": "whatsapp",
            "message": "Hey {name}! 👋 We miss you! It's been a while since your last purchase. Come back and enjoy 15% OFF your next order. Use code: COMEBACK15. Shop now → [link]",
            "reasoning": "WhatsApp has the highest open rates for re-engagement. The offer incentivizes return."
        }

    # Upsell / high value intent
    if any(kw in prompt_lower for kw in ["upsell", "premium", "vip", "high value", "loyal"]):
        return {
            "intent": "upsell",
            "audience_description": "High-value customers (spent > ₹10,000)",
            "audience_filter": {"total_spent": {"$gt": 10000}},
            "channel": "email",
            "message": "Dear {name}, as one of our valued VIP customers, you get exclusive early access to our Premium Collection. Shop before anyone else → [link]",
            "reasoning": "Email provides a premium feel and is preferred by high-value shoppers."
        }

    # New customer onboarding
    if any(kw in prompt_lower for kw in ["new", "welcome", "onboard", "first time"]):
        return {
            "intent": "onboarding",
            "audience_description": "New customers (joined in last 7 days)",
            "audience_filter": {"joined_at": {"$gte": (datetime.utcnow() - timedelta(days=7)).isoformat()}},
            "channel": "email",
            "message": "Welcome, {name}! 🎉 Thank you for joining us. Here's 10% OFF your first purchase as a thank-you gift. Code: WELCOME10 → [link]",
            "reasoning": "Welcome emails drive first purchases. Email builds brand trust early."
        }

    # Promotional / sale intent
    if any(kw in prompt_lower for kw in ["sale", "discount", "offer", "promo", "promote"]):
        return {
            "intent": "promotion",
            "audience_description": "All active customers",
            "audience_filter": {},
            "channel": "sms",
            "message": "🔥 FLASH SALE! {name}, get 20% OFF on all products today only. Code: FLASH20. Limited time → [link]",
            "reasoning": "SMS for flash sales has near 100% delivery with instant reach."
        }

    # City-based targeting
    city_match = re.search(r"(?:in|from|target)\s+([a-zA-Z]+)", prompt_lower)
    if city_match:
        city = city_match.group(1).title()
        return {
            "intent": "geo_targeting",
            "audience_description": f"Customers from {city}",
            "audience_filter": {"city": {"$regex": city, "$options": "i"}},
            "channel": "whatsapp",
            "message": f"Hi {{name}}! 🏙️ Exciting news for our {city} customers! Local delivery now available. Shop now → [link]",
            "reasoning": "WhatsApp messages feel personal and work great for local campaigns."
        }

    # Default: general engagement
    return {
        "intent": "general_engagement",
        "audience_description": "All customers",
        "audience_filter": {},
        "channel": "rcs",
        "message": "Hi {name}! 🛍️ Check out what's new in store for you. Tap to explore our latest arrivals → [link]",
        "reasoning": "RCS provides rich media experience for general engagement campaigns."
    }
