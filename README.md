# SHANARTS — Printing Management System

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
├── requirements.txt        # Python deps for ML server
└── .env.example
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

- Copy `.env.example` → `.env` (repo root) and adjust as needed.
- Backend reads `server/.env` for Mongo/JWT/etc.

Key ML variables (see `.env.example`):

- `ML_SERVER_URL=http://127.0.0.1:8000`
- `ML_MODEL_PATH=./ml/saved_model/best_xgboost_delay_model.pkl`
- `ML_LABEL_ENCODER_PATH=./ml/saved_model/label_encoder.pkl`
- `ML_FEATURE_ENGINEER_PATH=./ml/saved_model/feature_engineer.pkl`
- `ML_PREPROCESSOR_PATH=./ml/saved_model/preprocessor.pkl`
- `ML_TIMEOUT_MS=5000`

Ollama variables (backend `server/config/env.js`):

- `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434` or your host)
- `OLLAMA_TEXT_MODEL` (model name available on that host)
- `OLLAMA_API_KEY` (only if your host requires it)

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
cd D:/PrintingSystem/ShanArts
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

