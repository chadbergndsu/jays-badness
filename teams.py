"""MLB teams and deterministic daily badness comparisons (any focus team)."""

from __future__ import annotations

import hashlib
import random
from datetime import date, datetime, timezone
from typing import Any

ALL_TEAMS: list[dict[str, str]] = [
    # AL East
    {"id": "bal", "name": "Baltimore Orioles", "short": "Orioles", "abbr": "BAL", "city": "Baltimore", "league": "AL", "division": "East", "color": "#DF4601", "accent": "#000000", "emoji": "🐦", "venue": "Camden Yards"},
    {"id": "bos", "name": "Boston Red Sox", "short": "Red Sox", "abbr": "BOS", "city": "Boston", "league": "AL", "division": "East", "color": "#BD3039", "accent": "#0C2340", "emoji": "🧦", "venue": "Fenway Park"},
    {"id": "nyy", "name": "New York Yankees", "short": "Yankees", "abbr": "NYY", "city": "New York", "league": "AL", "division": "East", "color": "#0C2340", "accent": "#C4CED4", "emoji": "⚾", "venue": "Yankee Stadium"},
    {"id": "tb", "name": "Tampa Bay Rays", "short": "Rays", "abbr": "TB", "city": "Tampa Bay", "league": "AL", "division": "East", "color": "#092C5C", "accent": "#8FBCE6", "emoji": "⚡", "venue": "Tropicana Field"},
    {"id": "tor", "name": "Toronto Blue Jays", "short": "Blue Jays", "abbr": "TOR", "city": "Toronto", "league": "AL", "division": "East", "color": "#134A8E", "accent": "#E31937", "emoji": "🐦", "venue": "Rogers Centre"},
    # AL Central
    {"id": "cws", "name": "Chicago White Sox", "short": "White Sox", "abbr": "CWS", "city": "Chicago", "league": "AL", "division": "Central", "color": "#27251F", "accent": "#C4CED4", "emoji": "🧦", "venue": "Rate Field"},
    {"id": "cle", "name": "Cleveland Guardians", "short": "Guardians", "abbr": "CLE", "city": "Cleveland", "league": "AL", "division": "Central", "color": "#00385D", "accent": "#E31937", "emoji": "🛡️", "venue": "Progressive Field"},
    {"id": "det", "name": "Detroit Tigers", "short": "Tigers", "abbr": "DET", "city": "Detroit", "league": "AL", "division": "Central", "color": "#0C2340", "accent": "#FA4616", "emoji": "🐯", "venue": "Comerica Park"},
    {"id": "kc", "name": "Kansas City Royals", "short": "Royals", "abbr": "KC", "city": "Kansas City", "league": "AL", "division": "Central", "color": "#004687", "accent": "#BD9B60", "emoji": "👑", "venue": "Kauffman Stadium"},
    {"id": "min", "name": "Minnesota Twins", "short": "Twins", "abbr": "MIN", "city": "Minnesota", "league": "AL", "division": "Central", "color": "#002B5C", "accent": "#D31145", "emoji": "👯", "venue": "Target Field"},
    # AL West
    {"id": "hou", "name": "Houston Astros", "short": "Astros", "abbr": "HOU", "city": "Houston", "league": "AL", "division": "West", "color": "#002D62", "accent": "#EB6E1F", "emoji": "⭐", "venue": "Minute Maid Park"},
    {"id": "laa", "name": "Los Angeles Angels", "short": "Angels", "abbr": "LAA", "city": "Los Angeles", "league": "AL", "division": "West", "color": "#BA0021", "accent": "#003263", "emoji": "😇", "venue": "Angel Stadium"},
    {"id": "ath", "name": "Athletics", "short": "Athletics", "abbr": "ATH", "city": "Sacramento", "league": "AL", "division": "West", "color": "#003831", "accent": "#EFB21E", "emoji": "🐘", "venue": "Sutter Health Park"},
    {"id": "sea", "name": "Seattle Mariners", "short": "Mariners", "abbr": "SEA", "city": "Seattle", "league": "AL", "division": "West", "color": "#0C2C56", "accent": "#005C5C", "emoji": "⚓", "venue": "T-Mobile Park"},
    {"id": "tex", "name": "Texas Rangers", "short": "Rangers", "abbr": "TEX", "city": "Texas", "league": "AL", "division": "West", "color": "#003278", "accent": "#C0111F", "emoji": "🤠", "venue": "Globe Life Field"},
    # NL East
    {"id": "atl", "name": "Atlanta Braves", "short": "Braves", "abbr": "ATL", "city": "Atlanta", "league": "NL", "division": "East", "color": "#CE1141", "accent": "#13274F", "emoji": "🪓", "venue": "Truist Park"},
    {"id": "mia", "name": "Miami Marlins", "short": "Marlins", "abbr": "MIA", "city": "Miami", "league": "NL", "division": "East", "color": "#00A3E0", "accent": "#EF3340", "emoji": "🐟", "venue": "loanDepot park"},
    {"id": "nym", "name": "New York Mets", "short": "Mets", "abbr": "NYM", "city": "New York", "league": "NL", "division": "East", "color": "#002D72", "accent": "#FF5910", "emoji": "🍎", "venue": "Citi Field"},
    {"id": "phi", "name": "Philadelphia Phillies", "short": "Phillies", "abbr": "PHI", "city": "Philadelphia", "league": "NL", "division": "East", "color": "#E81828", "accent": "#002D72", "emoji": "🔔", "venue": "Citizens Bank Park"},
    {"id": "wsh", "name": "Washington Nationals", "short": "Nationals", "abbr": "WSH", "city": "Washington", "league": "NL", "division": "East", "color": "#AB0003", "accent": "#14225A", "emoji": "🏛️", "venue": "Nationals Park"},
    # NL Central
    {"id": "chc", "name": "Chicago Cubs", "short": "Cubs", "abbr": "CHC", "city": "Chicago", "league": "NL", "division": "Central", "color": "#0E3386", "accent": "#CC3433", "emoji": "🐻", "venue": "Wrigley Field"},
    {"id": "cin", "name": "Cincinnati Reds", "short": "Reds", "abbr": "CIN", "city": "Cincinnati", "league": "NL", "division": "Central", "color": "#C6011F", "accent": "#000000", "emoji": "🔴", "venue": "Great American Ball Park"},
    {"id": "mil", "name": "Milwaukee Brewers", "short": "Brewers", "abbr": "MIL", "city": "Milwaukee", "league": "NL", "division": "Central", "color": "#12284B", "accent": "#FFC52F", "emoji": "🍺", "venue": "American Family Field"},
    {"id": "pit", "name": "Pittsburgh Pirates", "short": "Pirates", "abbr": "PIT", "city": "Pittsburgh", "league": "NL", "division": "Central", "color": "#27251F", "accent": "#FDB827", "emoji": "🏴‍☠️", "venue": "PNC Park"},
    {"id": "stl", "name": "St. Louis Cardinals", "short": "Cardinals", "abbr": "STL", "city": "St. Louis", "league": "NL", "division": "Central", "color": "#C41E3A", "accent": "#0C2340", "emoji": "🐦", "venue": "Busch Stadium"},
    # NL West
    {"id": "az", "name": "Arizona Diamondbacks", "short": "D-backs", "abbr": "AZ", "city": "Arizona", "league": "NL", "division": "West", "color": "#A71930", "accent": "#E3D4AD", "emoji": "🐍", "venue": "Chase Field"},
    {"id": "col", "name": "Colorado Rockies", "short": "Rockies", "abbr": "COL", "city": "Colorado", "league": "NL", "division": "West", "color": "#33006F", "accent": "#C4CED4", "emoji": "⛰️", "venue": "Coors Field"},
    {"id": "lad", "name": "Los Angeles Dodgers", "short": "Dodgers", "abbr": "LAD", "city": "Los Angeles", "league": "NL", "division": "West", "color": "#005A9C", "accent": "#EF3E42", "emoji": "💙", "venue": "Dodger Stadium"},
    {"id": "sd", "name": "San Diego Padres", "short": "Padres", "abbr": "SD", "city": "San Diego", "league": "NL", "division": "West", "color": "#2F241D", "accent": "#FFC425", "emoji": "🕺", "venue": "Petco Park"},
    {"id": "sf", "name": "San Francisco Giants", "short": "Giants", "abbr": "SF", "city": "San Francisco", "league": "NL", "division": "West", "color": "#FD5A1E", "accent": "#27251F", "emoji": "🌉", "venue": "Oracle Park"},
]

