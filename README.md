# Blue Jays Daily Badness Index

Daily site that compares how **bad the Toronto Blue Jays** are to **every other MLB team**, lets you rate the pain (1–10), and charts the data.

## Live site (free)

**https://chadbergndsu.github.io/jays-badness/**

Anyone (Canada included) can open that link in a browser. No install, no account, no cost.

- Same daily comparisons for everyone (based on the date)
- Ratings & charts save **in that browser** on their device

## Source

Repo: https://github.com/chadbergndsu/jays-badness

Static files live in `docs/` (served by GitHub Pages) and `public/`.

## Run locally (optional)

Just open `docs/index.html` in a browser, or:

```bash
cd docs && python3 -m http.server 8080
```

Then visit http://127.0.0.1:8080

Optional Flask + SQLite server (for a shared database on one machine):

```bash
python3 -m pip install -r requirements.txt
python3 server.py
```

## Stack

HTML, CSS, JavaScript, Chart.js — hosted free on **GitHub Pages**.

Not affiliated with MLB or the Toronto Blue Jays.
