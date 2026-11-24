"""Provider orchestration for PartyPilot venue discovery.

Google Places (New) is the sole venue-data provider. Geoapify remains available
only for location geocoding/autocomplete; TomTom is no longer used for venue
search or details.
"""
from app.services.google_places import (
    search_google_places,
    get_google_place_details,
)
from app.services.location_service import geocode_location


GOOGLE_CATEGORY_QUERIES = {
    "all": "event venues restaurants cafes pubs bars",
    "restaurant": "restaurants",
    "cafe": "cafes",
    "pub": "pubs and bars",
}


def get_venues(
    location=None, category="all", guests=None, latitude=None, longitude=None,
    radius=5000, include_coordinates=False,
):
    """Find nearby venues using Google Places (New) only."""
    if latitude is not None and longitude is not None:
        resolved = {
            "latitude": latitude,
            "longitude": longitude,
            "address": location,
        }
    elif location:
        resolved = geocode_location(location)
    else:
        resolved = None

    if not resolved or resolved.get("latitude") is None or resolved.get("longitude") is None:
        return ([], resolved) if include_coordinates else []

    category_query = GOOGLE_CATEGORY_QUERIES.get(
        (category or "all").strip().lower(),
        str(category).replace("_", " "),
    )
    search_location = location or resolved.get("address")
    venues = search_google_places(
        location=search_location,
        query=category_query,
        latitude=resolved["latitude"],
        longitude=resolved["longitude"],
        radius=radius,
        limit=20,
    )

    # Keep results within the requested radius. Google uses a location bias,
    # not a strict radius restriction, so enforce distance locally when possible.
    try:
        from math import radians, sin, cos, sqrt, atan2
        def distance_m(lat1, lon1, lat2, lon2):
            earth = 6371000
            dlat, dlon = radians(lat2-lat1), radians(lon2-lon1)
            a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
            return earth * 2 * atan2(sqrt(a), sqrt(1-a))
        for venue in venues:
            vlat, vlon = venue.get("latitude"), venue.get("longitude")
            if vlat is not None and vlon is not None:
                venue["distance"] = distance_m(
                    float(resolved["latitude"]), float(resolved["longitude"]),
                    float(vlat), float(vlon)
                )
        venues = [
            venue for venue in venues
            if venue.get("distance") is None or venue["distance"] <= radius
        ]
    except (TypeError, ValueError):
        pass

    return (venues, resolved) if include_coordinates else venues


def search_businesses(query, city=None, latitude=None, longitude=None, limit=20):
    """Search business names with Google Places (New), with no TomTom fallback."""
    if (latitude is None or longitude is None) and city:
        resolved = geocode_location(city)
        if resolved:
            latitude = resolved.get("latitude")
            longitude = resolved.get("longitude")

    return search_google_places(
        location=city,
        query=query,
        limit=min(int(limit), 20),
        latitude=latitude,
        longitude=longitude,
    )


def get_venue_by_id(venue_id, latitude=None, longitude=None, source="google_places"):
    """Fetch Google Place Details using the original Google Place ID."""
    source = (source or "google_places").strip().lower()
    if source not in ("google", "google_places"):
        return None
    return get_google_place_details(venue_id)
