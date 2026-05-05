# ShanArts — Printing management system

Full-stack app for **Shan Art Advertising**: orders, scheduling, inventory, billing, notifications, and optional **ML-based job delay risk** (XGBoost + FastAPI).

_SLIIT IT2021-AIML module project._

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React (CRA), port **3000** |
| API | Node.js, Express, MongoDB, JWT — port **5001** |
| ML | FastAPI + scikit-learn / XGBoost — port **8000** (localhost) |
| Optional | PM2 (`ecosystem.config.js`) |

## Repo layout

```
client/     React UI
server/     Express API + uploads
ml/         Model server (saved_model/, model_server.py)
```

## Prerequisites

Node.js + npm, MongoDB, Python 3.10+ (for ML).

## Quick start

**1. Dependencies**

```bash
npm run install-all
py -m pip install -r requirements.txt
```

**2. Config (local only — never commit these)**

Create `server/.env` and `client/.env.development` (both are gitignored). Minimal examples:

`server/.env` — required core:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/printing_db
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
NODE_ENV=development
FILE_UPLOAD_PATH=./public/uploads
```

`server/.env` — optional (Google AI, Ollama, ML paths): see `server/config/env.js` for names and defaults. For delay prediction, add e.g. `ML_SERVER_URL`, `ML_MODEL_PATH`, `ML_LABEL_ENCODER_PATH`, `ML_FEATURE_ENGINEER_PATH`, `ML_PREPROCESSOR_PATH`, `ML_TIMEOUT_MS`.

`client/.env.development`:

```env
REACT_APP_GOOGLE_CLIENT_ID=
REACT_APP_API_BASE_URL=http://localhost:5001
```

Use the same Google client ID string as `GOOGLE_CLIENT_ID` on the server.

**3. Run**

```bash
# Terminal A — API
cd server && npm run dev

# Terminal B — UI
cd client && npm start

# Terminal C — ML (from repo root)
py -m uvicorn ml.model_server:app --host 127.0.0.1 --port 8000
```

**All-in-one (optional):** `pm2 start ecosystem.config.js`

## URLs

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| API health | http://127.0.0.1:5001/api/health |
| ML health | http://127.0.0.1:8000/health |

## Deployment (Vercel + Railway)

This repo is structured as:

- `client/`: React (CRA) frontend — deploy to **Vercel**
- `server/`: Express API — deploy to **Railway** (or any Node host)

### Backend (Railway)

- Deploy the `server/` service.
- Ensure the API listens on `process.env.PORT` (this repo already does).
- Verify it’s live by opening:
  - `/api/health` → should return JSON like `{"status":"ok", ...}`

Required environment variables on Railway (server):

```env
MONGO_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=...   # Google OAuth Web client id (same value used by frontend)
```

### Frontend (Vercel)

Set these environment variables in Vercel **Production** (and **Preview** if you want preview links to work too):

```env
REACT_APP_API_BASE_URL=https://<your-railway-domain>
REACT_APP_GOOGLE_CLIENT_ID=<your-google-web-client-id>
```

Important:

- `REACT_APP_API_BASE_URL` **must** be the backend base URL (example: `https://shanarts-production.up.railway.app`)
- The variable name must be **exactly** `REACT_APP_API_BASE_URL`
  - A common mistake is creating `REACT_APP_APP1_BASE_URL` (the frontend will ignore it and you’ll get 404/405 on login)
- Prefer **no trailing slash** in the URL value.

After changing env vars, **Redeploy** the Vercel deployment.

## Google Sign-In (GSI) troubleshooting

The frontend uses Google Identity Services via `@react-oauth/google`. These are the common production errors and fixes:

- **Error 400: `origin_mismatch`**
  - **Cause**: Deployed domain is not allowed in Google OAuth client.
  - **Fix**: In Google Cloud Console → Credentials → your **OAuth 2.0 Web client** → add
    - Authorized JavaScript origins:
      - `https://<your-vercel-domain>` (example: `https://shan-arts.vercel.app`)
      - `http://localhost:3000` (local dev)

- **“Wrong recipient, payload audience != requiredAudience”**
  - **Cause**: Frontend created the Google token with one Client ID, but backend verifies against a different Client ID.
  - **Fix**: Use the **same** Google OAuth Web Client ID for:
    - Vercel `REACT_APP_GOOGLE_CLIENT_ID`
    - Railway `GOOGLE_CLIENT_ID`

- **Login returns 404/405 from deployed site**
  - **Cause**: Frontend is calling the wrong API base URL (often because `REACT_APP_API_BASE_URL` is missing or misspelled).
  - **Fix**: Set `REACT_APP_API_BASE_URL` to your backend domain and redeploy.

## Delay risk (summary)

Schedule Manager calls the ML service; results are stored on `ShopOrder` (`delayRiskLevel`, confidence, probabilities, timestamp). **High** risk notifies admins and can trigger deadline updates and customer messaging; **Medium** notifies customers. Message copy can use Ollama when configured.

## API surface

REST under `/api` (auth, shop orders, inventory, billing, predictions, etc.). Inspect `server` routes and controllers for the full list.

Other docs in repo: `GIT_SETUP.md`, `TEAM_BRANCHES.md`.
