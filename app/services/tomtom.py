
import requests
from flask import current_app


TOMTOM_DISCOVER_URL = (
    "https://api.tomtom.com/maps/orbis/places/discover"
)

TOMTOM_DETAILS_URL = (
    "https://api.tomtom.com/maps/orbis/places/details/pois"
)

TOMTOM_ATTRIBUTES = (
    "results(id,type,title,subtitles,position,distanceInMeters,"
    "address,poiTypes,poiBrands,contacts,openingHours)"
)

DETAIL_ATTRIBUTES = (
    "id,type,title,subtitles,position,address,"
    "poiTypes,poiBrands,contacts,openingHours"
)


def _get_api_key():
    return current_app.config.get("TOMTOM_API_KEY", "").strip()


def _get_text(items):
    values = []

    for item in items or []:
        if isinstance(item, str):
            values.append(item)

        elif isinstance(item, dict):
            value = item.get("value") or item.get("text")

            if value:
                values.append(str(value))

    return ", ".join(values)


def _get_coordinates(position):
    """
    Support the coordinate structures returned by TomTom.
    """

    if not isinstance(position, dict):
        return None, None

    coordinates = position.get("coordinates")

    if isinstance(coordinates, (list, tuple)) and len(coordinates) >= 2:
        try:
            longitude = float(coordinates[0])
            latitude = float(coordinates[1])
            return latitude, longitude
        except (TypeError, ValueError):
            pass

    try:
        latitude = position.get("latitude", position.get("lat"))
        longitude = position.get("longitude", position.get("lon"))

        if latitude is not None and longitude is not None:
            return float(latitude), float(longitude)

    except (TypeError, ValueError):
        pass

    return None, None


def _extract_contact_values(contacts):
    phone = None
    website = None

    for contact in contacts or []:
        if not isinstance(contact, dict):
            continue

        phones = contact.get("phones") or []
        websites = contact.get("websites") or []

        if not phone:
            for item in phones:
                if isinstance(item, dict):
                    phone = item.get("value") or item.get("text")
                elif isinstance(item, str):
                    phone = item

                if phone:
                    break

        if not website:
            for item in websites:
                if isinstance(item, dict):
                    website = item.get("value") or item.get("text")
                elif isinstance(item, str):
                    website = item

                if website:
                    break

        if phone and website:
            break

    return phone, website


def _normalize_result(result):
    if not isinstance(result, dict):
        return None

    address_data = result.get("address") or {}

    if not isinstance(address_data, dict):
        address_data = {}

    latitude, longitude = _get_coordinates(
        result.get("position")
    )

    address_parts = [
        address_data.get("houseNumber"),
        address_data.get("street"),
        address_data.get("neighborhood"),
        address_data.get("municipalitySubdivision"),
        address_data.get("municipality"),
        address_data.get("countrySubdivision"),
        address_data.get("postalCode"),
        address_data.get("country"),
    ]

    address = ", ".join(
        str(part).strip()
        for part in address_parts
        if part
    )

    poi_types = result.get("poiTypes") or []

    categories = [
        item.get("name")
        for item in poi_types
        if isinstance(item, dict) and item.get("name")
    ]

    category = categories[0] if categories else None

    phone, website = _extract_contact_values(
        result.get("contacts")
    )

    name = result.get("title")

    if not name or not str(name).strip():
        return None

    return {
        "id": result.get("id"),
        "name": str(name).strip(),
        "address": address or _get_text(
            result.get("subtitles")
        ),
        "location": (
            address_data.get("municipality")
            or address_data.get("municipalitySubdivision")
        ),
        "latitude": latitude,
        "longitude": longitude,
        "rating": None,
        "user_ratings_total": None,
        "price_per_person": None,
        "capacity": None,
        "category": category,
        "categories": categories,
        "phone": phone,
        "website": website,
        "opening_hours": result.get("openingHours") or [],
        "distance": result.get("distanceInMeters"),
        "source": "tomtom",
    }


def _get_headers(attributes):
    api_key = _get_api_key()

    if not api_key:
        raise RuntimeError(
            "TOMTOM_API_KEY is not configured."
        )

    return {
        "TomTom-Api-Key": api_key,
        "TomTom-Api-Version": "3",
        "Attributes": attributes,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Language": "en-IN",
    }


def search_tomtom_places(
    query,
    city=None,
    latitude=None,
    longitude=None,
    limit=20,
):
    """
    Search for businesses by name using TomTom Places Search.
    """

    query = (query or "").strip()
    city = (city or "").strip()

    if not query:
        return []

    body = {
        "query": f"{query} {city}".strip(),
        "maxResults": min(max(int(limit), 1), 100),
        "filters": {
            "types": ["poi"],
            "countryCodesIso2": ["IN"],
        },
    }

    if latitude is not None and longitude is not None:
        body["preferences"] = {
            "geometry": {
                "type": "point",
                "coordinates": [
                    float(longitude),
                    float(latitude),
                ],
            }
        }

    response = requests.post(
        TOMTOM_DISCOVER_URL,
        headers=_get_headers(TOMTOM_ATTRIBUTES),
        json=body,
        timeout=25,
    )

    response.raise_for_status()

    data = response.json()
    venues = []
    seen_ids = set()

    for result in data.get("results", []):
        if not isinstance(result, dict):
            continue

        if result.get("type") != "poi":
            continue

        venue = _normalize_result(result)

        if not venue:
            continue

        venue_id = venue.get("id")

        if venue_id and venue_id not in seen_ids:
            seen_ids.add(venue_id)
            venues.append(venue)

    return venues


def get_tomtom_place_details(place_id):
    """
    Fetch detailed information for one TomTom POI.
    """

    if not place_id:
        return None

    url = (
        f"{TOMTOM_DETAILS_URL}/"
        f"{requests.utils.quote(str(place_id), safe='')}"
    )

    response = requests.get(
        url,
        headers=_get_headers(DETAIL_ATTRIBUTES),
        timeout=20,
    )

    if response.status_code == 404:
        return None

    response.raise_for_status()

    data = response.json()

    if not isinstance(data, dict):
        return None

    # Some API responses may wrap the result.
    if isinstance(data.get("result"), dict):
        data = data["result"]

    elif isinstance(data.get("results"), list):
        if not data["results"]:
            return None

        data = data["results"][0]

    venue = _normalize_result(data)

    if venue:
        venue["source"] = "tomtom"

    return venue
