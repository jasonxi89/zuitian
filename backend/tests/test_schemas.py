def test_chat_request_defaults():
    from app.schemas import ChatRequest
    req = ChatRequest()
    assert req.their_message == ""
    assert req.style == "humorous"
    assert req.context is None
    assert req.images is None


def test_chat_request_with_values():
    from app.schemas import ChatRequest
    req = ChatRequest(their_message="你好", style="gentle", context="初次见面")
    assert req.their_message == "你好"
    assert req.style == "gentle"
    assert req.context == "初次见面"


def test_image_content_default_media_type():
    from app.schemas import ImageContent
    img = ImageContent(data="base64data")
    assert img.media_type == "image/jpeg"


def test_image_content_custom_media_type():
    from app.schemas import ImageContent
    img = ImageContent(data="base64data", media_type="image/png")
    assert img.media_type == "image/png"
    assert img.data == "base64data"


def test_phrase_out_from_orm(db):
    from app.models import Phrase
    from app.schemas import PhraseOut
    p = Phrase(content="hello", category="开场白")
    db.add(p)
    db.commit()
    db.refresh(p)
    out = PhraseOut.model_validate(p)
    assert out.content == "hello"
    assert out.id == p.id
    assert out.category == "开场白"
    assert out.is_pickup_line is False


def test_phrase_out_optional_tags(db):
    from app.models import Phrase
    from app.schemas import PhraseOut
    p = Phrase(content="no tags", category="开场白")
    db.add(p)
    db.commit()
    db.refresh(p)
    out = PhraseOut.model_validate(p)
    assert out.tags is None


def test_phrase_out_with_tags(db):
    from app.models import Phrase
    from app.schemas import PhraseOut
    p = Phrase(content="with tags", category="土味情话", tags="土味,甜蜜", is_pickup_line=True)
    db.add(p)
    db.commit()
    db.refresh(p)
    out = PhraseOut.model_validate(p)
    assert out.tags == "土味,甜蜜"
    assert out.is_pickup_line is True


def test_category_out():
    from app.schemas import CategoryOut
    cat = CategoryOut(name="开场白", count=25)
    assert cat.name == "开场白"
    assert cat.count == 25


def test_chat_request_with_images():
    from app.schemas import ChatRequest, ImageContent
    req = ChatRequest(
        their_message="",
        images=[ImageContent(data="abc123", media_type="image/jpeg")]
    )
    assert req.images is not None
    assert len(req.images) == 1
    assert req.images[0].data == "abc123"
