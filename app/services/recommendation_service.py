def recommend_venues(venues, guests=None, budget=None):
    ranked = []
    for original in venues:
        venue = dict(original)
        score = 0
        # Only score information actually supplied by the provider.
        rating = venue.get("rating")
        if isinstance(rating, (int, float)):
            score += max(0, min(float(rating), 5)) * 10
        capacity = venue.get("capacity")
        if guests and isinstance(capacity, int):
            score += 25 if capacity >= guests else -30
        price = venue.get("price_per_person")
        if budget is not None and isinstance(price, (int, float)):
            score += 20 if price <= budget else -15
        venue["recommendation_score"] = round(score, 2)
        ranked.append(venue)
    return sorted(ranked, key=lambda x: x["recommendation_score"], reverse=True)
