"""Blue Jays Daily Badness Index — Flask API + static frontend."""

from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from db import all_time_stats, day_stats, history, init_db, upsert_rating
from teams import daily_payload, today_iso

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"

app = Flask(__name__, static_folder=str(PUBLIC), static_url_path="")


def bootstrap() -> None:
    """Create DB and seed sample history if empty."""
    init_db()
    if all_time_stats()["total_ratings"] == 0:
        from seed import seed

        seed()


# Run on import so gunicorn workers also initialize the DB.
bootstrap()


@app.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp


@app.route("/")
def index():
    return send_from_directory(PUBLIC, "index.html")


@app.route("/api/health")
def health():
    return jsonify({"ok": True, "service": "jays-badness"})


@app.route("/api/today")
def api_today():
    day = request.args.get("date") or today_iso()
    payload = daily_payload(day)
    stats = day_stats(day)
    payload["community"] = stats
    return jsonify(payload)


@app.route("/api/stats")
def api_stats():
    day = request.args.get("date") or today_iso()
    return jsonify(
        {
            "today": day_stats(day),
            "history": history(90),
            "all_time": all_time_stats(),
        }
    )


@app.route("/api/rate", methods=["POST", "OPTIONS"])
def api_rate():
    if request.method == "OPTIONS":
        return ("", 204)
    data = request.get_json(silent=True) or {}
    day = (data.get("date") or today_iso()).strip()
    try:
        rating = int(data.get("rating"))
    except (TypeError, ValueError):
        return jsonify({"error": "Rating must be an integer 1–10"}), 400
    nickname = data.get("nickname") or "Anonymous"
    note = data.get("note") or ""
    voter_key = data.get("voter_key") or ""
    try:
        row = upsert_rating(day, rating, nickname, note, voter_key)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"ok": True, "rating": row, "community": day_stats(day)})


def main():
    port = int(os.environ.get("PORT", "5050"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Blue Jays Badness Index → http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)


if __name__ == "__main__":
    main()
