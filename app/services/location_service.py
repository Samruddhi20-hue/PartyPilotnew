import requests
from flask import current_app

AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete"
SEARCH_URL = "https://api.geoapify.com/v1/geocode/search"

# Curated locality names make the Pune city -> neighbourhood journey useful
# even when the provider ranks only city-level autocomplete results.
CITY_LOCALITIES = {
    "pune": [
        "Kothrud", "Viman Nagar", "Kalyani Nagar", "Koregaon Park",
        "Baner", "Hinjawadi", "Wakad", "Aundh", "Kharadi",
        "Hadapsar", "Magarpatta", "Pimple Saudagar"
    ]
}


def _key():
    return current_app.config.get("GEOAPIFY_API_KEY", "")


def _request(url, params):
    request_params = dict(params)
    request_params.update({
        "filter": "countrycode:in",
        "format": "json",
        "apiKey": _key()
    })
    response = requests.get(url, params=request_params, timeout=12)
    response.raise_for_status()
    return response.json().get("results", [])


def _format_result(item):
    return {
        "description": item.get("formatted") or item.get("name") or "",
        "place_id": item.get("place_id"),
        "latitude": item.get("lat"),
        "longitude": item.get("lon"),
        "city": item.get("city") or item.get("town") or item.get("village"),
        "state": item.get("state"),
        "result_type": item.get("result_type"),
        "source": "geoapify"
    }


def get_location_suggestions(query):
    query = (query or "").strip()
    if len(query) < 2 or not _key():
        return []

    results = _request(AUTOCOMPLETE_URL, {"text": query, "limit": 8})
    suggestions = []
    seen = set()

    for item in results:
        suggestion = _format_result(item)
        key = suggestion["description"].casefold()
        if suggestion["description"] and key not in seen:
            suggestions.append(suggestion)
            seen.add(key)

    # If the user is searching Pune, add its commonly searched localities.
    # These locality suggestions are geocoded by venue_service after selection.
    normalized = query.casefold()
    if "pune".startswith(normalized) or normalized.startswith("pune"):
        for locality in CITY_LOCALITIES["pune"]:
            description = f"{locality}, Pune, Maharashtra, India"
            key = description.casefold()
            if key not in seen:
                suggestions.append({
                    "description": description,
                    "place_id": None,
                    "latitude": None,
                    "longitude": None,
                    "city": "Pune",
                    "state": "Maharashtra",
                    "result_type": "locality",
                    "source": "partypilot"
                })
                seen.add(key)

    return suggestions[:16]


def geocode_location(location):
    if not location or not _key():
        return None
    results = _request(SEARCH_URL, {"text": location, "limit": 1})
    if not results:
        return None
    item = results[0]
    return {
        "latitude": item.get("lat"),
        "longitude": item.get("lon"),
        "address": item.get("formatted"),
        "place_id": item.get("place_id")
    }
