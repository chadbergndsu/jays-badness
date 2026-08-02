#!/usr/bin/env python3
"""Build and send the daily Blue Jays Badness Index email."""

from __future__ import annotations

import html
import json
import os
import smtplib
import ssl
import sys
import urllib.error
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# Allow importing teams.py from repo root
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from teams import daily_payload  # noqa: E402

SITE_URL = os.environ.get(
    "SITE_URL", "https://chadbergndsu.github.io/jays-badness/"
)
FIRESTORE_PROJECT = os.environ.get("FIRESTORE_PROJECT", "blue-jays-a16f1")


def fetch_community_stats(day: str) -> dict:
    """Pull public ratings from Firestore REST (read-only)."""
    url = (
        f"https://firestore.googleapis.com/v1/projects/{FIRESTORE_PROJECT}"
        f"/databases/(default)/documents/ratings?pageSize=300"
    )
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        print(f"Note: could not load Firestore ratings ({e})")
        return {"count": 0, "average": None, "top": []}

    ratings_today = []
    for doc in data.get("documents", []):
        fields = doc.get("fields", {})
        d = (fields.get("day") or {}).get("stringValue")
        if d != day:
            continue
        rating = (fields.get("rating") or {}).get("integerValue")
        if rating is None:
            rating = (fields.get("rating") or {}).get("doubleValue")
        if rating is None:
            continue
        rating = int(float(rating))
        nick = (fields.get("nickname") or {}).get("stringValue") or "Anonymous"
        note = (fields.get("note") or {}).get("stringValue") or ""
        ratings_today.append({"rating": rating, "nickname": nick, "note": note})

    if not ratings_today:
        return {"count": 0, "average": None, "top": []}

    avg = round(sum(r["rating"] for r in ratings_today) / len(ratings_today), 2)
    top = sorted(ratings_today, key=lambda r: r["rating"], reverse=True)[:5]
    return {"count": len(ratings_today), "average": avg, "top": top}


def build_email(payload: dict, community: dict) -> tuple[str, str, str]:
    day = payload["date"]
    score = payload["official_badness"]
    mood = payload["mood_label"]
    headline = payload["headline"]
    summary = payload["summary"]
    worst = summary["worst_matchup"]
    closest = summary["closest_matchup"]
    top3 = payload["comparisons"][:3]

    subject = f"Blue Jays Badness {score}/10 — {day}"

    avg_line = (
        f"Community average today: {community['average']} "
        f"({community['count']} votes)"
        if community.get("average") is not None
        else "No community votes yet today."
    )

    text_lines = [
        "Blue Jays Daily Badness Index",
        "=" * 40,
        headline,
        "",
        f"Date: {day}",
        f"Official badness: {score}/10 — {mood}",
        avg_line,
        f"Avg gap vs field: +{summary['avg_gap']}",
        f"Worst matchup: {worst['team']} (+{worst['gap']})",
        f"Closest matchup: {closest['team']} (+{closest['gap']})",
        "",
        "Top gaps today:",
    ]
    for c in top3:
        text_lines.append(
            f"  • vs {c['team']['short']}: +{c['gap']} — {c['verdict']}"
        )
        text_lines.append(f"    {c['blurb']}")
    text_lines += [
        "",
        f"Rate it yourself: {SITE_URL}",
        "",
        "— Automated daily digest from jays-badness",
    ]
    text_body = "\n".join(text_lines)

    cards = []
    for c in top3:
        cards.append(
            f"""
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                <div style="font-weight:700;color:#0a1f44;font-size:16px;">
                  vs {html.escape(c['team']['short'])}
                  <span style="color:#e31937;">+{c['gap']}</span>
                </div>
                <div style="color:#64748b;font-size:12px;margin:4px 0;">
                  {html.escape(c['verdict'])}
                </div>
                <div style="color:#334155;font-size:14px;line-height:1.4;">
                  {html.escape(c['blurb'])}
                </div>
              </td>
            </tr>"""
        )

    feed_html = ""
    if community.get("top"):
        items = []
        for r in community["top"]:
            note = f" — {html.escape(r['note'])}" if r.get("note") else ""
            items.append(
                f"<li><strong>{r['rating']}/10</strong> "
                f"{html.escape(r['nickname'])}{note}</li>"
            )
        feed_html = f"""
        <h3 style="color:#0a1f44;margin:24px 0 8px;">Community pain</h3>
        <ul style="color:#334155;padding-left:18px;">{"".join(items)}</ul>
        """

    html_body = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#e8eef8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8eef8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;">
          <tr>
            <td style="background:#0a1f44;color:#fff;padding:20px 24px;">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#93c5fd;">
                Toronto Blue Jays
              </div>
              <div style="font-size:22px;font-weight:700;margin-top:4px;">
                Daily Badness Index
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 8px;color:#134a8e;font-weight:600;">
                {html.escape(headline)}
              </p>
              <p style="margin:0 0 4px;color:#64748b;font-size:13px;">{html.escape(day)}</p>
              <div style="font-size:48px;font-weight:800;color:#e31937;line-height:1;">
                {score}<span style="font-size:20px;color:#64748b;">/10</span>
              </div>
              <div style="color:#0a1f44;font-weight:700;margin:6px 0 16px;">
                {html.escape(mood)}
              </div>
              <p style="color:#334155;margin:0 0 8px;">{html.escape(avg_line)}</p>
              <p style="color:#334155;margin:0 0 4px;">
                Avg gap vs field: <strong>+{summary['avg_gap']}</strong>
              </p>
              <p style="color:#334155;margin:0 0 4px;">
                Worst: <strong>{html.escape(worst['team'])}</strong> (+{worst['gap']})
              </p>
              <p style="color:#334155;margin:0 0 16px;">
                Closest: <strong>{html.escape(closest['team'])}</strong> (+{closest['gap']})
              </p>
              <h3 style="color:#0a1f44;margin:8px 0;">Top gaps today</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                {"".join(cards)}
              </table>
              {feed_html}
              <p style="margin:28px 0 0;text-align:center;">
                <a href="{html.escape(SITE_URL)}"
                   style="display:inline-block;background:#e31937;color:#fff;
                          text-decoration:none;font-weight:700;padding:12px 22px;
                          border-radius:10px;">
                  Rate today's pain
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center;">
              Automated digest · not affiliated with MLB or the Blue Jays
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    return subject, text_body, html_body


