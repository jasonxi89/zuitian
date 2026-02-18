def test_phrase_create(db):
    from app.models import Phrase
    p = Phrase(content="测试话术", category="开场白")
    db.add(p)
    db.commit()
    db.refresh(p)
    assert p.id is not None
    assert p.content == "测试话术"
    assert p.category == "开场白"
    assert p.created_at is not None


def test_phrase_default_is_pickup_line_false(db):
    from app.models import Phrase
    p = Phrase(content="test", category="开场白")
    db.add(p)
    db.commit()
    db.refresh(p)
    assert p.is_pickup_line is False


def test_phrase_default_tags_none(db):
    from app.models import Phrase
    p = Phrase(content="test", category="开场白")
    db.add(p)
    db.commit()
    db.refresh(p)
    assert p.tags is None


def test_phrase_with_tags(db):
    from app.models import Phrase
    p = Phrase(content="test", category="开场白", tags="搭讪,破冰")
    db.add(p)
    db.commit()
    db.refresh(p)
    assert p.tags == "搭讪,破冰"


def test_phrase_is_pickup_line_true(db):
    from app.models import Phrase
    p = Phrase(content="土味情话内容", category="土味情话", is_pickup_line=True)
    db.add(p)
    db.commit()
    db.refresh(p)
    assert p.is_pickup_line is True


def test_phrase_multiple_inserts(db):
    from app.models import Phrase
    for i in range(5):
        db.add(Phrase(content=f"话术{i}", category="开场白"))
    db.commit()
    count = db.query(Phrase).count()
    assert count == 5


def test_phrase_id_autoincrement(db):
    from app.models import Phrase
    p1 = Phrase(content="first", category="开场白")
    p2 = Phrase(content="second", category="开场白")
    db.add_all([p1, p2])
    db.commit()
    db.refresh(p1)
    db.refresh(p2)
    assert p1.id != p2.id
    assert p2.id > p1.id
