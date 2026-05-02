# SHANARTS — Printing Management System

**Academic context**: This repository is part of the **SLIIT IT2021-AIML module project**.

Production-grade management system for **Shan Art Advertising** covering customer orders, scheduling, inventory, billing, feedback/notifications, and AI-assisted workflows.

## Key features

- **Order lifecycle**: customer order intake → design workflow → approval → scheduling → production → completion
- **Schedule manager**: assign operators/machines, timeline view, conflict checks
- **Delay risk prediction (XGBoost)**: FastAPI model server + risk badges in Schedule UI
- **Automated notifications**: admin + customer notifications stored in MongoDB
- **AI customer messages (Ollama)**:
  - design sending message generator (staff → customer)
  - delay-risk and deadline communications (admin → customer)

## Tech stack

- **Frontend**: React (Create React App)
- **Backend**: Node.js + Express + MongoDB (Mongoose) + JWT auth
- **ML service**: FastAPI + scikit-learn + XGBoost (local only, `127.0.0.1:8000`)
- **Process manager (optional)**: PM2 (`ecosystem.config.js`)

## Repository structure

```
ShanArts/
├── client/                 # React app (port 3000)
├── server/                 # Express API (port 5001)
├── ml/                     # FastAPI model server (port 8000)
│   ├── saved_model/        # Model artifacts (4 files)
│   └── model_server.py
├── ecosystem.config.js     # PM2 processes: ml-server + node-app
└── requirements.txt        # Python deps for ML server
```

## Prerequisites

- Node.js + npm
- MongoDB (local or Atlas)
- Python 3.10+ recommended for ML server

## Setup

### Install dependencies

```bash
npm run install-all
py -m pip install -r requirements.txt
```

### Environment variables

Do **not** commit `server/.env`, `client/.env.development`, or any file that holds real secrets. Create these files locally (they are listed in `.gitignore`).

#### `server/.env` (backend — create under `server/`)

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/printing_db
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=

# Optional: Google Sign-In / Gemini (see server/config/env.js)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GEMINI_FALLBACK_MODEL=

AI_VISION_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_API_KEY=
OLLAMA_API_AUTH=bearer
OLLAMA_VISION_MODEL=llava
OLLAMA_TEXT_MODEL=llama3

NODE_ENV=development
FILE_UPLOAD_PATH=./public/uploads

# ML / delay predictor (optional — localhost FastAPI)
ML_SERVER_URL=http://127.0.0.1:8000
ML_MODEL_PATH=./ml/saved_model/best_xgboost_delay_model.pkl
ML_LABEL_ENCODER_PATH=./ml/saved_model/label_encoder.pkl
ML_FEATURE_ENGINEER_PATH=./ml/saved_model/feature_engineer.pkl
ML_PREPROCESSOR_PATH=./ml/saved_model/preprocessor.pkl
ML_TIMEOUT_MS=5000
```

#### `client/.env.development` (frontend — create under `client/`)

```env
REACT_APP_GOOGLE_CLIENT_ID=
REACT_APP_API_BASE_URL=http://localhost:5001
```

Use the same `GOOGLE_CLIENT_ID` value as `GOOGLE_CLIENT_ID` in `server/.env`. Adjust `REACT_APP_API_BASE_URL` if your API port differs.

For optional AI/Ollama tuning, see **`server/config/env.js`**.

## Run (development)

### Frontend

```bash
cd client
npm start
```

### Backend

```bash
cd server
npm run dev
```

### ML server

```bash
# from repository root
py -m uvicorn ml.model_server:app --host 127.0.0.1 --port 8000
```

## Run with PM2 (recommended for local “all-in-one”)

```bash
pm2 start ecosystem.config.js
pm2 status
```

## Service URLs

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://127.0.0.1:5001/api/health`
- **ML**: `http://127.0.0.1:8000/health`

## Delay risk flow (Schedule Manager)

Risk is stored on `ShopOrder`:

- `delayRiskLevel` (`High|Medium|Low`)
- `delayRiskConfidence`
- `delayRiskProbabilities`
- `delayRiskPredictedAt`

### High risk

- Admins receive a notification when risk becomes **High**.
- Admin can set a new deadline; the system:
  - generates a customer message (Ollama)
  - sends a customer notification
  - shows a customer popup until acknowledged

### Medium risk

- Customer receives a “schedule update” notification and popup (Ollama-generated).

## Useful API endpoints (high level)

- `POST /api/auth/login`
- `GET /api/shop-orders` (staff)
- `GET /api/shop-orders/my` (customer)
- `PATCH /api/shop-orders/:id/assign`
- `PATCH /api/shop-orders/:id/reschedule`
- `POST /api/predict` (proxy to ML server)
- `PATCH /api/shop-orders/:id/admin-set-deadline` (admin/staff_schedule)
- `PATCH /api/shop-orders/:id/ack-design-message` (customer)
- `PATCH /api/shop-orders/:id/ack-deadline-update` (customer)
- `PATCH /api/shop-orders/:id/ack-delay-risk` (customer)

