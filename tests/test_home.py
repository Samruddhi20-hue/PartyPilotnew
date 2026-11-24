
def test_home_page_loads(client):
    response = client.get("/")
    assert response.status_code == 200


def test_explore_page_loads(client):
    response = client.get("/explore")
    assert response.status_code == 200


def test_contact_page_loads(client):
    response = client.get("/contact")
    assert response.status_code == 200


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"
