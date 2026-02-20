def test_list_phrases_empty_db(client):
    resp = client.get("/api/phrases/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_phrases_returns_data(client, sample_phrases):
    resp = client.get("/api/phrases/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 5


def test_list_phrases_default_limit_20(client, db):
    from app.models import Phrase
    # Insert 25 phrases
    for i in range(25):
        db.add(Phrase(content=f"话术{i}", category="开场白"))
    db.commit()

    resp = client.get("/api/phrases/")
    assert resp.status_code == 200
    assert len(resp.json()) == 20


def test_list_phrases_filter_category(client, sample_phrases):
    resp = client.get("/api/phrases/?category=开场白")
    data = resp.json()
    assert len(data) == 2
    for p in data:
        assert p["category"] == "开场白"


def test_list_phrases_filter_nonexistent_category(client, sample_phrases):
    resp = client.get("/api/phrases/?category=不存在分类")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_phrases_search_content(client, sample_phrases):
    resp = client.get("/api/phrases/?search=宇宙")
    data = resp.json()
    assert len(data) == 1
    assert "宇宙" in data[0]["content"]


def test_list_phrases_search_partial_match(client, sample_phrases):
    resp = client.get("/api/phrases/?search=你好")
    data = resp.json()
    assert len(data) == 1
    assert "你好" in data[0]["content"]


def test_list_phrases_search_no_match(client, sample_phrases):
    resp = client.get("/api/phrases/?search=完全不存在的词语XYZ")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_phrases_limit(client, sample_phrases):
    resp = client.get("/api/phrases/?limit=2")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_phrases_limit_1(client, sample_phrases):
    resp = client.get("/api/phrases/?limit=1")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_list_phrases_limit_100(client, db):
    from app.models import Phrase
    for i in range(100):
        db.add(Phrase(content=f"话术{i}", category="开场白"))
    db.commit()

    resp = client.get("/api/phrases/?limit=100")
    assert resp.status_code == 200
    assert len(resp.json()) == 100


def test_list_phrases_limit_0_invalid(client):
    resp = client.get("/api/phrases/?limit=0")
    assert resp.status_code == 422


def test_list_phrases_limit_101_invalid(client):
    resp = client.get("/api/phrases/?limit=101")
    assert resp.status_code == 422


def test_list_phrases_offset(client, sample_phrases):
    resp_all = client.get("/api/phrases/?limit=100")
    resp_offset = client.get("/api/phrases/?offset=2&limit=100")
    assert len(resp_offset.json()) == len(resp_all.json()) - 2


def test_list_phrases_offset_beyond_total(client, sample_phrases):
    resp = client.get("/api/phrases/?offset=100&limit=100")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_phrases_offset_negative_invalid(client):
    resp = client.get("/api/phrases/?offset=-1")
    assert resp.status_code == 422


def test_list_phrases_category_and_search_combined(client, sample_phrases):
    resp = client.get("/api/phrases/?category=土味情话&search=宇宙")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["category"] == "土味情话"
    assert "宇宙" in data[0]["content"]


def test_list_phrases_response_schema(client, sample_phrases):
    resp = client.get("/api/phrases/")
    phrase = resp.json()[0]
    assert "id" in phrase
    assert "content" in phrase
    assert "category" in phrase
    assert "is_pickup_line" in phrase
    assert "created_at" in phrase


def test_list_phrases_ordered_by_id(client, sample_phrases):
    resp = client.get("/api/phrases/?limit=100")
    data = resp.json()
    ids = [p["id"] for p in data]
    assert ids == sorted(ids, reverse=True)


def test_random_phrase_returns_one(client, sample_phrases):
    resp = client.get("/api/phrases/random")
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "content" in data
    assert "category" in data


def test_random_phrase_schema(client, sample_phrases):
    resp = client.get("/api/phrases/random")
    data = resp.json()
    assert "id" in data
    assert "content" in data
    assert "category" in data
    assert "is_pickup_line" in data
    assert "created_at" in data


def test_random_phrase_with_category(client, sample_phrases):
    resp = client.get("/api/phrases/random?category=土味情话")
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "土味情话"


def test_random_phrase_404_empty_db(client):
    resp = client.get("/api/phrases/random")
    assert resp.status_code == 404


def test_random_phrase_404_nonexistent_category(client, sample_phrases):
    resp = client.get("/api/phrases/random?category=不存在分类")
    assert resp.status_code == 404


def test_random_phrase_404_detail(client):
    resp = client.get("/api/phrases/random")
    data = resp.json()
    assert "detail" in data


def test_categories_empty_db(client):
    resp = client.get("/api/phrases/categories")
    assert resp.status_code == 200
    assert resp.json() == []


def test_categories_returns_list(client, sample_phrases):
    resp = client.get("/api/phrases/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_categories_response_schema(client, sample_phrases):
    resp = client.get("/api/phrases/categories")
    data = resp.json()
    for item in data:
        assert "name" in item
        assert "count" in item
        assert isinstance(item["name"], str)
        assert isinstance(item["count"], int)


def test_categories_correct_counts(client, sample_phrases):
    resp = client.get("/api/phrases/categories")
    data = resp.json()
    # sample_phrases has 2 开场白, 2 土味情话, 1 早安晚安
    category_map = {item["name"]: item["count"] for item in data}
    assert category_map["开场白"] == 2
    assert category_map["土味情话"] == 2
    assert category_map["早安晚安"] == 1


def test_categories_sorted_by_count_descending(client, sample_phrases):
    resp = client.get("/api/phrases/categories")
    data = resp.json()
    counts = [item["count"] for item in data]
    assert counts == sorted(counts, reverse=True)


def test_categories_correct_names(client, sample_phrases):
    resp = client.get("/api/phrases/categories")
    data = resp.json()
    names = {item["name"] for item in data}
    assert "开场白" in names
    assert "土味情话" in names
    assert "早安晚安" in names
