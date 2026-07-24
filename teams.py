"""MLB teams and deterministic daily Blue Jays badness comparisons."""

from __future__ import annotations

import hashlib
import random
from datetime import date, datetime, timezone
from typing import Any

BLUE_JAYS = {
    "id": "tor",
    "name": "Toronto Blue Jays",
    "short": "Blue Jays",
    "abbr": "TOR",
    "city": "Toronto",
    "league": "AL",
    "division": "East",
    "color": "#134A8E",
}

OTHER_TEAMS: list[dict[str, str]] = [
    # AL East
    {"id": "bal", "name": "Baltimore Orioles", "short": "Orioles", "abbr": "BAL", "city": "Baltimore", "league": "AL", "division": "East", "color": "#DF4601"},
    {"id": "bos", "name": "Boston Red Sox", "short": "Red Sox", "abbr": "BOS", "city": "Boston", "league": "AL", "division": "East", "color": "#BD3039"},
    {"id": "nyy", "name": "New York Yankees", "short": "Yankees", "abbr": "NYY", "city": "New York", "league": "AL", "division": "East", "color": "#0C2340"},
    {"id": "tb", "name": "Tampa Bay Rays", "short": "Rays", "abbr": "TB", "city": "Tampa Bay", "league": "AL", "division": "East", "color": "#092C5C"},
    # AL Central
    {"id": "cws", "name": "Chicago White Sox", "short": "White Sox", "abbr": "CWS", "city": "Chicago", "league": "AL", "division": "Central", "color": "#27251F"},
    {"id": "cle", "name": "Cleveland Guardians", "short": "Guardians", "abbr": "CLE", "city": "Cleveland", "league": "AL", "division": "Central", "color": "#00385D"},
    {"id": "det", "name": "Detroit Tigers", "short": "Tigers", "abbr": "DET", "city": "Detroit", "league": "AL", "division": "Central", "color": "#0C2340"},
    {"id": "kc", "name": "Kansas City Royals", "short": "Royals", "abbr": "KC", "city": "Kansas City", "league": "AL", "division": "Central", "color": "#004687"},
    {"id": "min", "name": "Minnesota Twins", "short": "Twins", "abbr": "MIN", "city": "Minnesota", "league": "AL", "division": "Central", "color": "#002B5C"},
    # AL West
    {"id": "hou", "name": "Houston Astros", "short": "Astros", "abbr": "HOU", "city": "Houston", "league": "AL", "division": "West", "color": "#002D62"},
    {"id": "laa", "name": "Los Angeles Angels", "short": "Angels", "abbr": "LAA", "city": "Los Angeles", "league": "AL", "division": "West", "color": "#BA0021"},
    {"id": "ath", "name": "Athletics", "short": "Athletics", "abbr": "ATH", "city": "Sacramento", "league": "AL", "division": "West", "color": "#003831"},
    {"id": "sea", "name": "Seattle Mariners", "short": "Mariners", "abbr": "SEA", "city": "Seattle", "league": "AL", "division": "West", "color": "#0C2C56"},
    {"id": "tex", "name": "Texas Rangers", "short": "Rangers", "abbr": "TEX", "city": "Texas", "league": "AL", "division": "West", "color": "#003278"},
    # NL East
    {"id": "atl", "name": "Atlanta Braves", "short": "Braves", "abbr": "ATL", "city": "Atlanta", "league": "NL", "division": "East", "color": "#CE1141"},
    {"id": "mia", "name": "Miami Marlins", "short": "Marlins", "abbr": "MIA", "city": "Miami", "league": "NL", "division": "East", "color": "#00A3E0"},
    {"id": "nym", "name": "New York Mets", "short": "Mets", "abbr": "NYM", "city": "New York", "league": "NL", "division": "East", "color": "#002D72"},
    {"id": "phi", "name": "Philadelphia Phillies", "short": "Phillies", "abbr": "PHI", "city": "Philadelphia", "league": "NL", "division": "East", "color": "#E81828"},
    {"id": "wsh", "name": "Washington Nationals", "short": "Nationals", "abbr": "WSH", "city": "Washington", "league": "NL", "division": "East", "color": "#AB0003"},
    # NL Central
    {"id": "chc", "name": "Chicago Cubs", "short": "Cubs", "abbr": "CHC", "city": "Chicago", "league": "NL", "division": "Central", "color": "#0E3386"},
    {"id": "cin", "name": "Cincinnati Reds", "short": "Reds", "abbr": "CIN", "city": "Cincinnati", "league": "NL", "division": "Central", "color": "#C6011F"},
    {"id": "mil", "name": "Milwaukee Brewers", "short": "Brewers", "abbr": "MIL", "city": "Milwaukee", "league": "NL", "division": "Central", "color": "#12284B"},
    {"id": "pit", "name": "Pittsburgh Pirates", "short": "Pirates", "abbr": "PIT", "city": "Pittsburgh", "league": "NL", "division": "Central", "color": "#27251F"},
    {"id": "stl", "name": "St. Louis Cardinals", "short": "Cardinals", "abbr": "STL", "city": "St. Louis", "league": "NL", "division": "Central", "color": "#C41E3A"},
    # NL West
    {"id": "az", "name": "Arizona Diamondbacks", "short": "D-backs", "abbr": "AZ", "city": "Arizona", "league": "NL", "division": "West", "color": "#A71930"},
    {"id": "col", "name": "Colorado Rockies", "short": "Rockies", "abbr": "COL", "city": "Colorado", "league": "NL", "division": "West", "color": "#33006F"},
    {"id": "lad", "name": "Los Angeles Dodgers", "short": "Dodgers", "abbr": "LAD", "city": "Los Angeles", "league": "NL", "division": "West", "color": "#005A9C"},
    {"id": "sd", "name": "San Diego Padres", "short": "Padres", "abbr": "SD", "city": "San Diego", "league": "NL", "division": "West", "color": "#2F241D"},
    {"id": "sf", "name": "San Francisco Giants", "short": "Giants", "abbr": "SF", "city": "San Francisco", "league": "NL", "division": "West", "color": "#FD5A1E"},
]

