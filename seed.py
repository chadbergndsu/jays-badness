"""Seed sample historical ratings so charts look alive on first run."""

from __future__ import annotations

import random
from datetime import date, datetime, timedelta, timezone

from db import init_db, upsert_rating
from teams import daily_badness_score

NICKNAMES = [
    "Sad in Scarborough",
    "Rogers Row F",
    "Carlos the Pessimist",
    "Vladdy Tears",
    "Batter's Box Blues",
    "North of Despair",
    "7th Inning Stretch",
    "Foul Pole Phil",
    "Cito's Ghost",
    "Dome Dweller",
    "Ace of Spades?",
    "Trade Deadline Ted",
    "Walk-Off Waiter",
    "Bullpen Prayers",
    "Maple Leaf Adjacent",
]


def seed(days: int = 30) -> None:
    init_db()
    today = date.today()
    rng = random.Random(42)

    for offset in range(days, 0, -1):
        day = (today - timedelta(days=offset)).isoformat()
        official = daily_badness_score(day)
        # Number of fake voters that day
        n = rng.randint(8, 28)
        for i in range(n):
            # Ratings cluster around official score with noise
            base = official + rng.uniform(-1.8, 1.8)
            rating = int(max(1, min(10, round(base))))
            nick = rng.choice(NICKNAMES)
            note = ""
            if rng.random() < 0.25:
                note = rng.choice(
                    [
                        "Can't watch anymore",
                        "Maybe tomorrow?",
                        "This is fine.",
                        "Fire someone idk",
                        "Still love them somehow",
                        "My therapist knows the rotation",
                        "Worse than last week",
                    ]
                )
            upsert_rating(
                day=day,
                rating=rating,
                nickname=f"{nick}",
                note=note,
                voter_key=f"seed-{day}-{i}",
            )

    # A few for today so the page isn't empty
    day = today.isoformat()
    official = daily_badness_score(day)
    for i in range(5):
        rating = int(max(1, min(10, round(official + rng.uniform(-1.2, 1.2)))))
        upsert_rating(
            day=day,
            rating=rating,
            nickname=rng.choice(NICKNAMES),
            note="",
            voter_key=f"seed-{day}-live-{i}",
        )

    print(f"Seeded ~{days} days of community ratings into data/ratings.db")


if __name__ == "__main__":
    seed()
