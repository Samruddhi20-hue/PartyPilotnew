def test_add_favourite(client):
    response = client.post("/api/favourites", json={"venue_id":"place-123","venue_name":"Example Place"})
    assert response.status_code == 201
    assert response.json["success"] is True

def test_get_favourites(client):
    client.post("/api/favourites", json={"venue_id":"place-123","venue_name":"Example Place"})
    response = client.get("/api/favourites")
    assert response.status_code == 200
    assert len(response.json["favourites"]) == 1

def test_duplicate_favourite(client):
    payload={"venue_id":"place-123","venue_name":"Example Place"}
    client.post("/api/favourites",json=payload)
    response=client.post("/api/favourites",json=payload)
    assert response.status_code == 200
    assert response.json["success"] is True

def test_remove_favourite(client):
    created=client.post("/api/favourites",json={"venue_id":"place-123"})
    favourite_id=created.json["favourite"]["id"]
    response=client.delete(f"/api/favourites/{favourite_id}")
    assert response.status_code == 200
