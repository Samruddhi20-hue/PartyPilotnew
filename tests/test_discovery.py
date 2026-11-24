def test_location_suggestions_without_query(client):
    response = client.get("/api/locations")
    assert response.status_code == 200
    assert response.json["success"] is True
    assert response.json["suggestions"] == []

def test_invalid_guest_count(client):
    response = client.get("/api/venues?location=Pune&guests=abc")
    assert response.status_code == 400

def test_discovery_without_location_or_coordinates(client):
    response = client.get("/api/venues")
    assert response.status_code == 400
    assert response.json["success"] is False

def test_discovery_endpoint_without_api_key_returns_empty_list(client):
    response = client.get("/api/venues?location=Pune&guests=50")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert isinstance(data["venues"], list)
    assert data["count"] == len(data["venues"])


def test_business_search_reports_google_provider_when_google_returns_results(client, monkeypatch):
    from app.routes import discovery_routes

    monkeypatch.setattr(
        discovery_routes,
        "search_businesses",
        lambda **kwargs: [{"id": "google-id", "name": "Example Venue", "source": "google_places"}],
    )
    response = client.get("/api/venues/search?q=Example&city=Pune")
    assert response.status_code == 200
    assert response.json["search"]["provider"] == "google_places"
    assert response.json["venues"][0]["id"] == "google-id"


def test_google_source_is_supported_on_venue_page(client):
    response = client.get("/venue/google-place-id?source=google_places")
    assert response.status_code == 200
    assert b'data-source="google_places"' in response.data
