def test_non_google_provider_is_rejected(client):
    response = client.get("/api/venues/not-a-real-place?source=tomtom")
    assert response.status_code == 400
    assert response.json["success"] is False

def test_venue_page_renders(client):
    response = client.get("/venue/example-place-id")
    assert response.status_code == 200
    assert b"venueDetailContent" in response.data


def test_google_place_details_route_uses_google_provider(client, monkeypatch):
    from app.routes import venue_routes

    monkeypatch.setattr(
        venue_routes,
        "get_venue_by_id",
        lambda venue_id, **kwargs: {
            "id": venue_id,
            "name": "Example Venue",
            "source": "google_places",
            "rating": 4.5,
            "user_ratings_total": 100,
        },
    )
    response = client.get("/api/venues/google-place-id?source=google_places")
    assert response.status_code == 200
    assert response.json["venue"]["rating"] == 4.5


def test_google_place_details_requires_no_coordinates(client, monkeypatch):
    from app.routes import venue_routes

    monkeypatch.setattr(
        venue_routes,
        "get_venue_by_id",
        lambda venue_id, **kwargs: {"id": venue_id, "name": "Google Venue"},
    )
    response = client.get("/api/venues/google-place-id?source=google_places")
    assert response.status_code == 200
