from unittest.mock import patch, AsyncMock, MagicMock

import pytest

from app.agents.scraper import _classify, _is_valid, scrape_phrases_job
from app.models import Phrase


def test_classify_keywords():
    assert _classify("早安，今天也要开心哦") == "早安问候"
    assert _classify("晚安好梦，明天见") == "晚安问候"
    assert _classify("表白一下，我喜欢你的笑容") == "表白金句"
    assert _classify("这是一段普通的话语没啥特别的") == "高甜语录"


def test_is_valid():
    assert _is_valid("这是一条正常的话术内容，长度刚好够十五个字") is True
    assert _is_valid("太短了") is False
    assert _is_valid("a" * 100) is False
    assert _is_valid("") is False
    assert _is_valid("这句话包含了死字属于敏感词汇") is False
    assert _is_valid("2024年1月1日这是标题") is False
    assert _is_valid("https://example.com/not-a-phrase") is False


@pytest.mark.asyncio
async def test_scrape_phrases_job_success(db):
    """Mock HTTP response and verify phrases are saved."""
    html = """
    <html><body>
    <div class="content">
        <p>1. 你的笑容是我每天最期待的风景呀</p>
        <p>2. 遇见你之后才知道什么叫做心动的感觉</p>
        <p>3. 太短</p>
        <p>4. 每一天因为有你而变得更加美好和温暖</p>
    </div>
    </body></html>
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = html
    mock_resp.content = html.encode("utf-8")
    mock_resp.headers = {"content-type": "text/html; charset=utf-8"}

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(return_value=mock_resp)

    with patch("app.agents.scraper.httpx.AsyncClient", return_value=mock_client), \
         patch("app.agents.scraper.SessionLocal", return_value=db):
        await scrape_phrases_job()

    count = db.query(Phrase).filter(Phrase.tags == "爬取").count()
    assert count >= 1


@pytest.mark.asyncio
async def test_scrape_phrases_job_http_error(db):
    """Should handle HTTP errors gracefully."""
    mock_resp = MagicMock()
    mock_resp.status_code = 500

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(return_value=mock_resp)

    with patch("app.agents.scraper.httpx.AsyncClient", return_value=mock_client), \
         patch("app.agents.scraper.SessionLocal", return_value=db):
        await scrape_phrases_job()  # Should not raise

    count = db.query(Phrase).count()
    assert count == 0
