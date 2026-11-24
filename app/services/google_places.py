"""Google Places API (New) integration for PartyPilot."""
from urllib.parse import quote
import requests
from flask import current_app

PLACES_BASE_URL = "https://places.googleapis.com/v1"
SEARCH_URL = f"{PLACES_BASE_URL}/places:searchText"

SEARCH_FIELDS = ",".join([
    "places.id", "places.displayName", "places.formattedAddress",
    "places.location", "places.types", "places.primaryTypeDisplayName",
    "places.nationalPhoneNumber", "places.websiteUri", "places.rating",
    "places.userRatingCount", "places.regularOpeningHours",
    "places.googleMapsUri", "places.priceLevel", "places.photos",
])
DETAIL_FIELDS = ",".join([
    "id", "displayName", "formattedAddress", "location", "types",
    "primaryTypeDisplayName", "nationalPhoneNumber", "internationalPhoneNumber",
    "websiteUri", "rating", "userRatingCount", "regularOpeningHours",
    "googleMapsUri", "priceLevel", "photos",
])


def _api_key():
    return (current_app.config.get("GOOGLE_PLACES_API_KEY") or "").strip()


def _headers(field_mask):
    key = _api_key()
    if not key:
        raise RuntimeError("GOOGLE_PLACES_API_KEY is not configured.")
    return {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": field_mask,
    }


def _normalize_place(place):
    if not isinstance(place, dict):
        return None
    display = place.get("displayName") or {}
    location = place.get("location") or {}
    name = display.get("text") if isinstance(display, dict) else display
    if not place.get("id") or not name:
        return None

    hours = place.get("regularOpeningHours") or {}
    photos = []
    for photo in place.get("photos") or []:
        photo_name = photo.get("name")
        if not photo_name:
            continue
        photos.append({
            "name": photo_name,
            "width": photo.get("widthPx"),
            "height": photo.get("heightPx"),
            "attributions": photo.get("authorAttributions") or [],
        })

    primary_type = place.get("primaryTypeDisplayName") or {}
    if isinstance(primary_type, dict):
        primary_type = primary_type.get("text")
    types = place.get("types") or []

    return {
        "id": place.get("id"),
        "name": str(name),
        "address": place.get("formattedAddress"),
        "location": place.get("formattedAddress"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "category": primary_type or (types[0] if types else "Venue"),
        "categories": types,
        "phone": place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"),
        "website": place.get("websiteUri"),
        "rating": place.get("rating"),
        "user_ratings_total": place.get("userRatingCount"),
        "opening_hours": hours.get("weekdayDescriptions") or [],
        "opening_hours_open_now": hours.get("openNow"),
        "google_maps_url": place.get("googleMapsUri"),
        "price_level": place.get("priceLevel"),
        "photos": photos,
        "source": "google_places",
    }


def search_google_places(location=None, query="venues", radius=None, limit=20,
                         latitude=None, longitude=None):
    """Search Google Places (New) and return normalized results."""
    if not _api_key():
        current_app.logger.info("Google Places is not configured; skipping Google search.")
        return []
    text_query = ", ".join(part for part in [query, location] if part)
    if not text_query:
        return []

    body = {"textQuery": text_query, "pageSize": max(1, min(int(limit), 20))}
    if latitude is not None and longitude is not None and radius:
        body["locationBias"] = {
            "circle": {
                "center": {"latitude": float(latitude), "longitude": float(longitude)},
                "radius": float(min(max(int(radius), 1), 50000)),
            }
        }
    try:
        response = requests.post(
            SEARCH_URL, headers=_headers(SEARCH_FIELDS), json=body, timeout=15
        )
        if response.status_code == 400 and "INVALID_ARGUMENT" in response.text:
            current_app.logger.warning("Google Places search rejected the requested fields: %s", response.text[:500])
        response.raise_for_status()
        results = response.json().get("places", [])
        return [item for item in (_normalize_place(p) for p in results) if item]
    except requests.RequestException:
        current_app.logger.exception("Google Places (New) search failed")
        return []


def get_google_place_details(place_id):
    """Fetch one Place Details (New) record by its Google Place ID."""
    if not _api_key() or not place_id:
        return None
    url = f"{PLACES_BASE_URL}/places/{quote(str(place_id), safe='')}"
    try:
        response = requests.get(
            url, headers=_headers(DETAIL_FIELDS), timeout=15
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return _normalize_place(response.json())
    except requests.RequestException:
        current_app.logger.exception("Google Place Details (New) failed")
        return None


def get_google_photo(photo_name, max_width=1200):
    """Fetch photo bytes server-side so the API key never reaches the browser."""
    if not _api_key() or not photo_name:
        return None
    url = f"{PLACES_BASE_URL}/{photo_name}/media"
    try:
        response = requests.get(
            url,
            params={"key": _api_key(), "maxWidthPx": max(100, min(int(max_width), 1600))},
            timeout=20,
        )
        response.raise_for_status()
        return response.content, response.headers.get("Content-Type", "image/jpeg")
    except requests.RequestException:
        current_app.logger.exception("Google Place photo retrieval failed")
        return None
