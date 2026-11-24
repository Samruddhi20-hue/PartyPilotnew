from app.routes.main_routes import main_bp
from app.routes.discovery_routes import discovery_bp
from app.routes.venue_routes import venue_bp
from app.routes.favourite_routes import favourite_bp
from app.routes.enquiry_routes import enquiry_bp


def register_routes(app):
    app.register_blueprint(main_bp)
    app.register_blueprint(discovery_bp, url_prefix="/api")
    app.register_blueprint(venue_bp)  # HTML /venue/<id> and API /api/venues/<id>
    app.register_blueprint(favourite_bp, url_prefix="/api")
    app.register_blueprint(enquiry_bp, url_prefix="/api")
