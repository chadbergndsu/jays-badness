# Blue Jays Daily Badness Index

Daily site that compares how **bad the Toronto Blue Jays** are to **every other MLB team**, lets anyone rate the pain (1–10), and charts the **shared** community data in **Firebase**.

## Live site

**https://chadbergndsu.github.io/jays-badness/**

## Firebase setup (required for shared ratings)

### 1. Create Firestore

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **Build → Firestore Database → Create database**
4. Start in **test mode** (or production — you’ll paste rules next)
5. Pick any region → Enable

### 2. Publish security rules

1. Firestore → **Rules**
2. Paste the contents of `firestore.rules` from this repo
3. **Publish**

### 3. Register a Web app & copy config

1. Project settings (gear) → **Your apps** → **Web** (`</>`)
2. Nickname e.g. `jays-badness` → Register
3. Copy the `firebaseConfig` object

### 4. Paste config into the site

Edit **`docs/firebase-config.js`** (and `public/firebase-config.js` if you keep them in sync):

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123:web:abc..."
};
```

### 5. Push to GitHub

```bash
git add docs/firebase-config.js
git commit -m "Add Firebase config"
git push
```

GitHub Pages will update in a minute or two. The banner should say **Live · ratings syncing via Firebase**.

Then you and your guy in Canada both open the same link — his rating shows up on your charts (and vice versa).

## What gets stored

Collection: `ratings`

| Field | Meaning |
|--------|---------|
| `day` | `YYYY-MM-DD` |
| `rating` | 1–10 |
| `nickname` | display name |
| `note` | optional note |
| `voter_key` | anonymous browser id |
| `created_at` | server timestamp |

Doc id: `{day}__{voter_key}` (one vote per browser per day; updates overwrite).

## Daily email to 3 people (free)

GitHub Actions emails a daily digest every day at **13:00 UTC** (~9 AM Eastern).

**From:** `chadbergndsu@gmail.com`  
**To:**
- jarod.zimmer@railserve.com  
- Andre.obrien@railserve.com  
- kyle.pedretti@railserve.com  

### 1. Create a Gmail App Password (one-time)

1. Sign in as **chadbergndsu@gmail.com**  
2. Turn on [2-Step Verification](https://myaccount.google.com/security)  
3. Create an [App Password](https://myaccount.google.com/apppasswords) → Mail  
4. Copy the 16-character password  

### 2. Add one GitHub secret

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|--------|
| `SMTP_PASS` | the Gmail App Password (not your normal Gmail password) |

### 3. Add the workflow file (if not already on GitHub)

Create file: `.github/workflows/daily-email.yml`  
Paste from your local copy in this repo (or see commit history / README setup).

### 4. Test it

1. Repo → **Actions** → **Daily Badness Email**  
2. **Run workflow** → **Run workflow**  
3. Check the three inboxes  

### Local test (preview only)

```bash
export DRY_RUN=1
python3 scripts/send_daily_email.py
```

## Local preview (website)

```bash
cd docs
python3 -m http.server 8080
```

Open http://127.0.0.1:8080

## Stack

- GitHub Pages (free hosting)
- Firebase Firestore (shared cloud data, free spark tier)
- GitHub Actions (free daily emails)
- Chart.js

Not affiliated with MLB or the Toronto Blue Jays.