TEAMS_BY_ID = {t["id"]: t for t in ALL_TEAMS}

# Backward-compat aliases
BLUE_JAYS = TEAMS_BY_ID["tor"]
OTHER_TEAMS = [t for t in ALL_TEAMS if t["id"] != "tor"]

COMPARE_TEMPLATES = [
    "The {team} at least look like they know what an outfield is. The {focus} today? Absolute chaos.",
    "Somehow the {focus} are making the {team} look like a dynasty. Sit with that.",
    "Fans of the {team} get bad nights. {focus} fans get existential philosophy papers.",
    "If the {team} are having a rough stretch, the {focus} are having a rough decade — compressed into one afternoon.",
    "The {team} can still say 'wait till next year' with a straight face. {focus} fans are negotiating with next decade.",
    "Compared to {focus_city} right now, the {team} feel like a well-run Fortune 500 company.",
    "Even a {team} fan would look at the {focus} today and whisper: 'yikes, buddy.'",
    "The {team} lose games. The {focus} invent new ways to lose games and file patents.",
    "{focus} baseball today makes a quiet night in {city} feel like a World Series parade.",
    "Relative to the {team}, {focus_city}'s vibes are sitting somewhere between 'haunted stadium' and 'group project with no leader.'",
    "The {team} have bad innings. The {focus} have bad innings that become folklore.",
    "If baseball is theater, the {team} are drama. The {focus} are experimental absurdist performance art.",
    "At least {team} fans can point to a plan. {focus} fans are pointing at a weather map of despair.",
    "The {team} might be mid. The {focus} today are mid-but-somehow-worse, which is a special skill.",
    "Watching the {focus} next to the {team} is like comparing a flat tire to a car that never had wheels.",
]


