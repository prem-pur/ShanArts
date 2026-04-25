from __future__ import annotations

import os
import time
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sklearn.base import BaseEstimator, TransformerMixin
import __main__


# ==========================================================
# FeatureEngineer (MUST be defined before joblib.load(fe.pkl))
# ==========================================================
class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        date_cols = [
            "Order_Request_Date",
            "Requested_Deadline_Date",
            "Assigned_Date",
            "Estimated_End_Date",
        ]
        for col in date_cols:
            X[col] = pd.to_datetime(X[col], errors="coerce")

        # Core date features
        X["days_to_deadline"] = (X["Requested_Deadline_Date"] - X["Order_Request_Date"]).dt.days
        X["days_to_assign"] = (X["Assigned_Date"] - X["Order_Request_Date"]).dt.days
        X["production_days"] = (X["Estimated_End_Date"] - X["Assigned_Date"]).dt.days
        X["deadline_buffer"] = (X["Requested_Deadline_Date"] - X["Estimated_End_Date"]).dt.days
        X["order_month"] = X["Order_Request_Date"].dt.month
        X["order_dayofweek"] = X["Order_Request_Date"].dt.dayofweek
        X["is_weekend_order"] = (X["order_dayofweek"] >= 5).astype(int)

        # Utilisation ratios
        X["machine_util_ratio"] = X["Active_Machines_Count"] / X["Total_Machines_Count"].replace(0, np.nan)
        X["staff_util_ratio"] = (X["Total_Staff_Count"] - X["Available_Staff_Count"]) / X["Total_Staff_Count"].replace(
            0, np.nan
        )
        X["queue_per_machine"] = X["Current_Queued_Jobs_Count"] / X["Active_Machines_Count"].replace(0, np.nan)
        X["queue_per_staff"] = X["Current_Queued_Jobs_Count"] / X["Available_Staff_Count"].replace(0, np.nan)
        X["staff_machine_ratio"] = X["Available_Staff_Count"] / X["Active_Machines_Count"].replace(0, np.nan)

        # Workload features
        X["avg_workload"] = (X["Assigned_Machine_Workload (%)"] + X["Assigned_Operator_Workload (%)"]) / 2
        X["workload_diff"] = (X["Assigned_Machine_Workload (%)"] - X["Assigned_Operator_Workload (%)"]).abs()
        X["high_workload_flag"] = (X["avg_workload"] >= 80).astype(int)
        X["overload_flag"] = (X["avg_workload"] >= 90).astype(int)

        # Urgency / deadline features
        X["tight_deadline_flag"] = (X["days_to_deadline"] <= 3).astype(int)
        X["is_urgent"] = (X["Priority"] == "Urgent").astype(int)
        X["log_quantity"] = np.log1p(X["Quantity"])

        # Interaction features (critical for 86% accuracy)
        X["workload_x_queue"] = X["avg_workload"] * X["Current_Queued_Jobs_Count"]
        X["urgency_workload"] = X["is_urgent"] * X["avg_workload"]
        X["buffer_per_day"] = X["deadline_buffer"] / (X["production_days"].replace(0, 1))
        X["queue_workload_ratio"] = X["Current_Queued_Jobs_Count"] / (X["avg_workload"].replace(0, 1))

        X = X.drop(columns=date_cols, errors="ignore")
        return X


app = FastAPI(title="SHANARTS Delay Risk Prediction", version="1.0.0")


class PredictRequest(BaseModel):
    Job_Type: str = Field(..., examples=["Brochures"])
    Quantity: float = Field(..., gt=0)
    Color_Type: str = Field(..., examples=["Full Color"])
    Material_Type: str = Field(..., examples=["Glossy Paper"])
    Order_Request_Date: str = Field(..., examples=["2025-04-01"])
    Requested_Deadline_Date: str = Field(..., examples=["2025-04-04"])
    Assigned_Date: str = Field(..., examples=["2025-04-02"])
    Estimated_End_Date: str = Field(..., examples=["2025-04-05"])
    Current_Queued_Jobs_Count: int = Field(..., ge=0)
    Active_Machines_Count: int = Field(..., ge=0)
    Total_Machines_Count: int = Field(..., ge=1)
    Available_Staff_Count: int = Field(..., ge=0)
    Total_Staff_Count: int = Field(..., ge=1)
    Priority: str = Field(default="Normal")
    Assigned_Machine_Workload: float = Field(..., ge=0, le=100)
    Assigned_Operator_Workload: float = Field(..., ge=0, le=100)

    @field_validator(
        "Order_Request_Date",
        "Requested_Deadline_Date",
        "Assigned_Date",
        "Estimated_End_Date",
    )
    @classmethod
    def _iso_date(cls, v: str) -> str:
        d = pd.to_datetime(v, errors="coerce")
        if pd.isna(d):
            raise ValueError("Invalid date. Expected ISO string like YYYY-MM-DD.")
        return v


class PredictResponse(BaseModel):
    delay_risk_label: str
    delay_risk_class: int
    probabilities: Dict[str, float]
    is_high_risk: bool
    confidence: float


class _State:
    def __init__(self) -> None:
        self.started_at = time.time()
        self.loaded_ok = False
        self.last_error: str | None = None
        self.model: Any | None = None
        self.label_encoder: Any | None = None
        self.feature_engineer: Any | None = None
        self.preprocessor: Any | None = None


STATE = _State()


def _env_path(key: str, default: str) -> str:
    v = os.getenv(key, default)
    return str(v).strip()


