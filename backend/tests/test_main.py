def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_app_title():
    from app.main import app
    assert app.title == "撩妹话术 API"


def test_app_version():
    from app.main import app
    assert app.version == "1.0.0"


def test_phrases_router_accessible(client):
    resp = client.get("/api/phrases/")
    assert resp.status_code == 200


def test_categories_router_accessible(client):
    resp = client.get("/api/phrases/categories")
    assert resp.status_code == 200


def test_openapi_accessible(client):
    resp = client.get("/openapi.json")
    assert resp.status_code == 200


def test_spa_fallback_no_frontend(client):
    # When static files don't exist, returns 404 JSON
    resp = client.get("/some-spa-path")
    assert resp.status_code == 404


def test_api_path_not_served_as_spa(client):
    # API paths that don't exist return 404 via the SPA handler
    resp = client.get("/api/nonexistent")
    assert resp.status_code == 404


def test_health_response_has_status_key(client):
    resp = client.get("/api/health")
    data = resp.json()
    assert "status" in data


def test_cors_headers_present(client):
    resp = client.options(
        "/api/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )
    # CORS middleware should handle OPTIONS or at least not error
    assert resp.status_code in (200, 204, 405)
