import requests
from flask import current_app

PLACES_URL = "https://api.geoapify.com/v2/places"
DETAILS_URL = "https://api.geoapify.com/v2/place-details"

CATEGORY_MAP = {
    "all": "catering.restaurant,catering.cafe,catering.bar,catering.pub",
    "restaurant": "catering.restaurant",
    "cafe": "catering.cafe",
    "pub": "catering.pub,catering.bar",
    "bar": "catering.bar",
    "rooftop": "catering.restaurant,catering.bar",
    "banquet": "commercial.event_venue,entertainment",
    "resort": "accommodation.hotel,accommodation.resort"
}


def _key():
    return current_app.config.get("GEOAPIFY_API_KEY", "")


def _normalize(feature):
    p = feature.get("properties", {})
    raw = (p.get("datasource") or {}).get("raw") or {}
    cats = p.get("categories") or []
    category = cats[0] if cats else None
    return {
        "id": p.get("place_id"),
        "name": p.get("name") or raw.get("name") or "Unnamed place",
        "address": p.get("formatted") or p.get("address_line2") or p.get("address_line1"),
        "location": p.get("address_line2") or p.get("city") or p.get("state"),
        "latitude": p.get("lat"), "longitude": p.get("lon"),
        "rating": None, "user_ratings_total": None,
        "price_per_person": None, "capacity": None,
        "category": category, "categories": cats,
        "phone": raw.get("phone"), "website": raw.get("website"),
        "opening_hours": p.get("opening_hours"),
        "source": "geoapify"
    }


def search_geoapify_places(latitude, longitude, radius=5000, category="all", limit=50):
    key = _key()
    if not key:
        raise RuntimeError("GEOAPIFY_API_KEY is not configured.")
    cats = CATEGORY_MAP.get(category, CATEGORY_MAP["all"])
    params = {
        "categories": cats,
        "filter": f"circle:{longitude},{latitude},{int(radius)}",
        "bias": f"proximity:{longitude},{latitude}",
        "limit": min(max(int(limit), 1), 100),
        "apiKey": key
    }
    response = requests.get(PLACES_URL, params=params, timeout=20)
    response.raise_for_status()
    return [_normalize(f) for f in response.json().get("features", []) if f.get("properties")]


def get_geoapify_place_details(place_id, latitude=None, longitude=None):
    # Geoapify place-details needs the source place id and a coordinate anchor.
    if not place_id or latitude is None or longitude is None or not _key():
        return None
    params = {"id": place_id, "lat": latitude, "lon": longitude, "apiKey": _key()}
    response = requests.get(DETAILS_URL, params=params, timeout=15)
    response.raise_for_status()
    features = response.json().get("features", [])
    return _normalize(features[0]) if features else None