def load_artifacts() -> None:
    model_path = _env_path("ML_MODEL_PATH", "./ml/saved_model/best_xgboost_delay_model.pkl")
    le_path = _env_path("ML_LABEL_ENCODER_PATH", "./ml/saved_model/label_encoder.pkl")
    fe_path = _env_path("ML_FEATURE_ENGINEER_PATH", "./ml/saved_model/feature_engineer.pkl")
    pp_path = _env_path("ML_PREPROCESSOR_PATH", "./ml/saved_model/preprocessor.pkl")

    try:
        # Some artifacts were pickled referencing __main__.FeatureEngineer.
        # When served via uvicorn, __main__ is uvicorn, so we alias it here for safe unpickling.
        setattr(__main__, "FeatureEngineer", FeatureEngineer)

        # Compatibility shims for older scikit-learn pickles (trained on 1.6.1)
        # so they can load under newer sklearn runtimes.
        try:  # pragma: no cover
            import sklearn.compose._column_transformer as _ct  # type: ignore

            if not hasattr(_ct, "_RemainderColsList"):
                class _RemainderColsList(list):  # noqa: N801
                    pass

                _ct._RemainderColsList = _RemainderColsList  # type: ignore[attr-defined]
        except Exception:
            pass

        STATE.model = joblib.load(model_path)
        STATE.label_encoder = joblib.load(le_path)
        STATE.feature_engineer = joblib.load(fe_path)
        STATE.preprocessor = joblib.load(pp_path)

        # Post-load shim: sklearn 1.8 may expect SimpleImputer._fill_dtype which older pickles lack.
        try:  # pragma: no cover
            from sklearn.impute import SimpleImputer  # type: ignore

            def walk(obj):
                if obj is None:
                    return
                yield obj
                if hasattr(obj, "steps"):
                    for _, s in obj.steps:
                        yield from walk(s)
                if hasattr(obj, "transformers_"):
                    for _, t, _cols in getattr(obj, "transformers_", []):
                        yield from walk(t)
                if hasattr(obj, "named_steps"):
                    for _n, s in obj.named_steps.items():
                        yield from walk(s)

            for o in walk(STATE.preprocessor):
                if isinstance(o, SimpleImputer) and not hasattr(o, "_fill_dtype"):
                    setattr(o, "_fill_dtype", getattr(o, "_fit_dtype", None))
        except Exception:
            pass
        STATE.loaded_ok = True
        STATE.last_error = None
    except Exception as e:
        STATE.loaded_ok = False
        STATE.last_error = str(e)
        STATE.model = None
        STATE.label_encoder = None
        STATE.feature_engineer = None
        STATE.preprocessor = None


@app.on_event("startup")
async def _startup():
    load_artifacts()


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": True, "message": "Validation failed", "detail": {"errors": jsonable_encoder(exc.errors())}},
    )


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": True, "message": "Internal model server error", "detail": {}},
    )


@app.get("/health")
async def health():
    return {
        "ok": STATE.loaded_ok,
        "uptime_s": int(time.time() - STATE.started_at),
        "error": STATE.last_error,
    }


@app.post("/reload")
async def reload():
    load_artifacts()
    if not STATE.loaded_ok:
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "Reload failed", "detail": {"error": STATE.last_error}},
        )
    return {"ok": True}


def _map_to_training_columns(req: PredictRequest) -> pd.DataFrame:
    row = req.model_dump()
    mapped = {
        "Job_Type": row["Job_Type"],
        "Quantity": float(row["Quantity"]),
        "Color_Type (BW / Full Color)": row["Color_Type"],
        "Material_Type": row["Material_Type"],
        "Order_Request_Date": row["Order_Request_Date"],
        "Requested_Deadline_Date": row["Requested_Deadline_Date"],
        "Assigned_Date": row["Assigned_Date"],
        "Estimated_End_Date": row["Estimated_End_Date"],
        "Current_Queued_Jobs_Count": int(row["Current_Queued_Jobs_Count"]),
        "Active_Machines_Count": int(row["Active_Machines_Count"]),
        "Total_Machines_Count": int(row["Total_Machines_Count"]),
        "Available_Staff_Count": int(row["Available_Staff_Count"]),
        "Total_Staff_Count": int(row["Total_Staff_Count"]),
        "Priority": row.get("Priority") or "Normal",
        "Assigned_Machine_Workload (%)": float(row["Assigned_Machine_Workload"]),
        "Assigned_Operator_Workload (%)": float(row["Assigned_Operator_Workload"]),
    }
    return pd.DataFrame([mapped])


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    if (
        not STATE.loaded_ok
        or STATE.model is None
        or STATE.label_encoder is None
        or STATE.feature_engineer is None
        or STATE.preprocessor is None
    ):
        return JSONResponse(status_code=503, content={"error": True, "message": "Model artifacts not loaded", "detail": {}})

    df = _map_to_training_columns(req)

    try:
        engineered = STATE.feature_engineer.transform(df)
        X = STATE.preprocessor.transform(engineered)
        proba = STATE.model.predict_proba(X)[0]
        pred_class = int(STATE.model.predict(X)[0])
        label = str(STATE.label_encoder.inverse_transform([pred_class])[0])

        classes = list(getattr(STATE.label_encoder, "classes_", ["High", "Low", "Medium"]))
        probs: Dict[str, float] = {"High": 0.0, "Low": 0.0, "Medium": 0.0}
        for i, c in enumerate(classes):
            if i < len(proba):
                probs[str(c)] = float(proba[i])

        confidence = float(np.max(proba)) if len(proba) else 0.0
        return PredictResponse(
            delay_risk_label=label,
            delay_risk_class=pred_class,
            probabilities=probs,
            is_high_risk=(label == "High"),
            confidence=confidence,
        )
    except Exception:
        return JSONResponse(status_code=500, content={"error": True, "message": "Prediction failed", "detail": {}})

