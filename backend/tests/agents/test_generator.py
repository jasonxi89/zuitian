import json
from datetime import datetime
from unittest.mock import patch, MagicMock

import pytest

from app.agents.generator import (
    _get_season,
    _get_holiday_hint,
    _build_prompt,
    generate_phrases_job,
)
from app.agents.utils import save_new_phrases
from app.models import Phrase


def test_get_season():
    assert _get_season(1) == "冬"
    assert _get_season(4) == "春"
    assert _get_season(7) == "夏"
    assert _get_season(10) == "秋"


def test_get_holiday_hint():
    assert _get_holiday_hint(datetime(2026, 2, 14)) == "情人节"
    assert _get_holiday_hint(datetime(2026, 5, 20)) == "520表白日"
    assert _get_holiday_hint(datetime(2026, 3, 15)) == ""


def test_build_prompt_contains_categories():
    prompt = _build_prompt("- 热点1", datetime(2026, 2, 14), ["开场白", "土味情话"], 3)
    assert "开场白" in prompt
    assert "土味情话" in prompt
    assert "情人节" in prompt
    assert "3" in prompt


def test_save_new_phrases_dedup(db):
    # Add a phrase
    db.add(Phrase(content="你好世界，这是一条测试话术", category="测试", tags="test"))
    db.commit()

    phrases = [
        {"content": "你好世界，这是一条测试话术", "category": "测试", "tags": "test"},
        {"content": "这是一条全新的话术内容哦", "category": "测试", "tags": "new"},
    ]
    added = save_new_phrases(db, phrases)
    assert added == 1

    total = db.query(Phrase).filter(Phrase.category == "测试").count()
    assert total == 2


def test_save_new_phrases_skips_empty(db):
    phrases = [
        {"content": "", "category": "测试"},
        {"content": "   ", "category": "测试"},
    ]
    added = save_new_phrases(db, phrases)
    assert added == 0


@pytest.mark.asyncio
async def test_generate_phrases_job_no_api_key():
    """Should exit gracefully when no API key is set."""
    with patch("app.agents.generator.CLAUDE_API_KEY", ""):
        await generate_phrases_job()  # Should not raise


@pytest.mark.asyncio
async def test_generate_phrases_job_success(db):
    """Mock Claude API and verify phrases are saved."""
    mock_phrases = [
        {"content": "这是AI生成的第一条新鲜话术哦", "category": "开场白", "tags": "AI生成"},
        {"content": "这是AI生成的第二条新鲜话术哦", "category": "土味情话", "tags": "AI生成"},
    ]
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps(mock_phrases, ensure_ascii=False))]

    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    with patch("app.agents.generator.CLAUDE_API_KEY", "test-key"), \
         patch("app.agents.generator.anthropic.Anthropic", return_value=mock_client), \
         patch("app.agents.generator._fetch_trending_topics", return_value="- 测试热点"), \
         patch("app.agents.generator.SessionLocal", return_value=db):
        await generate_phrases_job()

    count = db.query(Phrase).filter(Phrase.tags.like("%AI生成%")).count()
    assert count == 2
