import json
from unittest.mock import MagicMock, patch, PropertyMock


def make_mock_stream(text_chunks: list):
    """
    Create a mock that works as a context manager and exposes text_stream.
    chat.py uses:
        with client.messages.stream(...) as stream:
            for text in stream.text_stream:
                yield ...
    """
    mock_stream = MagicMock()
    mock_stream.text_stream = iter(text_chunks)
    mock_stream.__enter__ = MagicMock(return_value=mock_stream)
    mock_stream.__exit__ = MagicMock(return_value=False)
    return mock_stream


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
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "")
    resp = client.post("/api/chat", json={"their_message": "hello"})
    assert resp.status_code == 500


def test_chat_no_api_key_error_detail(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "")
    resp = client.post("/api/chat", json={"their_message": "hello"})
    data = resp.json()
    assert "detail" in data
    assert "API key" in data["detail"] or "key" in data["detail"].lower()


# ---------------------------------------------------------------------------
# Input validation: empty message AND no images yields error SSE event
# ---------------------------------------------------------------------------

def test_chat_empty_message_no_images_returns_error_sse(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    resp = client.post("/api/chat", json={"their_message": "", "images": None})
    assert resp.status_code == 200
    events = parse_sse_events(resp.text)
    error_events = [e for e in events if "error" in e]
    assert len(error_events) > 0


def test_chat_empty_message_no_images_error_message(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    resp = client.post("/api/chat", json={"their_message": "   ", "images": None})
    events = parse_sse_events(resp.text)
    error_events = [e for e in events if "error" in e]
    assert any("请输入" in e["error"] or "截图" in e["error"] for e in error_events)


# ---------------------------------------------------------------------------
# Successful streaming
# ---------------------------------------------------------------------------

def test_chat_sse_content_type(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream(["你好"])

        resp = client.post("/api/chat", json={"their_message": "hi"})
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers.get("content-type", "")


def test_chat_sse_done_token_present(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream(["test chunk"])

        resp = client.post("/api/chat", json={"their_message": "hello"})
        assert "[DONE]" in resp.text


def test_chat_sse_content_events(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream(["Hello", " world"])

        resp = client.post("/api/chat", json={"their_message": "hi"})
        events = parse_sse_events(resp.text)
        content_events = [e for e in events if "content" in e]
        assert len(content_events) == 2
        assert content_events[0]["content"] == "Hello"
        assert content_events[1]["content"] == " world"


def test_chat_sse_done_event_last(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream(["chunk"])

        resp = client.post("/api/chat", json={"their_message": "hi"})
        events = parse_sse_events(resp.text)
        assert events[-1] == {"type": "done"}


def test_chat_sse_empty_text_stream(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        resp = client.post("/api/chat", json={"their_message": "hi"})
        assert resp.status_code == 200
        assert "[DONE]" in resp.text


# ---------------------------------------------------------------------------
# Style mapping
# ---------------------------------------------------------------------------

def _assert_stream_called_with_style(client, monkeypatch, style):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        resp = client.post("/api/chat", json={"their_message": "hi", "style": style})
        assert resp.status_code == 200
        mock_client.messages.stream.assert_called_once()
        # Verify the messages content contains the style label
        call_kwargs = mock_client.messages.stream.call_args[1]
        message_content = call_kwargs["messages"][0]["content"]
        return message_content


def test_chat_style_humorous(client, monkeypatch):
    content = _assert_stream_called_with_style(client, monkeypatch, "humorous")
    text_block = next(b for b in content if b["type"] == "text")
    assert "幽默型" in text_block["text"]


def test_chat_style_gentle(client, monkeypatch):
    content = _assert_stream_called_with_style(client, monkeypatch, "gentle")
    text_block = next(b for b in content if b["type"] == "text")
    assert "温柔型" in text_block["text"]


def test_chat_style_direct(client, monkeypatch):
    content = _assert_stream_called_with_style(client, monkeypatch, "direct")
    text_block = next(b for b in content if b["type"] == "text")
    assert "直球型" in text_block["text"]


def test_chat_style_literary(client, monkeypatch):
    content = _assert_stream_called_with_style(client, monkeypatch, "literary")
    text_block = next(b for b in content if b["type"] == "text")
    assert "文艺型" in text_block["text"]


def test_chat_unknown_style_defaults_to_humorous(client, monkeypatch):
    content = _assert_stream_called_with_style(client, monkeypatch, "unknown_style")
    text_block = next(b for b in content if b["type"] == "text")
    # STYLE_MAP.get() returns "幽默型" as default
    assert "幽默型" in text_block["text"]


# ---------------------------------------------------------------------------
# Context parameter
# ---------------------------------------------------------------------------

def test_chat_context_included_in_prompt(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        resp = client.post("/api/chat", json={
            "their_message": "你好",
            "context": "初次线下见面后"
        })
        assert resp.status_code == 200
        call_kwargs = mock_client.messages.stream.call_args[1]
        message_content = call_kwargs["messages"][0]["content"]
        text_block = next(b for b in message_content if b["type"] == "text")
        assert "初次线下见面后" in text_block["text"]


def test_chat_no_context_not_in_prompt(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        resp = client.post("/api/chat", json={"their_message": "你好"})
        assert resp.status_code == 200
        call_kwargs = mock_client.messages.stream.call_args[1]
        message_content = call_kwargs["messages"][0]["content"]
        text_block = next(b for b in message_content if b["type"] == "text")
        assert "聊天背景" not in text_block["text"]


# ---------------------------------------------------------------------------
# Image handling
# ---------------------------------------------------------------------------

def test_chat_with_images_calls_stream(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream(["resp"])

        resp = client.post("/api/chat", json={
            "their_message": "",
            "images": [{"data": "base64abc", "media_type": "image/jpeg"}]
        })
        assert resp.status_code == 200
        mock_client.messages.stream.assert_called_once()


def test_chat_with_images_includes_image_block(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        resp = client.post("/api/chat", json={
            "their_message": "",
            "images": [{"data": "base64abc", "media_type": "image/jpeg"}]
        })
        call_kwargs = mock_client.messages.stream.call_args[1]
        content = call_kwargs["messages"][0]["content"]
        image_blocks = [b for b in content if b["type"] == "image"]
        assert len(image_blocks) == 1
        assert image_blocks[0]["source"]["type"] == "base64"
        assert image_blocks[0]["source"]["data"] == "base64abc"
        assert image_blocks[0]["source"]["media_type"] == "image/jpeg"


def test_chat_images_placed_before_text(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        resp = client.post("/api/chat", json={
            "their_message": "看这张图",
            "images": [{"data": "img_data", "media_type": "image/png"}]
        })
        call_kwargs = mock_client.messages.stream.call_args[1]
        content = call_kwargs["messages"][0]["content"]
        # Image block should come before text block
        types = [b["type"] for b in content]
        assert types.index("image") < types.index("text")


def test_chat_with_message_and_image(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream(["ok"])

        resp = client.post("/api/chat", json={
            "their_message": "这是对方说的话",
            "images": [{"data": "imgdata", "media_type": "image/jpeg"}]
        })
        assert resp.status_code == 200
        call_kwargs = mock_client.messages.stream.call_args[1]
        content = call_kwargs["messages"][0]["content"]
        text_block = next(b for b in content if b["type"] == "text")
        # Both message and image hint should be in text
        assert "这是对方说的话" in text_block["text"]
        assert "截图" in text_block["text"]


# ---------------------------------------------------------------------------
# Model selection and fallback
# ---------------------------------------------------------------------------

def test_chat_uses_sonnet_as_primary_model(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        client.post("/api/chat", json={"their_message": "hi"})
        call_kwargs = mock_client.messages.stream.call_args[1]
        assert call_kwargs["model"] == "claude-opus-4-6"


def test_chat_fallback_to_haiku_on_api_error(client, monkeypatch):
    import anthropic as anthropic_module
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client

        call_count = 0

        def side_effect(**kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                # sonnet fails
                raise anthropic_module.APIError(
                    message="overloaded", request=MagicMock(), body=None
                )
            # haiku succeeds
            return make_mock_stream(["fallback"])

        mock_client.messages.stream.side_effect = side_effect

        resp = client.post("/api/chat", json={"their_message": "hello"})
        assert resp.status_code == 200
        assert mock_client.messages.stream.call_count == 2
        # Second call should use haiku
        second_call_kwargs = mock_client.messages.stream.call_args_list[1][1]
        assert second_call_kwargs["model"] == "claude-sonnet-4-6"


def test_chat_fallback_response_has_done(client, monkeypatch):
    import anthropic as anthropic_module
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client

        call_count = 0

        def side_effect(**kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise anthropic_module.APIError(
                    message="error", request=MagicMock(), body=None
                )
            return make_mock_stream(["success"])

        mock_client.messages.stream.side_effect = side_effect

        resp = client.post("/api/chat", json={"their_message": "hello"})
        assert "[DONE]" in resp.text


def test_chat_both_models_fail_yields_error(client, monkeypatch):
    import anthropic as anthropic_module
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.side_effect = anthropic_module.APIError(
            message="all models failed", request=MagicMock(), body=None
        )

        resp = client.post("/api/chat", json={"their_message": "hello"})
        assert resp.status_code == 200
        events = parse_sse_events(resp.text)
        error_events = [e for e in events if "error" in e]
        assert len(error_events) > 0


def test_chat_both_models_fail_no_done_token(client, monkeypatch):
    import anthropic as anthropic_module
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.side_effect = anthropic_module.APIError(
            message="fail", request=MagicMock(), body=None
        )

        resp = client.post("/api/chat", json={"their_message": "hello"})
        # When both fail, [DONE] is NOT yielded (only error SSE)
        assert "[DONE]" not in resp.text


# ---------------------------------------------------------------------------
# Request body construction
# ---------------------------------------------------------------------------

def test_chat_message_included_in_prompt(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        resp = client.post("/api/chat", json={"their_message": "你最近怎么样"})
        call_kwargs = mock_client.messages.stream.call_args[1]
        content = call_kwargs["messages"][0]["content"]
        text_block = next(b for b in content if b["type"] == "text")
        assert "你最近怎么样" in text_block["text"]


def test_chat_system_prompt_set(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        client.post("/api/chat", json={"their_message": "hi"})
        call_kwargs = mock_client.messages.stream.call_args[1]
        assert "system" in call_kwargs
        assert len(call_kwargs["system"]) > 0


def test_chat_max_tokens_set(client, monkeypatch):
    monkeypatch.setattr("app.routers.chat.CLAUDE_API_KEY", "test-key")
    with patch("app.routers.chat.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_client.messages.stream.return_value = make_mock_stream([])

        client.post("/api/chat", json={"their_message": "hi"})
        call_kwargs = mock_client.messages.stream.call_args[1]
        assert call_kwargs["max_tokens"] == 1024
