import json
from unittest.mock import MagicMock, patch


def make_mock_stream(text_chunks: list):
    """
    Return an iterable of OpenAI-style chunk objects.
    chat.py uses:
        for chunk in response:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield ...
    """
    chunks = []
    for text in text_chunks:
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = text
        chunks.append(chunk)
    return iter(chunks)


def make_mock_openai_client(text_chunks: list):
    """Return a mock OpenAI client whose chat.completions.create returns a stream."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = make_mock_stream(text_chunks)
    return mock_client


def parse_sse_events(text: str) -> list:
    """Parse SSE response body into a list of parsed data payloads."""
    events = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("data: "):
            payload = line[6:]
            if payload == "[DONE]":
                events.append({"type": "done"})
            else:
                try:
                    events.append(json.loads(payload))
                except json.JSONDecodeError:
                    events.append({"raw": payload})
    return events


# ---------------------------------------------------------------------------
# No API key: endpoint raises HTTP 500 (not SSE)
# ---------------------------------------------------------------------------

def test_chat_no_api_key_returns_500(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "")
    resp = client.post("/api/chat", json={"their_message": "hello"})
    assert resp.status_code == 500


def test_chat_no_api_key_error_detail(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "")
    resp = client.post("/api/chat", json={"their_message": "hello"})
    data = resp.json()
    assert "detail" in data
    assert "API key" in data["detail"] or "key" in data["detail"].lower()


# ---------------------------------------------------------------------------
# Input validation: empty message AND no images yields error SSE event
# ---------------------------------------------------------------------------

def test_chat_empty_message_no_images_returns_error_sse(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    resp = client.post("/api/chat", json={"their_message": "", "images": None})
    assert resp.status_code == 200
    events = parse_sse_events(resp.text)
    error_events = [e for e in events if "error" in e]
    assert len(error_events) > 0


def test_chat_empty_message_no_images_error_message(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    resp = client.post("/api/chat", json={"their_message": "   ", "images": None})
    events = parse_sse_events(resp.text)
    error_events = [e for e in events if "error" in e]
    assert any("请输入" in e["error"] or "截图" in e["error"] for e in error_events)


# ---------------------------------------------------------------------------
# Successful streaming
# ---------------------------------------------------------------------------

def test_chat_sse_content_type(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_cls.return_value = make_mock_openai_client(["你好"])
        resp = client.post("/api/chat", json={"their_message": "hi"})
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers.get("content-type", "")


def test_chat_sse_done_token_present(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_cls.return_value = make_mock_openai_client(["test chunk"])
        resp = client.post("/api/chat", json={"their_message": "hello"})
        assert "[DONE]" in resp.text


def test_chat_sse_content_events(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_cls.return_value = make_mock_openai_client(["Hello", " world"])
        resp = client.post("/api/chat", json={"their_message": "hi"})
        events = parse_sse_events(resp.text)
        content_events = [e for e in events if "content" in e]
        assert len(content_events) == 2
        assert content_events[0]["content"] == "Hello"
        assert content_events[1]["content"] == " world"


def test_chat_sse_done_event_last(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_cls.return_value = make_mock_openai_client(["chunk"])
        resp = client.post("/api/chat", json={"their_message": "hi"})
        events = parse_sse_events(resp.text)
        assert events[-1] == {"type": "done"}


def test_chat_sse_empty_text_stream(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_cls.return_value = make_mock_openai_client([])
        resp = client.post("/api/chat", json={"their_message": "hi"})
        assert resp.status_code == 200
        assert "[DONE]" in resp.text


# ---------------------------------------------------------------------------
# Style mapping — inspect the messages list passed to create()
# ---------------------------------------------------------------------------

def _get_create_call_user_content(client_fixture, monkeypatch, style):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        client_fixture.post("/api/chat", json={"their_message": "hi", "style": style})
        mock_openai.chat.completions.create.assert_called_once()
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        # messages: [system, user]; user content is a list of blocks
        messages = call_kwargs["messages"]
        user_content = messages[1]["content"]
        return user_content


def test_chat_style_humorous(client, monkeypatch):
    content = _get_create_call_user_content(client, monkeypatch, "humorous")
    text_block = next(b for b in content if b["type"] == "text")
    assert "幽默型" in text_block["text"]


def test_chat_style_gentle(client, monkeypatch):
    content = _get_create_call_user_content(client, monkeypatch, "gentle")
    text_block = next(b for b in content if b["type"] == "text")
    assert "温柔型" in text_block["text"]


def test_chat_style_direct(client, monkeypatch):
    content = _get_create_call_user_content(client, monkeypatch, "direct")
    text_block = next(b for b in content if b["type"] == "text")
    assert "直球型" in text_block["text"]


def test_chat_style_literary(client, monkeypatch):
    content = _get_create_call_user_content(client, monkeypatch, "literary")
    text_block = next(b for b in content if b["type"] == "text")
    assert "文艺型" in text_block["text"]


def test_chat_unknown_style_defaults_to_humorous(client, monkeypatch):
    content = _get_create_call_user_content(client, monkeypatch, "unknown_style")
    text_block = next(b for b in content if b["type"] == "text")
    assert "幽默型" in text_block["text"]


# ---------------------------------------------------------------------------
# Context parameter
# ---------------------------------------------------------------------------

def test_chat_context_included_in_prompt(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        resp = client.post("/api/chat", json={
            "their_message": "你好",
            "context": "初次线下见面后"
        })
        assert resp.status_code == 200
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        user_content = call_kwargs["messages"][1]["content"]
        text_block = next(b for b in user_content if b["type"] == "text")
        assert "初次线下见面后" in text_block["text"]


def test_chat_no_context_not_in_prompt(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        resp = client.post("/api/chat", json={"their_message": "你好"})
        assert resp.status_code == 200
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        user_content = call_kwargs["messages"][1]["content"]
        text_block = next(b for b in user_content if b["type"] == "text")
        assert "聊天背景" not in text_block["text"]


# ---------------------------------------------------------------------------
# Image handling
# ---------------------------------------------------------------------------

def test_chat_with_images_calls_create(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client(["resp"])
        mock_cls.return_value = mock_openai
        resp = client.post("/api/chat", json={
            "their_message": "",
            "images": [{"data": "base64abc", "media_type": "image/jpeg"}]
        })
        assert resp.status_code == 200
        mock_openai.chat.completions.create.assert_called_once()


def test_chat_with_images_includes_image_url_block(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        resp = client.post("/api/chat", json={
            "their_message": "",
            "images": [{"data": "base64abc", "media_type": "image/jpeg"}]
        })
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        user_content = call_kwargs["messages"][1]["content"]
        image_blocks = [b for b in user_content if b["type"] == "image_url"]
        assert len(image_blocks) == 1
        assert image_blocks[0]["image_url"]["url"] == "data:image/jpeg;base64,base64abc"


def test_chat_images_placed_before_text(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        resp = client.post("/api/chat", json={
            "their_message": "看这张图",
            "images": [{"data": "img_data", "media_type": "image/png"}]
        })
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        user_content = call_kwargs["messages"][1]["content"]
        types = [b["type"] for b in user_content]
        assert types.index("image_url") < types.index("text")


def test_chat_with_message_and_image(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client(["ok"])
        mock_cls.return_value = mock_openai
        resp = client.post("/api/chat", json={
            "their_message": "这是对方说的话",
            "images": [{"data": "imgdata", "media_type": "image/jpeg"}]
        })
        assert resp.status_code == 200
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        user_content = call_kwargs["messages"][1]["content"]
        text_block = next(b for b in user_content if b["type"] == "text")
        assert "这是对方说的话" in text_block["text"]
        assert "截图" in text_block["text"]


# ---------------------------------------------------------------------------
# Model routing: vision model for images, text model otherwise
# ---------------------------------------------------------------------------

def test_chat_uses_vision_model_when_images_present(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    monkeypatch.setattr("app.routers.chat.OPENROUTER_VISION_MODEL", "anthropic/claude-opus-4.8")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        client.post("/api/chat", json={
            "their_message": "看图",
            "images": [{"data": "imgdata", "media_type": "image/jpeg"}]
        })
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        assert call_kwargs["model"] == "anthropic/claude-opus-4.8"


def test_chat_uses_text_model_when_no_images(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    monkeypatch.setattr("app.routers.chat.OPENROUTER_MODEL", "deepseek/deepseek-v4-pro")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        client.post("/api/chat", json={"their_message": "hi"})
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        assert call_kwargs["model"] == "deepseek/deepseek-v4-pro"


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

def test_chat_api_error_yields_error_event(client, monkeypatch):
    import openai as openai_module
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = MagicMock()
        mock_cls.return_value = mock_openai
        mock_openai.chat.completions.create.side_effect = Exception("api failed")
        resp = client.post("/api/chat", json={"their_message": "hello"})
        assert resp.status_code == 200
        events = parse_sse_events(resp.text)
        error_events = [e for e in events if "error" in e]
        assert len(error_events) > 0


def test_chat_api_error_no_done_token(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = MagicMock()
        mock_cls.return_value = mock_openai
        mock_openai.chat.completions.create.side_effect = Exception("fail")
        resp = client.post("/api/chat", json={"their_message": "hello"})
        # When the request fails, [DONE] is NOT yielded (only error SSE)
        assert "[DONE]" not in resp.text


# ---------------------------------------------------------------------------
# Request body construction
# ---------------------------------------------------------------------------

def test_chat_message_included_in_prompt(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        resp = client.post("/api/chat", json={"their_message": "你最近怎么样"})
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        user_content = call_kwargs["messages"][1]["content"]
        text_block = next(b for b in user_content if b["type"] == "text")
        assert "你最近怎么样" in text_block["text"]


def test_chat_system_prompt_set(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        client.post("/api/chat", json={"their_message": "hi"})
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        messages = call_kwargs["messages"]
        system_msg = next(m for m in messages if m["role"] == "system")
        assert len(system_msg["content"]) > 0


def test_chat_max_tokens_set(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.OPENROUTER_API_KEY", "test-key")
    with patch("app.routers.chat.OpenAI") as mock_cls:
        mock_openai = make_mock_openai_client([])
        mock_cls.return_value = mock_openai
        client.post("/api/chat", json={"their_message": "hi"})
        call_kwargs = mock_openai.chat.completions.create.call_args[1]
        assert call_kwargs["max_tokens"] == 1024