def get_focus_team(team_id: str | None = None) -> dict[str, str]:
    if team_id and team_id in TEAMS_BY_ID:
        return TEAMS_BY_ID[team_id]
    return BLUE_JAYS


def other_teams(focus_id: str) -> list[dict[str, str]]:
    return [t for t in ALL_TEAMS if t["id"] != focus_id]


def mood_labels_for(focus: dict[str, str]) -> dict[int, str]:
    return {
        1: "Actually fine?",
        2: "Mildly annoyed",
        3: f"Classic {focus['short']}",
        4: f"Sighing in {focus['venue']}",
        5: "Moderately cooked",
        6: "Pretty bad, honestly",
        7: "Spiritually unwell",
        8: "This is a crisis",
        9: "Call the hotline",
        10: "Existential collapse",
    }


def headlines_for(focus: dict[str, str]) -> list[str]:
    return [
        f"{focus['short']} Badness Index: still undefeated at being defeated",
        f"Today's official finding: the {focus['short']} remain scientifically bad",
        f"Breaking: every other MLB team is having a better vibes day than {focus['city']}",
        f"{focus['venue']} weather report: 100% chance of pain",
        f"Daily confirmation: yes, it's still that kind of {focus['short']} day",
        f"Scientists measure {focus['short']} misery. Results: yes.",
        f"The Badness Index has entered the chat — and it's wearing a {focus['abbr']} hat",
        f"Another day, another 29 teams looking relatively competent next to {focus['city']}",
    ]


# Legacy constant used by older code paths
MOOD_LABELS = mood_labels_for(BLUE_JAYS)
HEADLINES = headlines_for(BLUE_JAYS)


def _rng_for(day: str, salt: str = "") -> random.Random:
    h = hashlib.sha256(f"{day}:{salt}".encode()).hexdigest()
    return random.Random(int(h[:16], 16))


def today_iso() -> str:
    return date.today().isoformat()


def daily_badness_score(day: str | None = None, focus_id: str = "tor") -> float:
    """Deterministic 5.5–9.8 score from the date + focus team."""
    day = day or today_iso()
    rng = _rng_for(day, f"badness:{focus_id}")
    d = date.fromisoformat(day)
    weekday_bump = {0: 0.5, 1: 0.25, 2: 0.1, 3: 0.0, 4: -0.15, 5: -0.1, 6: 0.15}.get(
        d.weekday(), 0
    )
    base = rng.uniform(5.8, 9.2) + weekday_bump
    return round(min(9.8, max(5.5, base)), 1)


def build_comparisons(day: str | None = None, focus_id: str = "tor") -> list[dict[str, Any]]:
    day = day or today_iso()
    focus = get_focus_team(focus_id)
    focus_score = daily_badness_score(day, focus_id)
    comparisons = []

    for team in other_teams(focus_id):
        t_rng = _rng_for(day, f"{focus_id}:{team['id']}")
        other_badness = round(t_rng.uniform(1.5, max(2.0, focus_score - 0.8)), 1)
        gap = round(focus_score - other_badness, 1)
        template = t_rng.choice(COMPARE_TEMPLATES)
        blurb = template.format(
            team=team["short"],
            city=team["city"],
            focus=focus["short"],
            focus_city=focus["city"],
        )
        comparisons.append(
            {
                "team": team,
                "focus_badness": focus_score,
                "jays_badness": focus_score,
                "their_badness": other_badness,
                "gap": gap,
                "blurb": blurb,
                "verdict": _verdict(gap),
            }
        )

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


def daily_payload(day: str | None = None, focus_id: str = "tor") -> dict[str, Any]:
    day = day or today_iso()
    focus = get_focus_team(focus_id)
    score = daily_badness_score(day, focus_id)
    moods = mood_labels_for(focus)
    rng = _rng_for(day, f"headline:{focus_id}")
    headline = rng.choice(headlines_for(focus))
    comparisons = build_comparisons(day, focus_id)
    avg_gap = round(sum(c["gap"] for c in comparisons) / len(comparisons), 2)
    worst = comparisons[0]
    closest = comparisons[-1]

    return {
        "date": day,
        "focus": focus,
        "focus_id": focus["id"],
        "headline": headline,
        "official_badness": score,
        "mood_label": moods.get(int(round(score)), "Bad"),
        "blue_jays": focus,
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
        "mood_labels": moods,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
