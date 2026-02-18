import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base, SessionLocal
from app.models import Phrase  # noqa: F401 - ensure model is registered
from app.seed_data import seed_phrases
from app.routers import phrases, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_phrases(db)
    finally:
        db.close()
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="撩妹话术 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(phrases.router)
app.include_router(chat.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


# Mount static files for production (serves frontend build)
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")


# Catch-all route for SPA: serve static files or index.html
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    # Skip API routes
    if full_path.startswith("api"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    # Try to serve the exact file from static directory (JS, CSS, images)
    if full_path:
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

    # Fallback: serve index.html for SPA routing
    index_path = os.path.join(static_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    return JSONResponse(status_code=404, content={"detail": "Frontend not built yet. Run: cd frontend && npm run build"})
