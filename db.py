"""SQLite storage for community badness ratings."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "data" / "ratings.db"


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                day TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
                nickname TEXT NOT NULL DEFAULT 'Anonymous',
                note TEXT NOT NULL DEFAULT '',
                voter_key TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_ratings_day ON ratings(day)"
        )
        conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_day_voter
            ON ratings(day, voter_key)
            """
        )
        conn.commit()


def upsert_rating(
    day: str,
    rating: int,
    nickname: str,
    note: str,
    voter_key: str,
) -> dict[str, Any]:
    if not 1 <= rating <= 10:
        raise ValueError("Rating must be between 1 and 10")
    nickname = (nickname or "Anonymous").strip()[:40] or "Anonymous"
    note = (note or "").strip()[:280]
    voter_key = (voter_key or "").strip()[:64]
    if not voter_key:
        raise ValueError("Missing voter key")

    now = datetime.now(timezone.utc).isoformat()
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO ratings (day, rating, nickname, note, voter_key, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(day, voter_key) DO UPDATE SET
                rating = excluded.rating,
                nickname = excluded.nickname,
                note = excluded.note,
                created_at = excluded.created_at
            """,
            (day, rating, nickname, note, voter_key, now),
        )
        conn.commit()
        row = conn.execute(
            """
            SELECT id, day, rating, nickname, note, created_at
            FROM ratings WHERE day = ? AND voter_key = ?
            """,
            (day, voter_key),
        ).fetchone()
    return dict(row)


def day_stats(day: str) -> dict[str, Any]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT rating FROM ratings WHERE day = ?", (day,)
        ).fetchall()
        recent = conn.execute(
            """
            SELECT nickname, rating, note, created_at
            FROM ratings WHERE day = ?
            ORDER BY created_at DESC
            LIMIT 25
            """,
            (day,),
        ).fetchall()

    ratings = [r["rating"] for r in rows]
    distribution = {str(i): 0 for i in range(1, 11)}
    for r in ratings:
        distribution[str(r)] += 1

    avg = round(sum(ratings) / len(ratings), 2) if ratings else None
    return {
        "date": day,
        "count": len(ratings),
        "average": avg,
        "distribution": distribution,
        "recent": [dict(r) for r in recent],
    }


def history(days: int = 60) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT day,
                   COUNT(*) AS count,
                   ROUND(AVG(rating), 2) AS average,
                   MIN(rating) AS min_rating,
                   MAX(rating) AS max_rating
            FROM ratings
            GROUP BY day
            ORDER BY day DESC
            LIMIT ?
            """,
            (days,),
        ).fetchall()
    # Return chronological for charts
    data = [dict(r) for r in rows]
    data.reverse()
    return data


def all_time_stats() -> dict[str, Any]:
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) AS c FROM ratings").fetchone()["c"]
        overall = conn.execute(
            "SELECT ROUND(AVG(rating), 2) AS avg FROM ratings"
        ).fetchone()["avg"]
        worst_day = conn.execute(
            """
            SELECT day, ROUND(AVG(rating), 2) AS average, COUNT(*) AS count
            FROM ratings
            GROUP BY day
            HAVING count >= 1
            ORDER BY average DESC, count DESC
            LIMIT 1
            """
        ).fetchone()
        best_day = conn.execute(
            """
            SELECT day, ROUND(AVG(rating), 2) AS average, COUNT(*) AS count
            FROM ratings
            GROUP BY day
            HAVING count >= 1
            ORDER BY average ASC, count DESC
            LIMIT 1
            """
        ).fetchone()
    return {
        "total_ratings": total,
        "overall_average": overall,
        "worst_day": dict(worst_day) if worst_day else None,
        "best_day": dict(best_day) if best_day else None,
    }