# Templates for "how the Jays are worse / more cursed than team X today"
COMPARE_TEMPLATES = [
    "The {team} at least look like they know what an outfield is. The Blue Jays today? Absolute chaos in navy and red.",
    "Somehow the Blue Jays are making the {team} look like a dynasty. Sit with that.",
    "Fans of the {team} get bad nights. Blue Jays fans get existential philosophy papers.",
    "If the {team} are having a rough stretch, the Blue Jays are having a rough decade — compressed into one afternoon.",
    "The {team} can still say 'wait till next year' with a straight face. Blue Jays fans are negotiating with next decade.",
    "Compared to Toronto right now, the {team} feel like a well-run Fortune 500 company.",
    "Even a {team} fan would look at the Jays today and whisper: 'yikes, buddy.'",
    "The {team} lose games. The Blue Jays invent new ways to lose games and file patents.",
    "Blue Jays baseball today makes a quiet night in {city} feel like a World Series parade.",
    "Relative to the {team}, Toronto's vibes are sitting somewhere between 'haunted stadium' and 'group project with no leader.'",
    "The {team} have bad innings. The Blue Jays have bad innings that become folklore.",
    "If baseball is theater, the {team} are drama. The Blue Jays are experimental absurdist performance art.",
    "At least {team} fans can point to a plan. Blue Jays fans are pointing at a weather map of despair.",
    "The {team} might be mid. The Blue Jays today are mid-but-somehow-worse, which is a special skill.",
    "Watching the Jays next to the {team} is like comparing a flat tire to a car that never had wheels.",
]

MOOD_LABELS = {
    1: "Actually fine?",
    2: "Mildly annoyed",
    3: "Classic Jays",
    4: "Sighing in Rogers Centre",
    5: "Moderately cooked",
    6: "Pretty bad, honestly",
    7: "Spiritually unwell",
    8: "This is a crisis",
    9: "Call the hotline",
    10: "Existential collapse",
}

