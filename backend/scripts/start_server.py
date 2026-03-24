"""Container startup helper for local docker-compose."""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import create_engine, text

from app.config import settings

ALEMBIC_INI = PROJECT_ROOT / "alembic" / "alembic.ini"


def wait_for_database(timeout_seconds: int = 90) -> None:
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return
        except Exception as exc:  # pragma: no cover - startup retry path
            last_error = exc
            time.sleep(2)

    raise RuntimeError(f"Database did not become ready in time: {last_error}")


def run_checked(*args: str) -> None:
    subprocess.run(args, cwd=PROJECT_ROOT, check=True)


def main() -> None:
    wait_for_database()

    run_checked(
        sys.executable,
        "-m",
        "alembic",
        "-c",
        str(ALEMBIC_INI),
        "upgrade",
        "head",
    )

    if os.getenv("BOOTSTRAP_DEV_DATA", "true").lower() in {"1", "true", "yes"}:
        bootstrap_args = [sys.executable, "scripts/bootstrap_dev_data.py"]
        if os.getenv("BOOTSTRAP_WITH_ITEMS", "true").lower() in {"1", "true", "yes"}:
            bootstrap_args.append("--with-items")
        run_checked(*bootstrap_args)

    uvicorn_args = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        os.getenv("UVICORN_HOST", "0.0.0.0"),
        "--port",
        os.getenv("UVICORN_PORT", "8000"),
    ]
    if os.getenv("UVICORN_RELOAD", "false").lower() in {"1", "true", "yes"}:
        uvicorn_args.append("--reload")

    os.execvp(sys.executable, uvicorn_args)


if __name__ == "__main__":
    main()