DEFAULT_RECIPIENTS = (
    "jarod.zimmer@railserve.com,"
    "Andre.obrien@railserve.com,"
    "kyle.pedretti@railserve.com"
)
DEFAULT_FROM = "chadbergndsu@gmail.com"


def _clean_secret(value: str) -> str:
    """Strip copy-paste junk (NBSP, zero-width spaces, etc.) from secrets."""
    if not value:
        return ""
    # Common when pasting Gmail app passwords from the browser
    for ch in ("\xa0", "\u200b", "\u200c", "\u200d", "\ufeff"):
        value = value.replace(ch, " ")
    # Gmail app passwords are 16 letters; spaces are optional and ignored
    return "".join(value.split())


def send_email(subject: str, text_body: str, html_body: str) -> None:
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    port = int(os.environ.get("SMTP_PORT", "587").strip() or "587")
    user = _clean_secret(os.environ.get("SMTP_USER", DEFAULT_FROM))
    # Keep @ in email: only clean password fully; user is email
    user = os.environ.get("SMTP_USER", DEFAULT_FROM)
    for ch in ("\xa0", "\u200b", "\ufeff"):
        user = user.replace(ch, "")
    user = user.strip()
    password = _clean_secret(os.environ.get("SMTP_PASS", ""))
    from_addr = os.environ.get("EMAIL_FROM", DEFAULT_FROM)
    for ch in ("\xa0", "\u200b", "\ufeff"):
        from_addr = from_addr.replace(ch, "")
    from_addr = from_addr.strip() or user
    to_raw = os.environ.get("EMAIL_TO", DEFAULT_RECIPIENTS)
    recipients = [e.strip() for e in to_raw.replace(";", ",").split(",") if e.strip()]
    if not recipients:
        raise SystemExit("EMAIL_TO is empty")
    if not password and os.environ.get("DRY_RUN", "").lower() not in (
        "1",
        "true",
        "yes",
    ):
        raise SystemExit(
            "SMTP_PASS is required (Gmail App Password for chadbergndsu@gmail.com)"
        )
    # Helpful debug without leaking the password
    print(f"SMTP login as {user!r} (password length {len(password)}, ascii={password.isascii()})")

    dry = os.environ.get("DRY_RUN", "").lower() in ("1", "true", "yes")
    if dry:
        print("DRY_RUN=1 — not sending. Would email:")
        print("  To:", ", ".join(recipients))
        print("  Subject:", subject)
        print(text_body)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=30) as server:
        server.starttls(context=context)
        server.login(user, password)
        server.sendmail(from_addr, recipients, msg.as_string())

    print(f"Sent to {len(recipients)} recipient(s): {', '.join(recipients)}")


def main() -> None:
    payload = daily_payload()
    community = fetch_community_stats(payload["date"])
    subject, text_body, html_body = build_email(payload, community)
    print(f"Built email for {payload['date']} — score {payload['official_badness']}")
    send_email(subject, text_body, html_body)


if __name__ == "__main__":
    main()
