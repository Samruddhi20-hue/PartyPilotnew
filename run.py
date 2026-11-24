from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(__import__("os").getenv("PORT", "5000")), debug=app.config.get("DEBUG", False))
