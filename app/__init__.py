from pathlib import Path
from flask import Flask, jsonify, render_template, request
from app.config import Config
from app.extensions import db, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    from app import models  # noqa: F401
    from app.routes import register_routes
    register_routes(app)

    if app.config.get("CREATE_DB_ON_STARTUP", False):
        with app.app_context():
            db.create_all()

    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith("/api/") or request.accept_mimetypes.best == "application/json":
            return jsonify(success=False, error="Resource not found"), 404
        return render_template("404.html"), 404

    @app.errorhandler(500)
    def server_error(error):
        app.logger.exception("Unhandled server error")
        if request.path.startswith("/api/") or request.accept_mimetypes.best == "application/json":
            return jsonify(success=False, error="Internal server error"), 500
        return render_template("500.html"), 500

    return app
