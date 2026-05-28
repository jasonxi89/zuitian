def test_default_database_url():
    from app.config import DATABASE_URL
    assert "sqlite" in DATABASE_URL


def test_anthropic_api_key_is_string():
    from app.config import ANTHROPIC_API_KEY
    assert isinstance(ANTHROPIC_API_KEY, str)


def test_anthropic_model_is_string():
    from app.config import ANTHROPIC_MODEL
    assert isinstance(ANTHROPIC_MODEL, str)
    assert len(ANTHROPIC_MODEL) > 0


def test_database_url_is_string():
    from app.config import DATABASE_URL
    assert isinstance(DATABASE_URL, str)
