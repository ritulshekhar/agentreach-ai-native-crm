"""
Campaign Performance Prediction Service.
Uses deterministic, channel-based heuristics to predict campaign outcomes
before launch. No external APIs required.
"""

from typing import Dict, Any


# Base rates per channel (industry benchmarks for India e-commerce)
CHANNEL_RATES = {
    "whatsapp": {
        "open_rate": 0.70,
        "ctr": 0.35,
        "conversion_rate": 0.08,
        "avg_order_value_multiplier": 1.0,
    },
    "sms": {
        "open_rate": 0.45,
        "ctr": 0.20,
        "conversion_rate": 0.04,
        "avg_order_value_multiplier": 0.85,
    },
    "email": {
        "open_rate": 0.25,
        "ctr": 0.12,
        "conversion_rate": 0.03,
        "avg_order_value_multiplier": 1.2,
    },
    "rcs": {
        "open_rate": 0.55,
        "ctr": 0.28,
        "conversion_rate": 0.06,
        "avg_order_value_multiplier": 1.1,
    },
}

# Audience quality multipliers
AUDIENCE_MULTIPLIERS = {
    "high_value": 1.3,      # total_spent > 10000
    "recent_active": 1.2,   # ordered in last 30 days
    "inactive": 0.6,        # inactive 45+ days
    "new": 1.1,             # joined last 7 days
    "general": 1.0,
}


def predict_campaign(
    channel: str,
    audience_size: int,
    audience_profile: str = "general",
    avg_order_value: float = 1500.0,
) -> Dict[str, Any]:
    """
    Predict campaign performance metrics before launch.

    Args:
        channel: One of whatsapp, sms, email, rcs
        audience_size: Number of customers in the segment
        audience_profile: One of high_value, recent_active, inactive, new, general
        avg_order_value: Expected AOV in INR

    Returns:
        dict with estimated counts and revenue
    """
    channel = channel.lower()
    rates = CHANNEL_RATES.get(channel, CHANNEL_RATES["whatsapp"])
    multiplier = AUDIENCE_MULTIPLIERS.get(audience_profile, 1.0)

    # Apply multiplier with ceiling at 0.95 to keep realistic
    open_rate = min(rates["open_rate"] * multiplier, 0.95)
    ctr = min(rates["ctr"] * multiplier, 0.85)
    conversion_rate = min(rates["conversion_rate"] * multiplier, 0.50)

    # Estimate delivery (minus failure rate)
    failure_rate = {"whatsapp": 0.08, "sms": 0.05, "email": 0.10, "rcs": 0.12}.get(channel, 0.10)
    delivered = int(audience_size * (1 - failure_rate))
    opened = int(delivered * open_rate)
    clicked = int(opened * ctr)
    converted = int(clicked * conversion_rate)
    revenue = round(converted * avg_order_value * rates["avg_order_value_multiplier"], 2)

    return {
        "channel": channel,
        "audience_size": audience_size,
        "audience_profile": audience_profile,
        "rates": {
            "open_rate_pct": round(open_rate * 100, 1),
            "ctr_pct": round(ctr * 100, 1),
            "conversion_rate_pct": round(conversion_rate * 100, 1),
        },
        "estimated": {
            "delivered": delivered,
            "opened": opened,
            "clicked": clicked,
            "converted": converted,
            "revenue_inr": revenue,
        },
    }


def infer_audience_profile(audience_filter: dict) -> str:
    """Infer audience quality profile from the MongoDB filter dict."""
    if not audience_filter:
        return "general"
    filter_str = str(audience_filter).lower()
    if "total_spent" in filter_str and "$gt" in filter_str:
        return "high_value"
    if "last_order_at" in filter_str and "$gte" in filter_str:
        return "recent_active"
    if ("last_order_at" in filter_str and "$lt" in filter_str) or "inactive" in filter_str:
        return "inactive"
    if "joined_at" in filter_str and "$gte" in filter_str:
        return "new"
    return "general"
