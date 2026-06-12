"""
Smart Channel Recommendation Service.
Recommends the best delivery channel based on audience profile,
size, recency, and historical engagement patterns.
"""

from typing import Dict, Any


def recommend_channel(
    audience_size: int,
    avg_spend: float = 0,
    recency_days: float = 30,
    audience_profile: str = "general",
    audience_filter: dict = None,
) -> Dict[str, Any]:
    """
    Recommend the optimal channel for a campaign.

    Decision logic:
    - High-value (>10k spend) + low recency  → Email (premium feel)
    - Inactive (>45 days)                     → WhatsApp (highest re-engagement)
    - Large audience (>500) + time-sensitive  → SMS (mass reach, instant)
    - Rich content / new product              → RCS (interactive)
    - Default / active customers              → WhatsApp (highest open rate)

    Args:
        audience_size: Number of customers in segment
        avg_spend: Average lifetime spend of customers in segment
        recency_days: Average days since last order
        audience_profile: high_value | inactive | new | recent_active | general
        audience_filter: Raw MongoDB filter for context clues

    Returns:
        dict with channel, reasoning, confidence score
    """
    audience_filter = audience_filter or {}
    filter_str = str(audience_filter).lower()

    # High-value customers → Email
    if avg_spend > 10000 or audience_profile == "high_value" or "total_spent" in filter_str:
        return {
            "channel": "email",
            "reasoning": "High-value customers in this segment prefer curated, premium communication. Email delivers the best ROI and allows rich content formatting.",
            "confidence": 88,
            "alternatives": ["whatsapp", "rcs"],
        }

    # Churned / very inactive → WhatsApp (strong re-engagement signal)
    if recency_days > 60 or audience_profile == "inactive":
        return {
            "channel": "whatsapp",
            "reasoning": "Customers in this segment are inactive or lapsed. WhatsApp delivers the highest open and response rates for re-engagement campaigns.",
            "confidence": 85,
            "alternatives": ["sms", "email"],
        }

    # Large audience + general campaign → SMS (widest reach)
    if audience_size > 500 and audience_profile in ["general", "promotion"]:
        return {
            "channel": "sms",
            "reasoning": "For large audiences with broad targeting, SMS guarantees near-instant delivery and high reach without requiring app installation.",
            "confidence": 78,
            "alternatives": ["whatsapp", "rcs"],
        }

    # New customers → Email (welcome flow standard)
    if audience_profile == "new" or "joined_at" in filter_str:
        return {
            "channel": "email",
            "reasoning": "Email is the industry standard for onboarding flows. It builds brand trust and provides a structured first-touch experience.",
            "confidence": 82,
            "alternatives": ["whatsapp"],
        }

    # Rich content / product showcase → RCS
    if audience_size < 200 and avg_spend > 5000:
        return {
            "channel": "rcs",
            "reasoning": "Smaller, higher-quality segments benefit from RCS rich media cards — images, CTAs, and carousels drive significantly higher engagement.",
            "confidence": 75,
            "alternatives": ["email", "whatsapp"],
        }

    # Default: WhatsApp — best general-purpose channel
    return {
        "channel": "whatsapp",
        "reasoning": "WhatsApp delivers the highest open rates (70%+) for this audience profile. It is the most effective general-purpose channel for Indian consumers.",
        "confidence": 80,
        "alternatives": ["sms", "rcs"],
    }
