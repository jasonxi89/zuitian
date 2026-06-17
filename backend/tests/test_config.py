def test_default_database_url():
    from app.config import DATABASE_URL
    assert "sqlite" in DATABASE_URL


def test_openrouter_api_key_is_string():
    from app.config import OPENROUTER_API_KEY
    assert isinstance(OPENROUTER_API_KEY, str)


def test_openrouter_model_is_string():
    from app.config import OPENROUTER_MODEL
    assert isinstance(OPENROUTER_MODEL, str)
    assert len(OPENROUTER_MODEL) > 0


def test_openrouter_vision_model_is_string():
    from app.config import OPENROUTER_VISION_MODEL
    assert isinstance(OPENROUTER_VISION_MODEL, str)
    assert len(OPENROUTER_VISION_MODEL) > 0


def test_database_url_is_string():
    from app.config import DATABASE_URL
    assert isinstance(DATABASE_URL, str)
