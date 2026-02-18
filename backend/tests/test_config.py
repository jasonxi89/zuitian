def test_default_database_url():
    from app.config import DATABASE_URL
    assert "sqlite" in DATABASE_URL


def test_claude_api_key_is_string():
    from app.config import CLAUDE_API_KEY
    assert isinstance(CLAUDE_API_KEY, str)


def test_database_url_is_string():
    from app.config import DATABASE_URL
    assert isinstance(DATABASE_URL, str)
