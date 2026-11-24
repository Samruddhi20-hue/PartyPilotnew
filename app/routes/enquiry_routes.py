import re
from datetime import date
from flask import Blueprint, current_app, jsonify, request
from app.extensions import db
from app.models import Customer, Enquiry

enquiry_bp = Blueprint("enquiries", __name__)


@enquiry_bp.post("/enquiries")
def create_enquiry():
    if not request.is_json:
        return jsonify(success=False, error="Send the form as JSON."), 415
    data = request.get_json(silent=True) or {}
    name = str(data.get("customer_name", data.get("name", ""))).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    if not name or len(name) > 120 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify(success=False, error="Enter a valid name and email address."), 400
    if not re.fullmatch(r"[0-9+() .-]{7,20}", phone):
        return jsonify(success=False, error="Enter a valid phone number."), 400
    try:
        guests = int(data.get("guest_count", data.get("guests", 0)))
        if not 1 <= guests <= 10000:
            raise ValueError
        budget_raw = data.get("budget")
        budget = float(budget_raw) if budget_raw not in (None, "") else None
        if budget is not None and budget < 0:
            raise ValueError
        date_raw = data.get("event_date") or None
        event_date = date.fromisoformat(date_raw) if date_raw else None
        if event_date and event_date < date.today():
            raise ValueError
    except (ValueError, TypeError):
        return jsonify(success=False, error="Check the guest count, budget and event date."), 400

    try:
        customer = Customer.query.filter_by(email=email).first()
        if customer is None:
            customer = Customer(name=name, email=email, phone=phone)
            db.session.add(customer)
            db.session.flush()
        else:
            customer.name, customer.phone = name, phone
        enquiry = Enquiry(
            customer=customer, customer_name=name, email=email, phone=phone,
            venue_id=str(data.get("venue_id") or "")[:150] or None,
            venue_name=str(data.get("venue_name") or "")[:200] or None,
            event_type=str(data.get("event_type") or "")[:100] or None,
            event_date=event_date, guest_count=guests, budget=budget,
            message=str(data.get("message") or "")[:4000] or None
        )
        db.session.add(enquiry)
        db.session.commit()
        return jsonify(success=True, message="Your enquiry has been submitted.", enquiry=enquiry.to_dict()), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Enquiry save failed")
        return jsonify(success=False, error="Unable to submit your enquiry. Please try again."), 500
