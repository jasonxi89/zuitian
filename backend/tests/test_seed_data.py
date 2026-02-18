from sqlalchemy import select, func


def test_seed_phrases_function_exists():
    from app.seed_data import seed_phrases
    assert callable(seed_phrases)


def test_seed_phrases_populates_empty_db(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    count = db.query(Phrase).count()
    assert count > 0


def test_seed_phrases_populates_phrases(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    count = db.query(Phrase).count()
    # Verify seed data has a substantial number of phrases
    assert count >= 200


def test_seed_phrases_has_8_categories(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    categories = db.execute(
        select(Phrase.category).distinct()
    ).scalars().all()
    assert len(categories) == 8


def test_seed_phrases_expected_categories(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    categories = set(
        db.execute(select(Phrase.category).distinct()).scalars().all()
    )
    expected = {
        "开场白", "幽默回复", "土味情话", "表白句子",
        "暧昧升温", "约会邀请", "早安晚安", "节日祝福",
    }
    assert categories == expected


def test_seed_phrases_idempotent(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)
    first_count = db.query(Phrase).count()

    seed_phrases(db)
    second_count = db.query(Phrase).count()

    assert first_count == second_count


def test_seed_phrases_does_not_seed_if_data_exists(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    # Pre-populate with one phrase
    existing = Phrase(content="existing phrase", category="开场白")
    db.add(existing)
    db.commit()

    seed_phrases(db)

    # Should still only have 1 phrase (seed was skipped)
    count = db.query(Phrase).count()
    assert count == 1


def test_seed_phrases_cheesy_lines_marked_as_pickup(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    pickup_lines = db.query(Phrase).filter(
        Phrase.category == "土味情话"
    ).all()
    assert len(pickup_lines) > 0
    for phrase in pickup_lines:
        assert phrase.is_pickup_line is True


def test_seed_phrases_openers_not_pickup_lines(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    openers = db.query(Phrase).filter(
        Phrase.category == "开场白"
    ).all()
    assert len(openers) > 0
    for phrase in openers:
        assert phrase.is_pickup_line is False


def test_seed_phrases_all_have_content(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    phrases = db.query(Phrase).all()
    for phrase in phrases:
        assert phrase.content is not None
        assert len(phrase.content) > 0


def test_seed_phrases_all_have_category(db):
    from app.seed_data import seed_phrases
    from app.models import Phrase

    seed_phrases(db)

    phrases = db.query(Phrase).all()
    for phrase in phrases:
        assert phrase.category is not None
        assert len(phrase.category) > 0
