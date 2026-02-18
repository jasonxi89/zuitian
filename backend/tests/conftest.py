import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite://"

# StaticPool ensures all connections share the same in-memory DB
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_phrases(db):
    from app.models import Phrase
    phrases = [
        Phrase(content="你好呀，初次见面", category="开场白", tags="初次,见面", is_pickup_line=False),
        Phrase(content="你笑起来真好看", category="开场白", tags="夸奖", is_pickup_line=False),
        Phrase(content="你是我的宇宙", category="土味情话", tags="浪漫", is_pickup_line=True),
        Phrase(content="你让我的心跳加速", category="土味情话", is_pickup_line=True),
        Phrase(content="晚安，梦里都是你", category="早安晚安", is_pickup_line=False),
    ]
    for p in phrases:
        db.add(p)
    db.commit()
    for p in phrases:
        db.refresh(p)
    return phrases
