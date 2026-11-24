from flask import Blueprint, render_template
main_bp = Blueprint("main", __name__)

@main_bp.get("/")
def home():
    return render_template("index.html")

@main_bp.get("/explore")
def explore():
    return render_template("explore.html")

@main_bp.get("/contact")
def contact():
    return render_template("contact.html")

@main_bp.get("/shortlist")
def shortlist():
    return render_template("shortlist.html")

@main_bp.get("/compare")
def compare():
    return render_template("compare.html")

@main_bp.get("/budget-planner")
def budget_planner():
    return render_template("budget_planner.html")

@main_bp.get("/health")
def health():
    return {"status": "ok", "application": "PartyPilot"}
