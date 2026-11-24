from flask import Blueprint, current_app, jsonify, render_template, request, Response

from app.services.venue_service import get_venue_by_id
from app.services.google_places import get_google_photo

venue_bp = Blueprint("venues", __name__)
SUPPORTED_SOURCES = ("google_places", "google")


@venue_bp.get("/venue/<path:venue_id>")
def venue_page(venue_id):
    source = request.args.get("source", "google_places").strip().lower()
    if source not in SUPPORTED_SOURCES:
        source = "google_places"
    if source == "google":
        source = "google_places"
    return render_template("venue_details.html", venue_id=venue_id, source=source)


@venue_bp.get("/api/venues/<path:venue_id>")
def venue_details_api(venue_id):
    source = request.args.get("source", "google_places").strip().lower()
    if source not in SUPPORTED_SOURCES:
        return jsonify(success=False, error="Unsupported venue data provider."), 400
    if source == "google":
        source = "google_places"

    latitude = request.args.get("lat", type=float)
    longitude = request.args.get("lon", type=float)
    try:
        venue = get_venue_by_id(venue_id, latitude=latitude, longitude=longitude, source=source)
        if not venue:
            return jsonify(success=False, error="Venue details are unavailable for this listing."), 404
        return jsonify(success=True, venue=venue)
    except Exception:
        current_app.logger.exception("Venue details lookup failed for %s (%s)", venue_id, source)
        return jsonify(success=False, error="Venue details are temporarily unavailable."), 502


@venue_bp.get("/api/google-places/photo/<path:photo_name>")
def google_place_photo(photo_name):
    result = get_google_photo(photo_name, request.args.get("maxWidthPx", 1200, type=int))
    if not result:
        return jsonify(success=False, error="Photo is unavailable."), 404
    content, content_type = result
    if not content_type.startswith("image/"):
        return jsonify(success=False, error="Invalid photo response."), 502
    return Response(content, content_type=content_type, headers={"Cache-Control": "public, max-age=3600"})