HEADLINES = [
    "Blue Jays Badness Index: still undefeated at being defeated",
    "Today's official finding: the Jays remain scientifically bad",
    "Breaking: every other MLB team is having a better vibes day",
    "Rogers Centre weather report: 100% chance of pain",
    "Daily confirmation: yes, it's still that kind of Blue Jays day",
    "Scientists measure Jays misery. Results: yes.",
    "The Badness Index has entered the chat — and it's wearing a jay hat",
    "Another day, another 29 teams looking relatively competent",
]


def _rng_for(day: str, salt: str = "") -> random.Random:
    h = hashlib.sha256(f"{day}:{salt}".encode()).hexdigest()
    return random.Random(int(h[:16], 16))


def today_iso() -> str:
    return date.today().isoformat()


def daily_badness_score(day: str | None = None) -> float:
    """Deterministic 5.5–9.8 'how bad are the Jays today' score from the date."""
    day = day or today_iso()
    rng = _rng_for(day, "badness")
    # Slight weekday mood: Mondays a bit worse, Fridays slightly less brutal
    d = date.fromisoformat(day)
    weekday_bump = {0: 0.5, 1: 0.25, 2: 0.1, 3: 0.0, 4: -0.15, 5: -0.1, 6: 0.15}.get(
        d.weekday(), 0
    )
    base = rng.uniform(5.8, 9.2) + weekday_bump
    return round(min(9.8, max(5.5, base)), 1)


def build_comparisons(day: str | None = None) -> list[dict[str, Any]]:
    day = day or today_iso()
    rng = _rng_for(day, "comparisons")
    jays_score = daily_badness_score(day)
    comparisons = []

    for team in OTHER_TEAMS:
        t_rng = _rng_for(day, team["id"])
        # Other team's "relative competence" so Jays always look worse-ish
        other_badness = round(t_rng.uniform(1.5, max(2.0, jays_score - 0.8)), 1)
        gap = round(jays_score - other_badness, 1)
        template = t_rng.choice(COMPARE_TEMPLATES)
        blurb = template.format(team=team["short"], city=team["city"])
        comparisons.append(
            {
                "team": team,
                "jays_badness": jays_score,
                "their_badness": other_badness,
                "gap": gap,
                "blurb": blurb,
                "verdict": _verdict(gap),
            }
        )

    # Sort worst gaps first (Jays relatively worst)
    comparisons.sort(key=lambda c: c["gap"], reverse=True)
    return comparisons


def _verdict(gap: float) -> str:
    if gap >= 5:
        return "Catastrophically worse"
    if gap >= 3.5:
        return "Meaningfully worse"
    if gap >= 2:
        return "Clearly worse"
    if gap >= 1:
        return "Slightly worse"
    return "Basically tied (still bad)"


def daily_payload(day: str | None = None) -> dict[str, Any]:
    day = day or today_iso()
    score = daily_badness_score(day)
    rng = _rng_for(day, "headline")
    headline = rng.choice(HEADLINES)
    comparisons = build_comparisons(day)
    # Summary stats
    avg_gap = round(sum(c["gap"] for c in comparisons) / len(comparisons), 2)
    worst = comparisons[0]
    closest = comparisons[-1]

    return {
        "date": day,
        "headline": headline,
        "official_badness": score,
        "mood_label": MOOD_LABELS.get(int(round(score)), "Bad"),
        "blue_jays": BLUE_JAYS,
        "comparisons": comparisons,
        "summary": {
            "teams_compared": len(comparisons),
            "avg_gap": avg_gap,
            "worst_matchup": {
                "team": worst["team"]["short"],
                "gap": worst["gap"],
            },
            "closest_matchup": {
                "team": closest["team"]["short"],
                "gap": closest["gap"],
            },
        },
        "mood_labels": MOOD_LABELS,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
