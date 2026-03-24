from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from pathlib import Path
from app.config import settings
from app.routers import admin_router, categories, item_router, regions, user_router
from app.websocket import chat as chat_websocket

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)
uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

prefix = "/api/v1"
app.include_router(user_router.router, prefix=f"{prefix}/users", tags=["users"])
app.include_router(admin_router.router, prefix=f"{prefix}/admin", tags=["admin"])
app.include_router(regions.router, prefix=f"{prefix}/regions", tags=["regions"])
app.include_router(categories.router, prefix=f"{prefix}/categories", tags=["categories"])
app.include_router(item_router.router, prefix=f"{prefix}/items", tags=["items"])
app.include_router(chat_websocket.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
