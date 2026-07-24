# Blue Jays Daily Badness Index

A daily website that compares how **bad the Toronto Blue Jays** are relative to **every other MLB team**, lets anyone rate the emotional damage (1–10), and charts the community’s collective despair.

## Features

- **Daily comparisons** — deterministic, date-seeded roasts of the Jays vs all 29 other clubs
- **Feeling ratings** — community 1–10 scale with nicknames and optional notes
- **One vote per browser per day** (you can update it)
- **Charts** — community average over time, today’s distribution, vote volume, all-time misery board
- **Live feed** of today’s ratings

## Run locally

```bash
cd jays-badness
python3 -m pip install -r requirements.txt
python3 server.py
```

Open **http://127.0.0.1:5050**

On first launch the app seeds ~30 days of sample ratings so the graphs aren’t empty. Data is stored in `data/ratings.db` (SQLite).

### Re-seed sample data

```bash
rm -f data/ratings.db
python3 seed.py
python3 server.py
```

## Deploy live (Render)

1. Push this repo to GitHub (already done if you’re reading this on GitHub).
2. Go to [render.com](https://render.com) → **New** → **Blueprint** (or **Web Service**).
3. Connect this repository.
4. Render will use `render.yaml` / the Procfile:
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `gunicorn server:app --bind 0.0.0.0:$PORT --workers 1 --threads 4`
5. Deploy — you’ll get a public URL like `https://jays-badness.onrender.com`.

**Note:** Free-tier disks are ephemeral. SQLite ratings may reset when the free instance spins down. For durable storage later, add a paid disk or a hosted Postgres.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/today` | Today’s official score, 29 comparisons, community stats |
| GET | `/api/stats` | History, distribution, all-time stats |
| POST | `/api/rate` | Submit/update a rating `{ rating, nickname, note, voter_key, date? }` |

## Stack

- **Backend:** Python, Flask, SQLite, Gunicorn  
- **Frontend:** HTML/CSS/JS, Chart.js  

Not affiliated with MLB or the Toronto Blue Jays. Pure vibes.
