
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Favourite

favourite_bp = Blueprint("favourites", __name__)


@favourite_bp.route("/favourites", methods=["GET"])
def get_favourites():
    customer_id = request.args.get("customer_id", type=int)

    query = Favourite.query

    if customer_id is not None:
        query = query.filter_by(customer_id=customer_id)

    favourites = query.order_by(Favourite.created_at.desc()).all()

    return jsonify({
        "success": True,
        "favourites": [item.to_dict() for item in favourites]
    })


@favourite_bp.route("/favourites", methods=["POST"])
def add_favourite():
    data = request.get_json(silent=True) or {}

    venue_id = str(data.get("venue_id", "")).strip()
    venue_name = str(data.get("venue_name", "")).strip()
    customer_id = data.get("customer_id")

    if not venue_id:
        return jsonify({"error": "Venue ID is required."}), 400

    if customer_id is not None:
        try:
            customer_id = int(customer_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid customer ID."}), 400

    existing = Favourite.query.filter_by(
        customer_id=customer_id,
        venue_id=venue_id
    ).first()

    if existing:
        return jsonify({
            "success": True,
            "message": "Venue is already shortlisted.",
            "favourite": existing.to_dict()
        })

    favourite = Favourite(
        customer_id=customer_id,
        venue_id=venue_id,
        venue_name=venue_name or None
    )

    try:
        db.session.add(favourite)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Venue added to shortlist.",
            "favourite": favourite.to_dict()
        }), 201

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not save favourite."}), 500


@favourite_bp.route(
    "/favourites/<int:favourite_id>",
    methods=["DELETE"]
)
def remove_favourite(favourite_id):
    favourite = db.session.get(Favourite, favourite_id)

    if not favourite:
        return jsonify({"error": "Favourite not found."}), 404

    try:
        db.session.delete(favourite)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Venue removed from shortlist."
        })

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not remove favourite."}), 500
