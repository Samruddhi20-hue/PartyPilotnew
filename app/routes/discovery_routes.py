
from flask import Blueprint, current_app, jsonify, request

from app.services.location_service import get_location_suggestions
from app.services.venue_service import (
    get_venues,
    search_businesses,
)
from app.services.recommendation_service import recommend_venues

discovery_bp = Blueprint("discovery", __name__)


@discovery_bp.get("/venues")
def discover_venues():
    location = request.args.get("location", "").strip()
    category = request.args.get("category", "all").strip().lower() or "all"

    try:
        guests = int(request.args["guests"]) if request.args.get("guests") else None
        budget = float(request.args["budget"]) if request.args.get("budget") else None
        lat = float(request.args["lat"]) if request.args.get("lat") else None
        lon = float(request.args["lon"]) if request.args.get("lon") else None
        radius = int(request.args.get("radius", 5000))

        if guests is not None and not 1 <= guests <= 10000:
            raise ValueError

        if budget is not None and budget < 0:
            raise ValueError

        if lat is not None and not -90 <= lat <= 90:
            raise ValueError

        if lon is not None and not -180 <= lon <= 180:
            raise ValueError

        if (lat is None) != (lon is None):
            raise ValueError

        if not 100 <= radius <= 50000:
            raise ValueError

    except (TypeError, ValueError):
        return jsonify(
            success=False,
            error="Invalid search parameters.",
            venues=[],
            count=0,
        ), 400

    if not location and lat is None:
        return jsonify(
            success=False,
            error="Enter a location or enable current location.",
            venues=[],
            count=0,
        ), 400

    try:
        venues, resolved = get_venues(
            location=location or None,
            category=category,
            guests=guests,
            latitude=lat,
            longitude=lon,
            radius=radius,
            include_coordinates=True,
        )

        if budget is not None:
            venues = [
                v for v in venues
                if v.get("price_per_person") is None
                or v["price_per_person"] <= budget
            ]

        venues = recommend_venues(
            venues,
            guests=guests,
            budget=budget,
        )

        return jsonify(
            success=True,
            count=len(venues),
            search={
                "location": location or (resolved or {}).get("address"),
                "latitude": (resolved or {}).get("latitude"),
                "longitude": (resolved or {}).get("longitude"),
                "radius_metres": radius,
                "category": category,
            },
            venues=venues,
        )

    except Exception:
        current_app.logger.exception("Venue discovery failed")

        return jsonify(
            success=False,
            error="Venue search is temporarily unavailable.",
            venues=[],
            count=0,
        ), 502


@discovery_bp.get("/venues/search")
def search_venues_by_name():
    query = request.args.get("q", "").strip()
    city = request.args.get("city", "").strip()

    try:
        limit = int(request.args.get("limit", 20))

        if not 1 <= limit <= 50:
            raise ValueError

    except ValueError:
        return jsonify(
            success=False,
            error="Invalid result limit.",
            venues=[],
            count=0,
        ), 400

    if len(query) < 2:
        return jsonify(
            success=False,
            error="Enter at least two characters to search.",
            venues=[],
            count=0,
        ), 400

    if not city:
        return jsonify(
            success=False,
            error="Please select a city.",
            venues=[],
            count=0,
        ), 400

    try:
        venues = search_businesses(
            query=query,
            city=city,
            limit=limit,
        )

        return jsonify(
            success=True,
            count=len(venues),
            search={
                "query": query,
                "city": city,
                "provider": venues[0].get("source", "google_places") if venues else "google_places",
            },
            venues=venues,
        )

    except Exception:
        current_app.logger.exception("Google Places business search failed")

        return jsonify(
            success=False,
            error="Business search is temporarily unavailable.",
            venues=[],
            count=0,
        ), 502


@discovery_bp.get("/locations")
def locations():
    query = request.args.get("q", "").strip()

    if len(query) < 2:
        return jsonify(success=True, suggestions=[])

    try:
        return jsonify(
            success=True,
            suggestions=get_location_suggestions(query),
        )

    except Exception:
        current_app.logger.exception("Location autocomplete failed")

        return jsonify(
            success=False,
            suggestions=[],
            error="Location suggestions unavailable.",
        ), 502
