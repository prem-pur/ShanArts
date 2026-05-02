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

## Delay risk (summary)

Schedule Manager calls the ML service; results are stored on `ShopOrder` (`delayRiskLevel`, confidence, probabilities, timestamp). **High** risk notifies admins and can trigger deadline updates and customer messaging; **Medium** notifies customers. Message copy can use Ollama when configured.

## API surface

REST under `/api` (auth, shop orders, inventory, billing, predictions, etc.). Inspect `server` routes and controllers for the full list.

Other docs in repo: `GIT_SETUP.md`, `TEAM_BRANCHES.md`.
